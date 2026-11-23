// ─────────────────────────────────────────────────────────────
// 비밀번호 세션 토큰 (Edge·Node 공용 — middleware 에서도 import)
//   토큰 = HMAC-SHA256(비밀번호, 고정 payload) hex → 위조 불가, 비번 변경 시 자동 무효화
//   admin = ADMIN_PASSWORD(/admin), field = FIELD_PASSWORD(대폐차 현장 공용)
// ─────────────────────────────────────────────────────────────
export const SESSIONS = {
  admin: { cookie: "atec_admin", payload: "atec-admin-session-v1", maxAge: 60 * 60 * 8 }, // 8시간
  field: { cookie: "atec_field", payload: "atec-field-session-v1", maxAge: 60 * 60 * 24 * 30 }, // 30일
} as const;
export type SessionKind = keyof typeof SESSIONS;

// edge 번들에 env 가 포함되도록 정적 참조
export function sessionSecret(kind: SessionKind): string {
  return (kind === "admin" ? process.env.ADMIN_PASSWORD : process.env.FIELD_PASSWORD) ?? "";
}

export async function sessionToken(kind: SessionKind): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(sessionSecret(kind)), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(SESSIONS[kind].payload));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** 길이가 같으면 끝까지 비교(타이밍 차이 최소화) */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function isValidSession(kind: SessionKind, token?: string): Promise<boolean> {
  if (!token || !sessionSecret(kind)) return false;
  return safeEqual(token, await sessionToken(kind));
}
