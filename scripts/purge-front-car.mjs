// ─────────────────────────────────────────────────────────────
// 앞차 이력 자정 정리
//   매일 00:00 KST에 지난 운행일(오늘 KST 이전) front_car_log 기록을 삭제한다.
//   앞차는 그날그날 배차가 달라지므로 하루치만 유지(전날 기록 제거).
//   ※ 조회는 어차피 당일(service_date) 기록만 읽으므로, 이 정리는 테이블 누적 방지용.
//
// 실행(로컬): node scripts/purge-front-car.mjs   (.env.local 사용)
// 실행(CI):  GitHub Actions 매일 00:00 KST.
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

// 한국시간(KST) 오늘 날짜 "YYYY-MM-DD".
const TODAY_KST = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);

const client = new pg.Client({
  host: env.SUPABASE_DB_HOST,
  port: Number(env.SUPABASE_DB_PORT || 5432),
  user: env.SUPABASE_DB_USER,
  password: env.SUPABASE_DB_PASSWORD,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

async function main() {
  await client.connect();
  const r = await client.query(`delete from front_car_log where service_date < $1;`, [TODAY_KST]);
  await client.end();
  console.log(`[purge-front-car] ${TODAY_KST} 이전 앞차 기록 ${r.rowCount}건 삭제`);
}

main().catch((e) => {
  console.error("[purge-front-car] 오류:", e);
  process.exit(1);
});
