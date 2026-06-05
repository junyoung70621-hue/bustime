// ─────────────────────────────────────────────────────────────
// 관리자 쓰기용 Supabase 클라이언트 (service_role, 서버 전용)
// RLS를 우회하므로 절대 클라이언트로 노출 금지 — admin API 라우트에서만 import.
// ─────────────────────────────────────────────────────────────
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _admin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY(또는 URL) 환경변수가 없습니다. (관리자 수정 기능 필요)");
  }
  _admin = createClient(url, key, { auth: { persistSession: false } });
  return _admin;
}
