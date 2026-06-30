// ─────────────────────────────────────────────────────────────
// 증빙사진(수도권 설치완료) — 슬롯 정의 + 클라이언트 압축 (브라우저 전용)
//   설치 현장에서 촬영한 8종 사진을 Teams 업로드용으로 줄여 메일 첨부 한도(25MB) 내로.
//   보관본은 Teams 전용 → Supabase/DB 저장 없음.
// ─────────────────────────────────────────────────────────────
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import { PHOTO_BUCKET, type PhotoRef } from "./photo-upload";

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

/** 증빙사진을 Storage에 직접 업로드하고 meta용 참조 목록을 반환.
 *  함수 본문(~4.5MB) 한계를 우회한다(사진 자체는 본문에 싣지 않음).
 *  ① 서버에서 서명 업로드 URL 발급 → ② 압축 후 서명 URL로 직접 PUT.
 *  업로드 실패 시 throw(명확히 안내). */
export async function uploadPhotosDirect(
  slots: { label: PhotoLabel; file: File }[],
  batchId: string,
): Promise<PhotoRef[]> {
  if (slots.length === 0) return [];

  // ① 서명 업로드 URL 발급
  const res = await fetch("/api/checklist/photo-upload-urls", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ batchId, items: slots.map((s, idx) => ({ idx, label: s.label })) }),
  });
  const text = await res.text();
  let json: { urls?: { idx: number; path: string; token: string; filename: string }[]; error?: string };
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`서명 URL 응답 파싱 실패: ${text.slice(0, 80) || "(빈 응답)"}`);
  }
  if (!res.ok || !json.urls) throw new Error(json.error ?? "서명 URL 발급 실패");

  // ② 각 사진 압축 후 서명 URL로 직접 업로드(병렬)
  const sb = getSupabaseBrowser();
  const byIdx = new Map(json.urls.map((u) => [u.idx, u]));
  return Promise.all(
    slots.map(async (s, idx) => {
      const u = byIdx.get(idx);
      if (!u) throw new Error(`서명 URL 누락(${s.label})`);
      const blob = await compressImage(s.file, 1600, 0.7);
      const up = await sb.storage.from(PHOTO_BUCKET).uploadToSignedUrl(u.path, u.token, blob, {
        contentType: "image/jpeg",
        upsert: true,
      });
      if (up.error) throw new Error(`사진 업로드 실패(${s.label}): ${up.error.message}`);
      return { path: u.path, filename: u.filename } satisfies PhotoRef;
    }),
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("이미지 로드 실패"));
    img.src = src;
  });
}
