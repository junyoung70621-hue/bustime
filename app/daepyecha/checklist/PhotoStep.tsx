"use client";

// ─────────────────────────────────────────────────────────────
// 증빙사진 촬영 단계 (수도권 설치완료 체크리스트 전 단계)
//   8종 슬롯 — 카메라+갤러리(accept=image/*, capture 미지정)로 촬영/선택.
//   각 슬롯은 선택 입력: 없으면 "없음" 체크 후 통과 가능.
//   사진은 모달 state로 보유 → 저장 시 압축해 메일 릴레이(Teams)로 전송.
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { compressImage, type PhotoSlot } from "@/lib/daepyecha/photo";

import Icon from "@/components/Icon";
export default function PhotoStep({
  photos,
  setPhotos,
  onNext,
}: {
  photos: PhotoSlot[];
  setPhotos: React.Dispatch<React.SetStateAction<PhotoSlot[]>>;
  onNext: () => void;
}) {
  // 예시사진 오버레이(슬롯 인덱스 = /photo-examples/<i>.jpg)
  const [example, setExample] = useState<number | null>(null);
  // 촬영 즉시 1600px JPEG로 축소 — 원본(12MP·수 MB) 8장을 썸네일로 디코딩하면 폰 메모리가 터져 느려짐.
  //   저장 시에는 이미 축소된 파일을 그대로 업로드(재압축 없음).
  const [busy, setBusy] = useState<Set<number>>(new Set());
  const setFile = async (i: number, raw: File | null) => {
    let file = raw;
    if (raw) {
      setBusy((b) => new Set(b).add(i));
      const blob = await compressImage(raw, 1600, 0.7);
      file = blob === raw ? raw : new File([blob], `${i}.jpg`, { type: "image/jpeg" });
      setBusy((b) => {
        const n = new Set(b);
        n.delete(i);
        return n;
      });
    }
    setPhotos((prev) =>
      prev.map((s, idx) => {
        if (idx !== i) return s;
        if (s.preview) URL.revokeObjectURL(s.preview); // 이전 미리보기 정리
        return { ...s, file, preview: file ? URL.createObjectURL(file) : null, na: false };
      }),
    );
  };
  const toggleNa = (i: number) => {
    setPhotos((prev) =>
      prev.map((s, idx) => {
        if (idx !== i) return s;
        const na = !s.na;
        if (na && s.preview) URL.revokeObjectURL(s.preview);
        return na ? { ...s, na, file: null, preview: null } : { ...s, na };
      }),
    );
  };

  const done = photos.filter((s) => s.file || s.na).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm font-bold text-slate-800">증빙사진 촬영 ({done}/{photos.length})</p>
        <p className="mt-1 text-xs text-slate-700">
          증빙 보관용입니다. <b>모든 칸을 촬영해야</b> 다음으로 진행됩니다. 해당 장비가 없는 경우에만 <b>없음</b>을 체크하세요.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {photos.map((s, i) => (
          <div
            key={s.label}
            className={`flex flex-col gap-2 rounded-xl border p-2 ${
              s.file ? "border-emerald-300 bg-emerald-50" : s.na ? "border-slate-200 bg-slate-50" : "border-slate-300 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700">{s.label}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setExample(i)}
                  className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-bold text-slate-700"
                >
                  예시
                </button>
                <label className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                  <input type="checkbox" checked={s.na} onChange={() => toggleNa(i)} className="h-4 w-4" />
                  없음
                </label>
              </div>
            </div>

            {busy.has(i) ? (
              <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-400">
                처리 중…
              </div>
            ) : s.na ? (
              <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-400">
                없음
              </div>
            ) : s.preview ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.preview} alt={s.label} className="h-28 w-full rounded-lg object-cover" />
                <label className="absolute inset-x-0 bottom-0 cursor-pointer rounded-b-lg bg-black/50 py-1 text-center text-xs font-bold text-white">
                  재촬영
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      setFile(i, e.target.files?.[0] ?? null);
                      e.target.value = ""; // 같은 파일 재선택도 change가 발생하도록 리셋
                    }}
                  />
                </label>
              </div>
            ) : (
              <label className="flex h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 text-slate-400 hover:border-brand-500 hover:text-brand-600">
                <Icon name="camera" className="h-7 w-7" />
                <span className="text-xs font-semibold">촬영 / 선택</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    setFile(i, e.target.files?.[0] ?? null);
                    e.target.value = ""; // 같은 파일 재선택도 change가 발생하도록 리셋
                  }}
                />
              </label>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        disabled={done < photos.length || busy.size > 0}
        className="h-12 w-full rounded-xl bg-brand-600 font-bold text-white disabled:opacity-40"
      >
        {busy.size > 0 ? "사진 처리 중…" : done < photos.length ? `촬영 남음 ${photos.length - done}칸 (촬영 또는 없음 체크)` : "체크리스트 작성"}
      </button>

      {/* 예시사진 오버레이(탭하면 닫힘) */}
      {example !== null && (
        <div
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-2 bg-black/80 p-4"
          onClick={() => setExample(null)}
        >
          <p className="text-sm font-bold text-white">예시: {photos[example].label}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/photo-examples/${example}.jpg`} alt={`${photos[example].label} 예시`} className="max-h-[80dvh] w-auto max-w-full rounded-xl object-contain" />
          <p className="text-xs text-white/70">화면을 탭하면 닫힙니다</p>
        </div>
      )}
    </div>
  );
}
