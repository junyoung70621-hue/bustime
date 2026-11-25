// ─────────────────────────────────────────────────────────────
// 증빙사진 업로드 — 공유 상수/경로 (서버·클라 공용, 순수 함수)
//   클라이언트가 /api/checklist/photos 로 한 장씩 올리고, 저장 본문에는 참조(path)만 싣는다.
//   임시본은 서버 파일 checklist/_photos/<batchId>/ 아래에 두고,
//   저장 시 서버가 Teams로 릴레이한 뒤 삭제한다(보관본은 Teams 전용 — DB 미보관).
// ─────────────────────────────────────────────────────────────

/** 증빙사진 임시본 저장 위치(lib/storage 의 checklist 버킷 = PDF와 같은 폴더 아래 _photos/). */
export const PHOTO_BUCKET = "checklist" as const;

/** 임시 업로드 경로. 한글 라벨을 키에 쓰지 않도록 인덱스로만 저장한다. */
export function photoTempPath(batchId: string, idx: number): string {
  return `_photos/${batchId}/${idx}.jpg`;
}

/** meta에 실리는 사진 참조 1건(릴레이 시 path로 내려받아 filename으로 첨부). */
export type PhotoRef = { path: string; filename: string };
