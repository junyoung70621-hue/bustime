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
 *  경로는 photoTempPath가 만드는 `_photos/<batchId>/<n>.jpg` 형태만 허용 —
 *  startsWith 검사만으로는 `_photos/../...` 로 다른 객체를 내려받을 수 있어
 *  정확한 형태를 강제한다. 파일명도 첨부명(=Teams 저장명)으로 쓰이므로 정리. */
const PHOTO_PATH_RE = /^_photos\/[A-Za-z0-9_-]+\/\d{1,2}\.jpg$/;

export function normalizePhotoRefs(raw: unknown): PhotoRef[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((r) => {
    const path = typeof (r as PhotoRef)?.path === "string" ? (r as PhotoRef).path : "";
    const rawName = typeof (r as PhotoRef)?.filename === "string" ? (r as PhotoRef).filename : "";
    const filename = rawName.replace(/[\\/:*?"<>|\x00-\x1f]/g, "").trim();
    return PHOTO_PATH_RE.test(path) && filename ? [{ path, filename }] : [];
  });
}

export async function relayUploadedPhotos(
  sb: SupabaseClient,
  refs: PhotoRef[],
  info: { center: string; operator: string; vehicleNo: string; installDate: string },
): Promise<void> {
  if (refs.length === 0) return;
  // 사진은 팀즈에만 보관(DB 미보관) → 릴레이 성공이 확인된 경우에만 임시본을 지운다.
  // 실패 시 임시본을 남겨두면 고아 파일이 되지만, 지우면 증빙이 영구 유실된다.
  let sent = false;
  try {
    const photos: { filename: string; bytes: Uint8Array }[] = [];
    for (const r of refs) {
      const dl = await sb.storage.from(PHOTO_BUCKET).download(r.path);
      if (dl.error || !dl.data) continue;
      photos.push({ filename: r.filename, bytes: new Uint8Array(await dl.data.arrayBuffer()) });
    }
    sent = photos.length === 0 ? true : await sendPhotoRelayMail({ ...info, photos });
  } catch (e) {
    console.error("증빙사진 릴레이 실패:", e);
  }
  if (!sent) {
    console.error("증빙사진 릴레이 미완료 — 임시본 보존:", refs.map((r) => r.path).join(", "));
    return;
  }
  // 임시 사진 정리(고아 방지). 실패 무시.
  try {
    await sb.storage.from(PHOTO_BUCKET).remove(refs.map((r) => r.path));
  } catch {
    /* 정리 실패 무시 */
  }
}
