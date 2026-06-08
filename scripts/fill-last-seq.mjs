// ─────────────────────────────────────────────────────────────
// routes 의 last_seq(종점 구간순번) + route_type(노선유형) + stations(정류장 목록) 채우기
//   — 공공 API 키 활성화 후 실행. 세 값 중 하나라도 비어 있는 노선만 처리(idempotent).
// "노선정보조회 - 노선별 정류소 목록(getStaionByRoute)" 1회 호출로
//   · 최대 seq(종점 구간순번) · routeType(1공항/2마을/3간선/4지선/5순환/6광역/15심야)
//   · 정류장 목록 [{seq, nm}] (마을버스 회차지 표시용)
//   을 함께 얻어 Supabase routes 테이블에 직접 UPDATE 한다.
//
// 사전조건: 공공 API 키 활성화(headerCd "0"). 미활성이면 즉시 중단.
// 실행(로컬): node scripts/fill-last-seq.mjs   (.env.local 사용)
// 실행(CI):  process.env(GitHub Actions secrets)에서 동일 키를 읽음.
// ─────────────────────────────────────────────────────────────
import pg from "pg";
import { readFileSync } from "fs";

const root = new URL("..", import.meta.url);
// 로컬은 .env.local, CI(GitHub Actions)는 process.env(secrets) 사용.
const env = { ...process.env };
try {
  for (const line of readFileSync(new URL(".env.local", root), "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
} catch {
  console.log(".env.local 없음 → process.env(환경변수/secrets) 사용");
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

// 노선별 종점 구간순번(최대 seq) + 노선유형(routeType) 조회. https/http 동시 요청 → 먼저 성공.
async function infoOf(rid) {
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
  const seq = items.reduce((m, it) => Math.max(m, Number(it.seq ?? 0)), 0);
  const routeType = items[0]?.routeType ? String(items[0].routeType) : null;
  // 정류장 목록(순번 오름차순) — 마을버스 회차지/현재정류장 표시용.
  const stations = items
    .map((it) => ({ seq: Number(it.seq ?? 0), nm: String(it.stationNm ?? "") }))
    .filter((s) => s.nm)
    .sort((a, b) => a.seq - b.seq);
  return { seq, routeType, stations };
}

async function main() {
  await client.connect();
  const { rows } = await client.query(
    "select route_id from public.routes where last_seq is null or route_type is null or stations is null order by route_id",
  );
  console.log(`대상 노선(last_seq/route_type/stations 중 미수집): ${rows.length}`);
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
        const info = await infoOf(rid);
        if (info && (info.seq > 0 || info.routeType || info.stations.length)) {
          // 기존 값 보존: null 이 아닌 새 값이 있을 때만 덮어씀(coalesce)
          const stationsJson = info.stations.length ? JSON.stringify(info.stations) : null;
          await client.query(
            "update public.routes set last_seq = coalesce($1, last_seq), route_type = coalesce($2, route_type), stations = coalesce($3::jsonb, stations) where route_id = $4",
            [info.seq > 0 ? info.seq : null, info.routeType, stationsJson, rid],
          );
          ok++;
        }
      } catch (e) {
        if (String(e).includes("AUTH_FAIL")) {
          // 성공 이력이 전혀 없을 때만 "키 미활성"으로 보고 중단.
          // 이미 성공한 게 있으면 부하/일시 오류로 보고 해당 노선만 건너뜀.
          if (ok === 0) {
            console.error("\n중단: 공공 API 키가 아직 활성화되지 않았습니다. 동기화 후 다시 실행하세요.");
            process.exit(1);
          }
        }
        // 개별 노선 실패는 건너뜀
      }
      if (++done % 50 === 0) console.log(`진행 ${done}/${ids.length} (성공 ${ok})`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const left = await client.query(
    "select count(*)::int n from public.routes where last_seq is null or route_type is null or stations is null",
  );
  console.log(`\n완료: ${ok}개 노선 갱신. 남은 미수집: ${left.rows[0].n}`);
  await client.end();
}

main().catch(async (e) => {
  console.error("실패:", e.message);
  try { await client.end(); } catch {}
  process.exit(1);
});
