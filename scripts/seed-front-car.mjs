// ─────────────────────────────────────────────────────────────
// 앞차(같은 노선 바로 앞 차량) 아침 1회 시드
//   시내버스(간선3·지선4·순환5·광역6·심야15) 노선만 위치를 1회 조회하여,
//   각 차량의 "바로 앞차"를 그날(KST)자로 front_car_log 에 기록한다.
//   GPS/LTE 신호가 끊긴 차량도 아침에 잡아둔 앞차로 위치를 가늠할 수 있게 하는 용도.
//   ※ 마을버스(2)는 제외(요청). 낮 동안은 검색 API가 같은 테이블을 덮어쓰며 최신 유지.
//
// 실행(로컬): node scripts/seed-front-car.mjs   (.env.local 사용)
// 실행(CI):  GitHub Actions 매일 07:00 KST. secrets 에서 키를 읽음.
// ─────────────────────────────────────────────────────────────
import pg from "pg";
import { readFileSync } from "fs";

const root = new URL("..", import.meta.url);
const env = { ...process.env };
try {
  for (const line of readFileSync(new URL(".env.local", root), "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
} catch {
  console.log(".env.local 없음 → process.env(secrets) 사용");
}

const KEY = env.PUBLIC_DATA_API_KEY;
if (!KEY) {
  console.error("PUBLIC_DATA_API_KEY 가 없습니다.");
  process.exit(1);
}

const ENDPOINTS = [
  "https://ws.bus.go.kr/api/rest/buspos/getBusPosByRtid",
  "http://ws.bus.go.kr/api/rest/buspos/getBusPosByRtid",
];

// 시내버스 노선유형(마을2·공항1 제외).
const CITY_TYPES = ["3", "4", "5", "6", "15"];

// 한국시간(KST) 운행일 "YYYY-MM-DD".
const SERVICE_DATE = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);

// Pool 사용: 워커가 동시에 upsert 하므로 단일 Client(동시 쿼리 불가) 대신 연결 풀로.
const pool = new pg.Pool({
  host: env.SUPABASE_DB_HOST,
  port: Number(env.SUPABASE_DB_PORT || 5432),
  user: env.SUPABASE_DB_USER,
  password: env.SUPABASE_DB_PASSWORD,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
  max: 8,
});

// 노선 1개의 실시간 버스 위치 목록. https/http 동시 요청 → 먼저 성공.
async function positionsOf(rid) {
  const qs = new URLSearchParams({ serviceKey: KEY, busRouteId: rid, resultType: "json" }).toString();
  const fetchOne = async (base) => {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 6000);
    try {
      const res = await fetch(`${base}?${qs}`, { cache: "no-store", signal: ac.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } finally {
      clearTimeout(t);
    }
  };
  const json = await Promise.any(ENDPOINTS.map(fetchOne));
  const headerCd = String(json?.msgHeader?.headerCd ?? "");
  const headerMsg = json?.msgHeader?.headerMsg ?? "";
  if (headerCd && headerCd !== "0") {
    if (headerCd === "7" || /인증|KEY|REGISTERED|EXCEEDS/i.test(headerMsg)) {
      const e = new Error(headerMsg || "인증/한도 오류");
      e.fatal = true;
      throw e;
    }
    return [];
  }
  const raw = json?.msgBody?.itemList;
  const items = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return items.map((it) => ({
    vehId: it.vehId,
    plainNo: it.plainNo,
    sectOrd: Number(it.sectOrd ?? 0),
  }));
}

// 같은 노선에서 sectOrd 바로 앞(다음으로 큰 구간순번) 차량 = 앞차. 없으면 null.
function frontCarOf(positions, sectOrd) {
  let front = null;
  for (const p of positions) {
    if (p.sectOrd > sectOrd && (!front || p.sectOrd < front.sectOrd)) front = p;
  }
  return front;
}

// 동시 실행 수 제한 풀.
async function runPool(items, size, fn) {
  let i = 0;
  const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
}

// front_car_log 다건 upsert.
async function upsert(records) {
  if (records.length === 0) return;
  const cols = ["service_date", "vehicle_id", "front_tail", "front_gap", "sect_ord", "recorded_at"];
  const values = [];
  const params = [];
  records.forEach((r, n) => {
    const base = n * cols.length;
    values.push(`($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6})`);
    params.push(r.service_date, r.vehicle_id, r.front_tail, r.front_gap, r.sect_ord, r.recorded_at);
  });
  await pool.query(
    `insert into front_car_log(${cols.join(",")}) values ${values.join(",")}
     on conflict (service_date, vehicle_id) do update set
       front_tail = excluded.front_tail,
       front_gap  = excluded.front_gap,
       sect_ord   = excluded.sect_ord,
       recorded_at = excluded.recorded_at;`,
    params,
  );
}

async function main() {
  const { rows } = await pool.query(
    `select route_id from routes where route_type = any($1) order by route_id;`,
    [CITY_TYPES],
  );
  const routeIds = rows.map((r) => r.route_id);
  console.log(`[seed-front-car] ${SERVICE_DATE} 시내버스 ${routeIds.length}개 노선 조회 시작`);

  const nowIso = new Date().toISOString();
  let routesWithBuses = 0;
  let totalRecords = 0;
  let failed = 0;
  let fatal = null;

  await runPool(routeIds, 8, async (rid) => {
    if (fatal) return;
    let positions;
    try {
      positions = await positionsOf(rid);
    } catch (e) {
      if (e.fatal) {
        fatal = e;
        return;
      }
      failed++;
      return;
    }
    const live = positions.filter((p) => p.vehId && p.sectOrd > 0);
    if (live.length === 0) return;
    routesWithBuses++;
    const records = [];
    for (const p of live) {
      const front = frontCarOf(live, p.sectOrd);
      if (!front) continue; // 선두 차량은 앞차 없음
      records.push({
        service_date: SERVICE_DATE,
        vehicle_id: p.vehId,
        front_tail: (front.plainNo ?? "").slice(-4),
        front_gap: front.sectOrd - p.sectOrd,
        sect_ord: p.sectOrd,
        recorded_at: nowIso,
      });
    }
    try {
      await upsert(records);
      totalRecords += records.length;
    } catch (e) {
      failed++;
      console.warn(`route ${rid} upsert 실패:`, e.message);
    }
  });

  await pool.end();

  if (fatal) {
    console.error(`[seed-front-car] 중단(인증/한도): ${fatal.message}`);
    process.exit(1);
  }
  console.log(
    `[seed-front-car] 완료 — 운행노선 ${routesWithBuses}개 / 앞차기록 ${totalRecords}건 / 조회실패 ${failed}건`,
  );
}

main().catch((e) => {
  console.error("[seed-front-car] 오류:", e);
  process.exit(1);
});
