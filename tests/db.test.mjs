// lib/db.ts 헬퍼 테스트. 통합 테스트는 TEST_DATABASE_URL 이 있을 때만 실행.
//   로컬: docker run ... -p 55432:5432 postgres:17-alpine (db/init.sql 마운트)
//   TEST_DATABASE_URL=postgres://app:testpw@localhost:55432/app npm test
import { test } from "node:test";
import assert from "node:assert/strict";

if (process.env.TEST_DATABASE_URL) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const { q, q1, jsonb, likeContains, isUuid } = await import("../lib/db.ts");

test("likeContains: LIKE 특수문자 이스케이프 후 %로 감싼다", () => {
  assert.equal(likeContains("50%_a\\b"), "%50\\%\\_a\\\\b%");
});

test("isUuid: UUID 형식만 통과", () => {
  assert.equal(isUuid("3f2b9c1e-0a4d-4e1f-9b2a-1234567890ab"), true);
  assert.equal(isUuid("abc"), false);
  assert.equal(isUuid("3f2b9c1e-0a4d-4e1f-9b2a-1234567890ab' or 1=1"), false);
});

test("jsonb: 배열·undefined 를 JSON 문자열로", () => {
  assert.equal(jsonb([{ name: "a", qty: 1 }]), '[{"name":"a","qty":1}]');
  assert.equal(jsonb(undefined), "null");
});

const db = { skip: !process.env.TEST_DATABASE_URL };

test("통합: jsonb 배열 왕복, date 는 문자열, timestamptz 는 ISO 문자열", db, async () => {
  const id = "3f2b9c1e-0a4d-4e1f-9b2a-1234567890ab";
  await q("delete from daepyecha_confirmations where id = $1", [id]);
  await q(
    `insert into daepyecha_confirmations (id, center, model, items, issued_date, pdf_path)
     values ($1, '강남', 'B700', $2::jsonb, $3, 'gangnam/x.pdf')`,
    [id, jsonb([{ name: "x" }]), "2026-11-25"],
  );
  const row = await q1("select items, issued_date, created_at from daepyecha_confirmations where id = $1", [id]);
  assert.deepEqual(row.items, [{ name: "x" }]);
  assert.equal(row.issued_date, "2026-11-25");
  assert.equal(typeof row.created_at, "string");
  assert.ok(row.created_at.endsWith("Z"));
  await q("delete from daepyecha_confirmations where id = $1", [id]);
});

test("통합: 검색어 특수문자도 오류 없이 ILIKE", db, async () => {
  const rows = await q("select 1 from vehicles where plate_no ilike $1", [likeContains("a,b(c)")]);
  assert.ok(Array.isArray(rows));
});

test("통합: 결과 없으면 q1 은 null", db, async () => {
  assert.equal(await q1("select 1 from vehicles where plate_no = $1", ["없는차"]), null);
});
