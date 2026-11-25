// ─────────────────────────────────────────────────────────────
// 수도권 캡쳐(JPG) 공개 URL 발급 — Supabase captures 버킷(유일하게 Supabase에 남은 기능)
//   Teams 스레드에 이미지를 "인라인"으로 표시하려면 인증 없이 접근 가능한 https
//   공개 이미지 URL이 필요하다(회사 서버는 http 라 팀즈가 못 띄울 수 있음).
//   → 캡쳐 JPG를 Supabase 공개 버킷에 올려 공개 URL을 만들어 메일 본문에 실어 보낸다.
// ─────────────────────────────────────────────────────────────
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const CAPTURE_BUCKET = "captures";

/** 캡쳐 JPG를 공개 버킷에 업로드하고 공개 URL을 반환. 실패·env 미설정 시 "" (저장 비차단).
 *  파일명은 레코드 id 기준이라, 수정 시 같은 경로로 덮어써 최신 캡쳐를 유지한다.
 *  (덮어쓰기 시 CDN이 옛 이미지를 계속 주는 문제는 URL 캐시버스터(?v=)로 회피) */
export async function uploadCapturePublic(id: string, jpg: Uint8Array): Promise<string> {
  try {
    const sb = getSupabaseAdmin();
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

/** 영구삭제 시 캡쳐 정리(고아 방지). 없는 경로·실패·env 미설정은 무시. */
export async function removeCaptures(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  try {
    await getSupabaseAdmin().storage.from(CAPTURE_BUCKET).remove(ids.map((id) => `${id}.jpg`));
  } catch (e) {
    console.error("캡쳐 정리 실패(무시):", e);
  }
}
