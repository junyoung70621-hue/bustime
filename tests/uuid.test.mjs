// lib/uuid.ts — http(비보안 컨텍스트)에서도 동작하는 UUID v4 생성기
import { test } from "node:test";
import assert from "node:assert/strict";

const { uuid } = await import("../lib/uuid.ts");

test("uuid: RFC4122 v4 형식, 1000개 중복 없음", () => {
  const re = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  const seen = new Set();
  for (let i = 0; i < 1000; i++) {
    const u = uuid();
    assert.match(u, re);
    seen.add(u);
  }
  assert.equal(seen.size, 1000);
});
