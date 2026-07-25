// ─────────────────────────────────────────────────────────────
// 수도권 캡쳐(JPG) 공개 URL 발급
//   Teams 스레드에 이미지를 "인라인"으로 표시하려면 인증 없이 접근 가능한
//   공개 이미지 URL이 필요하다(Teams가 SharePoint 인증 이미지는 못 불러옴).
//   → 캡쳐 JPG를 Supabase 공개 버킷에 올려 공개 URL을 만들어 메일 본문에 실어 보낸다.
//   공개 버킷명은 CAPTURE_BUCKET. (Supabase 대시보드에서 Public 버킷으로 1회 생성)
// ─────────────────────────────────────────────────────────────
import type { SupabaseClient } from "@supabase/supabase-js";

export const CAPTURE_BUCKET = "captures";

/** 캡쳐 JPG를 공개 버킷에 업로드하고 공개 URL을 반환. 실패 시 "" (저장 비차단).
 *  파일명은 레코드 id 기준이라, 수정 시 같은 경로로 덮어써 최신 캡쳐를 유지한다.
 *  (삭제 흐름들이 `${id}.jpg` 고정 경로에 의존 → 경로는 유지하고, 덮어쓰기 시
 *   CDN이 옛 이미지를 계속 주는 문제는 URL 캐시버스터(?v=)로 회피) */
export async function uploadCapturePublic(sb: SupabaseClient, id: string, jpg: Uint8Array): Promise<string> {
  try {
    const path = `${id}.jpg`;
    const up = await sb.storage.from(CAPTURE_BUCKET).upload(path, jpg, { contentType: "image/jpeg", upsert: true });
    if (up.error) {
      console.error("캡쳐 공개 업로드 실패:", up.error.message);
      return "";
    }
    return `${sb.storage.from(CAPTURE_BUCKET).getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
  } catch (e) {
    console.error("캡쳐 공개 업로드 예외:", e);
    return "";
  }
}
