// ─────────────────────────────────────────────────────────────
// 증빙사진(수도권 설치완료) — 슬롯 정의 + 클라이언트 압축 (브라우저 전용)
//   설치 현장에서 촬영한 8종 사진을 Teams 업로드용으로 줄여 메일 첨부 한도(25MB) 내로.
//   보관본은 Teams 전용 → Supabase/DB 저장 없음.
// ─────────────────────────────────────────────────────────────

/** 증빙사진 슬롯(촬영 순서 = 표시 순서). 라벨이 곧 Teams 저장 파일명이 된다. */
export const PHOTO_SLOTS = [
  "차량번호",
  "차대번호",
  "GPS",
  "통합단말기+모뎀",
  "표출기",
  "승차",
  "하차1",
  "하차2",
] as const;

export type PhotoLabel = (typeof PHOTO_SLOTS)[number];

/** 촬영 슬롯 상태: 파일 또는 "없음(na)" 중 하나. 둘 다 비어있어도 통과(선택 입력). */
export type PhotoSlot = {
  label: PhotoLabel;
  file: File | null;
  preview: string | null; // URL.createObjectURL 결과(미리보기)
  na: boolean; // "없음" 체크 시 true → 파일 무시
};

/** 빈 슬롯 8개 생성(모달 최초 상태) */
export function emptyPhotoSlots(): PhotoSlot[] {
  return PHOTO_SLOTS.map((label) => ({ label, file: null, preview: null, na: false }));
}

/** 이미지 파일을 긴 변 maxDim 이하 JPEG로 축소(원본 수 MB → ~수백 KB).
 *  EXIF 회전은 최신 브라우저가 <img> 디코딩 시 자동 적용. 실패 시 원본 Blob 반환. */
export async function compressImage(file: File, maxDim = 1600, quality = 0.7): Promise<Blob> {
  try {
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      const { width, height } = img;
      const scale = Math.min(1, maxDim / Math.max(width, height));
      const w = Math.max(1, Math.round(width * scale));
      const h = Math.max(1, Math.round(height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return file;
      ctx.drawImage(img, 0, 0, w, h);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/jpeg", quality),
      );
      return blob ?? file;
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch {
    return file; // 압축 실패해도 원본으로 전송(증빙 누락 방지)
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("이미지 로드 실패"));
    img.src = src;
  });
}
