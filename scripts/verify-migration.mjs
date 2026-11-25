// ─────────────────────────────────────────────────────────────
// [전환 1회용] 데이터 이전 검증 — 하나라도 어긋나면 exit 1 (전환 중단)
//   ① 4개 테이블 행 수: Supabase(원본) == 회사 서버(대상)
//      front_car_log 는 실시간으로 계속 바뀌는 당일 캐시라 참고로만 표시(다음날 07:00 시드가 다시 채움)
//   ② 모든 pdf_path 가 저장소 키 규칙(lib/storage.ts isValidKey 와 동일)에 맞는지
//   ③ 모든 pdf_path 파일이 FILES_ROOT 에 실제로 있는지
//
// 실행(서버):
//   docker compose exec -T -e SUPABASE_DB_HOST=... -e SUPABASE_DB_PORT=5432 \
//     -e SUPABASE_DB_USER=postgres.<ref> -e SUPABASE_DB_PASSWORD=... web node scripts/verify-migration.mjs
// ─────────────────────────────────────────────────────────────
import pg from "pg";
import { access } from "fs/promises";
import path from "path";
import { loadEnv, sourcePg, targetPg } from "./pg-config.mjs";

const env = loadEnv();
if (!env.DATABASE_URL) {
  console.error("DATABASE_URL(회사 서버 DB)이 없습니다. web 컨테이너 안에서 실행하세요.");
  process.exit(1);
}
const ROOT = env.FILES_ROOT || "/app/data/files";
const TABLES = ["vehicles", "routes", "daepyecha_confirmations", "checklist_confirmations", "front_car_log"];
const VOLATILE = new Set(["front_car_log"]);
const PDF_TABLES = { daepyecha_confirmations: "daepyecha", checklist_confirmations: "checklist" };
// lib/storage.ts 의 isValidKey 와 같은 규칙
const KEY_RE = /^[A-Za-z0-9_-]+(\/[A-Za-z0-9_-][A-Za-z0-9_.-]*)*$/;
const validKey = (k) => KEY_RE.test(k) && !k.split("/").includes("..");

const src = new pg.Client(sourcePg(env));
const dst = new pg.Client(targetPg(env));
await src.connect();
await dst.connect();

const problems = [];

console.log("① 행 수 비교");
for (const t of TABLES) {
  const a = Number((await src.query(`select count(*) n from public.${t}`)).rows[0].n);
  const b = Number((await dst.query(`select count(*) n from public.${t}`)).rows[0].n);
  const note = a === b ? "OK" : VOLATILE.has(t) ? "참고(당일 캐시, 무시)" : "불일치";
  console.log(`  ${t.padEnd(26)} Supabase ${a}  /  서버 ${b}  ${note}`);
  if (a !== b && !VOLATILE.has(t)) problems.push(`${t} 행 수 불일치 (${a} vs ${b})`);
}

console.log("② ③ PDF 경로·파일 확인");
for (const [t, bucket] of Object.entries(PDF_TABLES)) {
  const rows = (await dst.query(`select id, pdf_path from public.${t}`)).rows;
  let missing = 0, invalid = 0;
  for (const r of rows) {
    if (!validKey(r.pdf_path)) {
      invalid++;
      problems.push(`${t} ${r.id}: 키 규칙 위반 "${r.pdf_path}"`);
      continue;
    }
    try {
      await access(path.join(ROOT, bucket, r.pdf_path));
    } catch {
      missing++;
      problems.push(`${t} ${r.id}: 파일 없음 ${bucket}/${r.pdf_path}`);
    }
  }
  console.log(`  ${t.padEnd(26)} ${rows.length}건, 규칙위반 ${invalid}, 파일없음 ${missing}`);
}

await src.end();
await dst.end();

if (problems.length) {
  console.error(`\n검증 실패 ${problems.length}건 (처음 30건):`);
  for (const p of problems.slice(0, 30)) console.error("  - " + p);
  process.exit(1);
}
console.log("\n검증 통과");
