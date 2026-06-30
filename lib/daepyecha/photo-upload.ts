// ─────────────────────────────────────────────────────────────
// 증빙사진 직접 업로드 — 공유 상수/경로 (서버·클라 공용, 순수 함수)
//   사진을 함수 본문(~4.5MB)으로 보내면 용량 초과(413)로 막힌다.
//   → 클라이언트가 Storage에 직접 올리고, 본문에는 참조(path)만 싣는다.
//   임시본은 기존 비공개 버킷의 `_photos/<batchId>/` 아래에 두고,
//   저장 시 서버가 Teams로 릴레이한 뒤 삭제한다(보관본은 Teams 전용 — DB 미보관).
// ─────────────────────────────────────────────────────────────

/** 증빙사진 임시 업로드 버킷(기존 비공개 PDF 버킷 재사용 — 새 버킷 생성 불필요). */
export const PHOTO_BUCKET = "checklist";

/** 임시 업로드 경로. 한글 라벨을 키에 쓰지 않도록 인덱스로만 저장한다. */
export function photoTempPath(batchId: string, idx: number): string {
  return `_photos/${batchId}/${idx}.jpg`;
}

/** meta에 실리는 사진 참조 1건(릴레이 시 path로 내려받아 filename으로 첨부). */
export type PhotoRef = { path: string; filename: string };
