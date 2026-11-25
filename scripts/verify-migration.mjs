// ─────────────────────────────────────────────────────────────
// [전환 1회용] 데이터 이전 검증 — 하나라도 어긋나면 exit 1 (전환 중단)
//   ① vehicles·routes 행 수: Supabase(원본) == 회사 서버(대상)
//      front_car_log 는 실시간으로 계속 바뀌는 당일 캐시라 참고로만 표시(다음날 07:00 시드가 다시 채움)
//   ①-2 자재확인서·체크리스트: Supabase 의 모든 기록(id)이 서버에 있고, 서버 쪽이 같거나 더 최신(updated_at)인지
//      → 덤프 이후 Vercel 에서 새로 저장·수정된 건을 잡는다. 서버에만 있는 건(전환 후 새 저장)은 정상.
//      Vercel 리다이렉트(8번) 직후에 한 번 더 실행해 빠진 건이 없는지 확인한다.
//      --fix : 빠진/옛 버전 기록만 Supabase 에서 골라 서버로 복사(다른 행은 건드리지 않음).
//              PDF 파일은 그 다음 migrate-storage.mjs 를 다시 돌려 받는다.
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
const FIX = process.argv.includes("--fix");

/** Supabase 의 한 행을 서버로 그대로 복사(같은 id 는 지우고 다시 넣음). 컬럼 순서 차이는 jsonb 로 흡수. */
async function copyRow(t, id) {
  const row = (await src.query(`select row_to_json(x) j from public.${t} x where id = $1`, [id])).rows[0]?.j;
  if (!row) return;
  await dst.query("begin");
  try {
    await dst.query(`delete from public.${t} where id = $1`, [id]);
    await dst.query(`insert into public.${t} select * from jsonb_populate_record(null::public.${t}, $1::jsonb)`, [
      JSON.stringify(row),
    ]);
    await dst.query("commit");
  } catch (e) {
    await dst.query("rollback");
    throw e;
  }
}

console.log("① 행 수 비교");
for (const t of TABLES) {
  const a = Number((await src.query(`select count(*) n from public.${t}`)).rows[0].n);
  const b = Number((await dst.query(`select count(*) n from public.${t}`)).rows[0].n);
  const byId = t in PDF_TABLES; // 기록 테이블은 아래 id 대조로 판정(서버에 새 저장이 있으면 수가 달라도 정상)
  const note = a === b ? "OK" : VOLATILE.has(t) ? "참고(당일 캐시, 무시)" : byId ? "참고(아래 id 대조로 판정)" : "불일치";
  console.log(`  ${t.padEnd(26)} Supabase ${a}  /  서버 ${b}  ${note}`);
  if (a !== b && !VOLATILE.has(t) && !byId) problems.push(`${t} 행 수 불일치 (${a} vs ${b})`);
}

console.log("①-2 기록 id·수정시각 대조");
let fixed = 0;
for (const t of Object.keys(PDF_TABLES)) {
  const q = `select id::text, extract(epoch from updated_at) as u from public.${t}`;
  const dstMap = new Map((await dst.query(q)).rows.map((r) => [r.id, Number(r.u)]));
  let missing = 0, stale = 0;
  for (const r of (await src.query(q)).rows) {
    const mine = dstMap.get(r.id);
    const isMissing = mine === undefined;
    if (!isMissing && mine + 0.001 >= Number(r.u)) continue;
    if (FIX) {
      await copyRow(t, r.id);
      console.log(`  복사함: ${t} ${r.id} (${isMissing ? "빠진 기록" : "옛 버전"})`);
      fixed++;
      continue;
    }
    if (isMissing) {
      missing++;
      problems.push(`${t} ${r.id}: 서버에 없음(덤프 후 새로 저장된 건) → --fix 로 복사`);
    } else {
      stale++;
      problems.push(`${t} ${r.id}: 서버가 옛 버전(덤프 후 수정된 건) → --fix 로 복사`);
    }
  }
  console.log(`  ${t.padEnd(26)} 빠진 기록 ${missing}, 옛 버전 ${stale}`);
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

if (fixed) console.log(`
${fixed}건 복사함 → 'node scripts/migrate-storage.mjs' 로 PDF 를 받은 뒤 이 검증을 다시 실행하세요.`);
if (problems.length) {
  console.error(`\n검증 실패 ${problems.length}건 (처음 30건):`);
  for (const p of problems.slice(0, 30)) console.error("  - " + p);
  process.exit(1);
}
console.log("\n검증 통과");
