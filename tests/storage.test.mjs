// lib/storage.ts 테스트 — 임시 폴더를 FILES_ROOT 로 사용.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.FILES_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), "st-"));
const { putFile, getFile, removeFiles, isValidKey } = await import("../lib/storage.ts");

const KEY = "gangnam/3f2b9c1e-0a4d-4e1f-9b2a-1234567890ab.pdf";

test("put → get 왕복 바이트 동일", async () => {
  await putFile("daepyecha", KEY, new Uint8Array([1, 2, 3]));
  assert.deepEqual([...(await getFile("daepyecha", KEY))], [1, 2, 3]);
});

test("같은 키 재저장: 기본은 거부, overwrite 면 성공", async () => {
  const k = "gangnam/dup.pdf";
  await putFile("checklist", k, new Uint8Array([1]));
  await assert.rejects(putFile("checklist", k, new Uint8Array([2])));
  await putFile("checklist", k, new Uint8Array([3]), { overwrite: true });
  assert.deepEqual([...(await getFile("checklist", k))], [3]);
});

test("없는 파일: get 은 null, remove 는 조용히 통과", async () => {
  assert.equal(await getFile("checklist", "none/x.pdf"), null);
  await removeFiles("checklist", ["none/x.pdf"]);
});

test("remove 후에는 get 이 null", async () => {
  await removeFiles("daepyecha", [KEY]);
  assert.equal(await getFile("daepyecha", KEY), null);
});

test("isValidKey: 정상 경로만 통과", () => {
  assert.equal(isValidKey("_photos/abc-123/0.jpg"), true);
  assert.equal(isValidKey(KEY), true);
  assert.equal(isValidKey("../etc/passwd"), false);
  assert.equal(isValidKey("a/../b.pdf"), false);
  assert.equal(isValidKey("/abs.pdf"), false);
  assert.equal(isValidKey("a\\b.pdf"), false);
});

test("잘못된 키는 invalid key 로 거부", async () => {
  await assert.rejects(putFile("checklist", "../x.pdf", new Uint8Array([1])), /invalid key/);
  await assert.rejects(getFile("checklist", "a/../../x.pdf"), /invalid key/);
});
