// ─────────────────────────────────────────────────────────────
// 팀즈 인라인 캡처(captures 공개 버킷) 전용 Supabase 클라이언트 (service_role, 서버 전용)
//   DB·PDF·증빙사진은 회사 서버(lib/db.ts, lib/storage.ts)로 옮겼고,
//   예전 팀즈 글의 캡처 이미지가 Supabase 주소를 가리키므로 캡처만 Supabase에 남긴다.
//   ※ env 이름에 NEXT_PUBLIC_ 금지: Next가 빌드 때 값을 코드에 박아 넣어 런타임 .env 가 무시됨.
// ─────────────────────────────────────────────────────────────
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _admin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (_admin) return _admin;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 없습니다. (팀즈 캡처 이미지 기능)");
  }
  _admin = createClient(url, key, { auth: { persistSession: false } });
  return _admin;
}
