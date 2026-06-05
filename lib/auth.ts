// ─────────────────────────────────────────────────────────────
// 관리자 비밀번호 게이트 (계정 시스템 없음, 단일 비밀번호)
//   - ADMIN_PASSWORD 와 일치하면 httpOnly 쿠키(서명 토큰) 발급
//   - 토큰은 ADMIN_PASSWORD 로 HMAC → 위조 불가, 비번 변경 시 자동 무효화
// ─────────────────────────────────────────────────────────────
import { cookies } from "next/headers";
import crypto from "crypto";

export const ADMIN_COOKIE = "atec_admin";
const TOKEN_PAYLOAD = "atec-admin-session-v1";

function adminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? "";
}

/** 세션 토큰 생성 (ADMIN_PASSWORD 로 서명) */
export function makeToken(): string {
  return crypto.createHmac("sha256", adminPassword()).update(TOKEN_PAYLOAD).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

/** 입력 비밀번호 검증 */
export function checkPassword(input: string): boolean {
  const pw = adminPassword();
  if (!pw) return false;
  return safeEqual(input, pw);
}

/** 쿠키 토큰 유효성 검증 */
export function isValidToken(token?: string): boolean {
  if (!token || !adminPassword()) return false;
  return safeEqual(token, makeToken());
}

/** 현재 요청이 관리자 인증 상태인지 (서버 컴포넌트/route handler에서 사용) */
export function isAuthed(): boolean {
  return isValidToken(cookies().get(ADMIN_COOKIE)?.value);
}
