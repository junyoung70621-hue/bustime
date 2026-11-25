// ─────────────────────────────────────────────────────────────
// UUID v4 생성 (브라우저·서버 공용)
//   crypto.randomUUID()는 HTTPS(보안 컨텍스트)에서만 있어서 http 서버에선 화면이 오류남.
//   crypto.getRandomValues()는 http 에서도 동작하므로 이걸로 만든다.
// ─────────────────────────────────────────────────────────────
export function uuid(): string {
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; // version 4
  b[8] = (b[8] & 0x3f) | 0x80; // variant 10xx
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
