// ─────────────────────────────────────────────────────────────
// 비밀번호 게이트 (계정 시스템 없음)
//   - admin: ADMIN_PASSWORD → /admin
//   - field: FIELD_PASSWORD → 대폐차 페이지·API 전체(middleware.ts)
//   일치하면 httpOnly 쿠키(서명 토큰) 발급. 토큰 로직은 lib/session.ts(edge 공용).
// ─────────────────────────────────────────────────────────────
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { SESSIONS, sessionSecret, sessionToken, safeEqual, isValidSession, type SessionKind } from "./session";

export const ADMIN_COOKIE = SESSIONS.admin.cookie;

/** 현재 요청이 관리자 인증 상태인지 (서버 컴포넌트/route handler에서 사용) */
export function isAuthed(): Promise<boolean> {
  return isValidSession("admin", cookies().get(ADMIN_COOKIE)?.value);
}

// 로그인 실패 제한: IP별 15분에 10회
// ponytail: 인스턴스 메모리 기반이라 인스턴스끼리 공유 안 됨. 실제 무차별 대입이 보이면 KV(Upstash 등)로 옮길 것.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 10;
const fails = new Map<string, { n: number; since: number }>();

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}

/** 비밀번호 로그인 공용 처리 (admin/field 로그인 route 에서 사용) */
export async function passwordLogin(req: NextRequest, kind: SessionKind): Promise<NextResponse> {
  const body = await req.json().catch(() => ({}));
  const password = String(body?.password ?? "");
  const secret = sessionSecret(kind);
  if (!secret) {
    return NextResponse.json({ error: "서버에 비밀번호가 설정되지 않았습니다." }, { status: 500 });
  }

  const key = `${kind}:${clientIp(req)}`;
  const now = Date.now();
  const f = fails.get(key);
  if (f && now - f.since > WINDOW_MS) fails.delete(key);
  if ((fails.get(key)?.n ?? 0) >= MAX_FAILS) {
    return NextResponse.json({ error: "시도 횟수를 초과했습니다. 15분 후 다시 시도하세요." }, { status: 429 });
  }

  if (!safeEqual(password, secret)) {
    const cur = fails.get(key);
    fails.set(key, { n: (cur?.n ?? 0) + 1, since: cur?.since ?? now });
    return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }
  fails.delete(key);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSIONS[kind].cookie, await sessionToken(kind), {
    httpOnly: true,
    // 사내 서버를 http(비 HTTPS)로 접속하면 Secure 쿠키가 버려져 로그인이 안 됨 → COOKIE_SECURE=false 로 끔
    secure: process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false",
    sameSite: "lax",
    path: "/",
    maxAge: SESSIONS[kind].maxAge,
  });
  return res;
}
