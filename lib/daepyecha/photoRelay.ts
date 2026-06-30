// ─────────────────────────────────────────────────────────────
// 증빙사진 릴레이 (서버 전용)
//   클라이언트가 Storage에 직접 올린 임시 사진(meta.photos_upload)을 내려받아
//   Teams로 릴레이한 뒤 임시본을 삭제한다. 사진은 보관 대상이 아니다.
//   실패해도 저장은 비차단(증빙 누락이 본 저장을 막지 않게).
// ─────────────────────────────────────────────────────────────
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendPhotoRelayMail } from "./teams";
import { PHOTO_BUCKET, type PhotoRef } from "./photo-upload";

/** meta.photos_upload(임의 형태)를 안전한 PhotoRef[]로 정규화.
 *  경로는 반드시 `_photos/`로 시작해야 함 — 조작된 meta로 다른 버킷 객체를
 *  내려받거나 삭제하지 못하게 차단. */
export function normalizePhotoRefs(raw: unknown): PhotoRef[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((r) => {
    const path = typeof (r as PhotoRef)?.path === "string" ? (r as PhotoRef).path : "";
    const filename = typeof (r as PhotoRef)?.filename === "string" ? (r as PhotoRef).filename : "";
    return path.startsWith("_photos/") && filename ? [{ path, filename }] : [];
  });
}

export async function relayUploadedPhotos(
  sb: SupabaseClient,
  refs: PhotoRef[],
  info: { center: string; operator: string; vehicleNo: string; installDate: string },
): Promise<void> {
  if (refs.length === 0) return;
  try {
    const photos: { filename: string; bytes: Uint8Array }[] = [];
    for (const r of refs) {
      const dl = await sb.storage.from(PHOTO_BUCKET).download(r.path);
      if (dl.error || !dl.data) continue;
      photos.push({ filename: r.filename, bytes: new Uint8Array(await dl.data.arrayBuffer()) });
    }
    if (photos.length > 0) await sendPhotoRelayMail({ ...info, photos });
  } catch (e) {
    console.error("증빙사진 릴레이 실패:", e);
  } finally {
    // 임시 사진 정리(고아 방지). 실패 무시.
    try {
      await sb.storage.from(PHOTO_BUCKET).remove(refs.map((r) => r.path));
    } catch {
      /* 정리 실패 무시 */
    }
  }
}
