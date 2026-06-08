// ─────────────────────────────────────────────────────────────
// 대폐차 확인서 테이블 마이그레이션 (수정/휴지통/검색 기능용 컬럼 추가)
// 실행: node scripts/migrate-daepyecha.mjs
//   - 기존 데이터 보존(파괴적 작업 없음). 모두 IF NOT EXISTS 로 idempotent.
// ─────────────────────────────────────────────────────────────
import pg from "pg";
import { readFileSync } from "fs";

const root = new URL("..", import.meta.url);
const env = {};
for (const line of readFileSync(new URL(".env.local", root), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
}

const client = new pg.Client({
  host: env.SUPABASE_DB_HOST,
  port: Number(env.SUPABASE_DB_PORT || 5432),
  user: env.SUPABASE_DB_USER,
  password: env.SUPABASE_DB_PASSWORD,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

const SQL = `
alter table public.daepyecha_confirmations
  add column if not exists etc         text not null default '',
  add column if not exists updated_at  timestamptz not null default now(),
  add column if not exists modified_by text not null default '',
  add column if not exists deleted_at  timestamptz;

create index if not exists idx_dpc_issued  on public.daepyecha_confirmations (issued_date desc);
create index if not exists idx_dpc_deleted on public.daepyecha_confirmations (deleted_at);
`;

async function main() {
  await client.connect();
  console.log("✅ DB 연결 성공");

  // 테이블 존재 확인
  const t = await client.query(
    "select to_regclass('public.daepyecha_confirmations') as t",
  );
  if (!t.rows[0].t) {
    throw new Error("daepyecha_confirmations 테이블이 없습니다. 먼저 테이블을 생성하세요.");
  }

  await client.query(SQL);
  console.log("✅ 컬럼/인덱스 추가 완료 (etc, updated_at, modified_by, deleted_at)");

  // 검증: 컬럼 목록 출력
  const cols = await client.query(
    `select column_name from information_schema.columns
     where table_schema='public' and table_name='daepyecha_confirmations'
     order by ordinal_position`,
  );
  console.log("현재 컬럼:", cols.rows.map((r) => r.column_name).join(", "));

  await client.end();
  console.log("🎉 마이그레이션 완료");
}

main().catch(async (e) => {
  console.error("실패:", e.message);
  try { await client.end(); } catch {}
  process.exit(1);
});
