// ─────────────────────────────────────────────────────────────
// 로컬 파일 저장소 (서버 전용) — Supabase Storage 대체
//   실제 위치: <FILES_ROOT>/<bucket>/<key>   (기본 FILES_ROOT=/app/data/files, 도커 볼륨)
//   버킷·키 규칙은 Supabase 시절과 같아서 DB의 pdf_path 를 그대로 쓴다.
//   ※ 테스트가 Node로 직접 import 하므로 "@/..." import 금지.
// ─────────────────────────────────────────────────────────────
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export type Bucket = "daepyecha" | "checklist";

// 세그먼트는 영문·숫자·_- 로 시작(점으로 시작 금지 → "..", 숨김파일 차단), 이후 . 허용.
const KEY_RE = /^[A-Za-z0-9_-]+(\/[A-Za-z0-9_-][A-Za-z0-9_.-]*)*$/;

/** 저장소 키 형식 검사(경로 조작 차단). 예: "gangnam/<uuid>.pdf", "_photos/<batch>/0.jpg" */
export function isValidKey(key: string): boolean {
  return KEY_RE.test(key) && !key.split("/").includes("..");
}

function resolve(bucket: Bucket, key: string): string {
  if (!isValidKey(key)) throw new Error("invalid key");
  const base = path.resolve(process.env.FILES_ROOT ?? "/app/data/files", bucket);
  const full = path.resolve(base, key);
  if (!full.startsWith(base + path.sep)) throw new Error("invalid key");
  return full;
}

/** 파일 저장. 기본은 같은 키가 있으면 실패(기존 upsert:false), overwrite 면 덮어쓰기. */
export async function putFile(
  bucket: Bucket,
  key: string,
  bytes: Uint8Array,
  opts: { overwrite?: boolean } = {},
): Promise<void> {
  const full = resolve(bucket, key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, bytes, { flag: opts.overwrite ? "w" : "wx" });
}

/** 파일 읽기. 없으면 null. */
export async function getFile(bucket: Bucket, key: string): Promise<Uint8Array | null> {
  const full = resolve(bucket, key);
  try {
    return new Uint8Array(await readFile(full));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw e;
  }
}

/** 파일 삭제. 없는 파일은 무시. */
export async function removeFiles(bucket: Bucket, keys: string[]): Promise<void> {
  await Promise.all(keys.map((k) => rm(resolve(bucket, k), { force: true })));
}
