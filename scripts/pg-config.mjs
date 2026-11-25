// ─────────────────────────────────────────────────────────────
// 스크립트 공용: 환경변수 읽기 + DB 접속 설정
//   targetPg : 회사 서버 DB(DATABASE_URL)가 있으면 그쪽, 없으면 예전 Supabase(SUPABASE_DB_*).
//   sourcePg : 항상 Supabase — 데이터 이전·검증 때 원본 DB.
//   서버 실행 예) docker compose exec -T web node scripts/purge-front-car.mjs
// ─────────────────────────────────────────────────────────────
import { readFileSync } from "fs";

/** process.env + (있으면) 프로젝트 루트 .env.local 병합 */
export function loadEnv() {
  const env = { ...process.env };
  try {
    const root = new URL("..", import.meta.url);
    for (const line of readFileSync(new URL(".env.local", root), "utf8").split(/\r?\n/)) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m && env[m[1]] === undefined) env[m[1]] = m[2];
    }
  } catch {
    /* .env.local 없음 → process.env 만 사용(서버 컨테이너·CI) */
  }
  return env;
}

/** Supabase 원본 DB 접속 설정 (SSL, 세션 풀러 사용 가능) */
export function sourcePg(env) {
  return {
    host: env.SUPABASE_DB_HOST,
    port: Number(env.SUPABASE_DB_PORT || 5432),
    user: env.SUPABASE_DB_USER,
    password: env.SUPABASE_DB_PASSWORD,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  };
}

/** 작업 대상 DB: 회사 서버(DATABASE_URL, 도커 내부망이라 SSL 없음) 우선 */
export function targetPg(env) {
  if (env.DATABASE_URL) return { connectionString: env.DATABASE_URL, connectionTimeoutMillis: 15000 };
  return sourcePg(env);
}
