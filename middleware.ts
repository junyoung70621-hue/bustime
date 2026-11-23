// 대폐차 페이지·API 보호: 현장 공용 비밀번호(FIELD_PASSWORD) 또는 관리자 세션 필요
import { NextRequest, NextResponse } from "next/server";
import { SESSIONS, isValidSession } from "@/lib/session";

export async function middleware(req: NextRequest) {
  const ok =
    (await isValidSession("field", req.cookies.get(SESSIONS.field.cookie)?.value)) ||
    (await isValidSession("admin", req.cookies.get(SESSIONS.admin.cookie)?.value));
  if (ok) return NextResponse.next();

  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "로그인이 필요합니다. 페이지를 새로고침해 주세요." }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/field-login";
  url.search = `?next=${encodeURIComponent(req.nextUrl.pathname)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/daepyecha/:path*",
    "/daepyecha-region/:path*",
    "/daepyecha-express/:path*",
    "/api/daepyecha/:path*",
    "/api/checklist/:path*",
  ],
};
