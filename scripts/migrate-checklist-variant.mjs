// ─────────────────────────────────────────────────────────────
// 마이그레이션: checklist_confirmations.variant 컬럼 추가
//   'default'(서울) / 'regional'(대전·세종) 구분용. 기존 행은 모두 'default'.
// 실행: node scripts/migrate-checklist-variant.mjs
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
alter table public.checklist_confirmations
  add column if not exists variant text not null default 'default';
create index if not exists idx_ck_variant on public.checklist_confirmations (variant);
alter table public.daepyecha_confirmations
  add column if not exists variant text not null default 'default';
create index if not exists idx_dpc_variant on public.daepyecha_confirmations (variant);
`;

(async () => {
  await client.connect();
  await client.query(SQL);
  const ck = await client.query(
    `select variant, count(*)::int as n from public.checklist_confirmations group by variant order by variant`,
  );
  const dp = await client.query(
    `select variant, count(*)::int as n from public.daepyecha_confirmations group by variant order by variant`,
  );
  console.log("✓ variant 컬럼/인덱스 적용 완료 (checklist + daepyecha)");
  console.log("checklist variant:", ck.rows.length ? ck.rows : "(레코드 없음)");
  console.log("daepyecha variant:", dp.rows.length ? dp.rows : "(레코드 없음)");
  await client.end();
})().catch((e) => {
  console.error("✗ 마이그레이션 실패:", e.message);
  process.exit(1);
});
