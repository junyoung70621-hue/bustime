// ─────────────────────────────────────────────────────────────
// 브라우저 전용 Supabase 클라이언트 (anon 키, 클라이언트 컴포넌트 전용)
//   증빙사진을 함수 본문(~4.5MB) 우회해 Storage에 직접 업로드하기 위함.
//   서명 업로드 URL(uploadToSignedUrl)만 사용 — anon 키는 공개값이라 노출 안전.
// ─────────────────────────────────────────────────────────────
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _browser: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient {
  if (_browser) return _browser;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase 공개 환경변수 누락(NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)");
  }
  _browser = createClient(url, key, { auth: { persistSession: false } });
  return _browser;
}
