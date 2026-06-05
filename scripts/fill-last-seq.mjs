// ─────────────────────────────────────────────────────────────
// routes.last_seq(종점 구간순번) 채우기 — 공공 API 키 활성화 후 1회 실행
// "노선정보조회 - 노선별 정류소 목록(getStaionByRoute)"으로 노선별 최대 seq를 구해
// Supabase routes 테이블에 직접 UPDATE 한다.
//
// 사전조건: 공공 API 키 활성화(headerCd "0"). 미활성이면 즉시 중단.
// 실행: node scripts/fill-last-seq.mjs
// ─────────────────────────────────────────────────────────────
import pg from "pg";
import { readFileSync } from "fs";

const root = new URL("..", import.meta.url);
const env = {};
for (const line of readFileSync(new URL(".env.local", root), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
}

const KEY = env.PUBLIC_DATA_API_KEY;
if (!KEY) {
  console.error(".env.local 에 PUBLIC_DATA_API_KEY 가 없습니다.");
  process.exit(1);
}

const ENDPOINTS = [
  "https://ws.bus.go.kr/api/rest/busRouteInfo/getStaionByRoute",
  "http://ws.bus.go.kr/api/rest/busRouteInfo/getStaionByRoute",
];

const client = new pg.Client({
  host: env.SUPABASE_DB_HOST,
  port: Number(env.SUPABASE_DB_PORT || 5432),
  user: env.SUPABASE_DB_USER,
  password: env.SUPABASE_DB_PASSWORD,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

// 노선별 종점 구간순번(최대 seq) 조회. https/http 동시 요청 → 먼저 성공.
async function lastSeqOf(rid) {
  const qs = new URLSearchParams({ serviceKey: KEY, busRouteId: rid, resultType: "json" }).toString();
  const fetchOne = async (base) => {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 6000);
    try {
      const res = await fetch(`${base}?${qs}`, { signal: ac.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } finally {
      clearTimeout(t);
    }
  };
  const j = await Promise.any(ENDPOINTS.map(fetchOne));
  const cd = String(j?.msgHeader?.headerCd ?? "");
  const msg = j?.msgHeader?.headerMsg ?? "";
  if (cd === "7" || /인증|REGISTERED/i.test(msg)) throw new Error("AUTH_FAIL: " + msg);
  if (cd && cd !== "0") return null;
  const raw = j?.msgBody?.itemList;
  const items = Array.isArray(raw) ? raw : raw ? [raw] : [];
  if (!items.length) return null;
  return items.reduce((m, it) => Math.max(m, Number(it.seq ?? 0)), 0);
}

async function main() {
  await client.connect();
  const { rows } = await client.query(
    "select route_id from public.routes where last_seq is null order by route_id",
  );
  console.log(`대상 노선(미수집): ${rows.length}`);
  if (!rows.length) {
    console.log("이미 모두 채워져 있습니다.");
    await client.end();
    return;
  }

  const ids = rows.map((r) => r.route_id);
  const CONCURRENCY = 5;
  let i = 0, ok = 0, done = 0;

  async function worker() {
    while (i < ids.length) {
      const rid = ids[i++];
      try {
        const seq = await lastSeqOf(rid);
        if (seq && seq > 0) {
          await client.query("update public.routes set last_seq = $1 where route_id = $2", [seq, rid]);
          ok++;
        }
      } catch (e) {
        if (String(e).includes("AUTH_FAIL")) {
          console.error("\n중단: 공공 API 키가 아직 활성화되지 않았습니다. 동기화 후 다시 실행하세요.");
          process.exit(1);
        }
        // 개별 노선 실패는 건너뜀
      }
      if (++done % 50 === 0) console.log(`진행 ${done}/${ids.length} (성공 ${ok})`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const left = await client.query("select count(*)::int n from public.routes where last_seq is null");
  console.log(`\n완료: ${ok}개 노선 last_seq 채움. 남은 미수집: ${left.rows[0].n}`);
  await client.end();
}

main().catch(async (e) => {
  console.error("실패:", e.message);
  try { await client.end(); } catch {}
  process.exit(1);
});
