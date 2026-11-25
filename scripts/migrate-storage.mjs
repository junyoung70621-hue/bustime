// ─────────────────────────────────────────────────────────────
// [전환 1회용] Supabase Storage → 회사 서버 파일(/app/data/files) 복사
//   대상 버킷: daepyecha, checklist   (captures 는 Supabase 에 남기므로 제외)
//   이미 같은 크기로 받은 파일은 건너뜀 → 중간에 끊겨도 다시 실행하면 이어서 받음.
//
// 실행(서버):
//   docker compose exec -T web node scripts/migrate-storage.mjs
//   (web 컨테이너 env 에 SUPABASE_URL·SUPABASE_SERVICE_ROLE_KEY·FILES_ROOT 가 이미 있음)
// ─────────────────────────────────────────────────────────────
import { createClient } from "@supabase/supabase-js";
import { mkdir, stat, writeFile } from "fs/promises";
import path from "path";
import { loadEnv } from "./pg-config.mjs";

const env = loadEnv();
const URL_ = env.SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const ROOT = env.FILES_ROOT || "/app/data/files";
const BUCKETS = ["daepyecha", "checklist"];

if (!URL_ || !KEY) {
  console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 없습니다.");
  process.exit(1);
}
const sb = createClient(URL_, KEY, { auth: { persistSession: false } });

/** 버킷 안 모든 파일 경로(재귀). 폴더는 metadata 가 null. */
async function listAll(bucket, prefix = "") {
  const out = [];
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await sb.storage.from(bucket).list(prefix, { limit: 100, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw new Error(`${bucket}/${prefix} 목록 실패: ${error.message}`);
    for (const e of data) {
      const p = prefix ? `${prefix}/${e.name}` : e.name;
      if (e.metadata) out.push({ path: p, size: Number(e.metadata.size ?? -1) });
      else out.push(...(await listAll(bucket, p)));
    }
    if (data.length < 100) break;
  }
  return out;
}

async function sizeOf(file) {
  try {
    return (await stat(file)).size;
  } catch {
    return -1;
  }
}

const WORKERS = 6; // 동시 다운로드 수(Supabase가 해외라 순차면 파일당 왕복 지연이 누적됨)

let failed = 0;
for (const bucket of BUCKETS) {
  const files = await listAll(bucket);
  let got = 0, skipped = 0, bytes = 0, next = 0;
  const one = async (f) => {
    const dest = path.join(ROOT, bucket, f.path);
    if (f.size >= 0 && (await sizeOf(dest)) === f.size) {
      skipped++;
      bytes += f.size;
      return;
    }
    const { data, error } = await sb.storage.from(bucket).download(f.path);
    if (error || !data) {
      console.error(`실패: ${bucket}/${f.path} — ${error?.message ?? "no data"}`);
      failed++;
      return;
    }
    const buf = Buffer.from(await data.arrayBuffer());
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, buf);
    got++;
    bytes += buf.length;
    if (got % 50 === 0) console.log(`  ${bucket}: ${got}개 받음…`);
  };
  await Promise.all(
    Array.from({ length: WORKERS }, async () => {
      while (next < files.length) await one(files[next++]);
    }),
  );
  console.log(`[${bucket}] 전체 ${files.length}개 (새로 받음 ${got}, 이미 있음 ${skipped}), ${(bytes / 1024 / 1024).toFixed(1)}MB`);
}
if (failed) {
  console.error(`실패 ${failed}건 — 다시 실행하세요.`);
  process.exit(1);
}
console.log("파일 이전 완료");
