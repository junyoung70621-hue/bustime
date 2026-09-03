"use client";

// ─────────────────────────────────────────────────────────────
// IH 자동입력 촬영 단계 (인천 체크리스트, 증빙사진 8장 다음 페이지)
//   단말기 관리자 화면 4종을 촬영하면 서버(Gemini)가 번호를 읽어
//   체크리스트 IH 칸에 자동 입력. 전부 선택사항 — 건너뛰고 수기 입력 가능.
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { compressImage } from "@/lib/daepyecha/photo";
import type { IncFormState } from "@/lib/checklist-incheon/types";

type Kind = "version" | "door" | "module" | "lte";

// 폼 화면의 "설명" 팝업에서도 재사용
export const SLOTS: { kind: Kind; label: string; hint: string }[] = [
  { kind: "version", label: "1. 버전조회 (통합+표출)", hint: "관리자메뉴 - 버전조회 - 1페이지" },
  { kind: "door", label: "2. 승하차 단말기", hint: "관리자메뉴 - 버전조회 - 2페이지" },
  { kind: "module", label: "3. 승하차 모듈", hint: "관리자메뉴 - 버전조회 - 3페이지" },
  { kind: "lte", label: "4. LTE모뎀", hint: "관리자메뉴 - 정보조회 - 오른쪽 상단 V 화살표 - LTE정보 - 1페이지" },
];

// 인식 결과 → 체크리스트 필드 (빈 값은 덮어쓰지 않음)
function toPatch(kind: Kind, v: Record<string, string>): Partial<IncFormState> {
  const p: Partial<IncFormState> = {};
  if (kind === "version") {
    const main = [v.afc, v.bms, v.unified].filter(Boolean).join("/");
    if (main) p.mainIH = main; // 기존 표기: AFC/BMS/통합
    if (v.pyochul) p.pyochulIH = v.pyochul;
    if (v.hmi) p.pyochulModuleIH = v.hmi;
  } else if (kind === "door") {
    if (v.seungcha) p.seungChaIH = v.seungcha;
    if (v.hacha1) p.hacha1IH = v.hacha1;
    if (v.hacha2) p.hacha2IH = v.hacha2;
  } else if (kind === "module") {
    if (v.seungcha) p.seungChaModuleIH = v.seungcha;
    if (v.hacha1) p.hacha1ModuleIH = v.hacha1;
    if (v.hacha2) p.hacha2ModuleIH = v.hacha2;
  } else if (v.serial) {
    p.lteModemIH = v.serial;
  }
  return p;
}

type SlotState = { status: "idle" | "busy" | "done" | "error"; note: string };

export default function AutoInputStep({
  patch,
  onNext,
  onBack,
}: {
  patch: (p: Partial<IncFormState>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [slots, setSlots] = useState<Record<Kind, SlotState>>({
    version: { status: "idle", note: "" },
    door: { status: "idle", note: "" },
    module: { status: "idle", note: "" },
    lte: { status: "idle", note: "" },
  });
  const set = (k: Kind, s: SlotState) => setSlots((prev) => ({ ...prev, [k]: s }));

  async function recognize(kind: Kind, file: File) {
    set(kind, { status: "busy", note: "인식 중…" });
    try {
      // 화면 글자가 크므로 2000px면 충분 — 업로드 용량도 함수 한도 내로.
      const blob = await compressImage(file, 2000, 0.85);
      const fd = new FormData();
      fd.append("kind", kind);
      fd.append("image", blob, "shot.jpg");
      const res = await fetch("/api/checklist/ih-ocr", { method: "POST", body: fd });
      const json: { values?: Record<string, string>; error?: string } = await res.json();
      if (!res.ok || !json.values) throw new Error(json.error ?? "인식 실패");
      const p = toPatch(kind, json.values);
      patch(p);
      const got = Object.values(json.values).filter(Boolean).join(" / ");
      set(kind, { status: "done", note: got || "인식됨" });
    } catch (e) {
      set(kind, { status: "error", note: e instanceof Error ? e.message : "인식 실패" });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button type="button" onClick={onBack} className="self-start text-sm font-semibold text-slate-500 hover:text-slate-700">
        ← 증빙사진 촬영
      </button>

      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
        <p className="text-sm font-bold text-indigo-800">IH 번호 자동입력 (선택)</p>
        <p className="mt-1 text-xs font-semibold text-indigo-700">
          단말기에서 <b>설정 &gt; 설정 &gt; 1472 관리자 모드 진입</b> 후 아래 화면을 촬영하면 번호가 자동 입력됩니다.
        </p>
        <p className="mt-0.5 text-xs text-indigo-500">인식된 값은 다음 화면에서 확인·수정할 수 있어요. 건너뛰어도 됩니다.</p>
        <p className="mt-0.5 text-xs font-semibold text-indigo-700">※ 입력이 잘되지 않을 경우 수동입력 바랍니다.</p>
      </div>

      <div className="flex flex-col gap-2">
        {SLOTS.map(({ kind, label, hint }) => {
          const s = slots[kind];
          return (
            <label
              key={kind}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${
                s.status === "done" ? "border-emerald-300 bg-emerald-50" : s.status === "error" ? "border-red-300 bg-red-50" : "border-slate-300 bg-white"
              }`}
            >
              <span className="text-2xl">{s.status === "busy" ? "⏳" : s.status === "done" ? "✅" : "📷"}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-slate-700">{label}</span>
                <span className={`block text-xs ${s.status === "done" ? "truncate font-semibold text-emerald-700" : s.status === "error" ? "font-semibold text-red-600" : "text-slate-500"}`}>
                  {s.note || hint}
                </span>
              </span>
              <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                {s.status === "done" || s.status === "error" ? "재촬영" : "촬영"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={s.status === "busy"}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) recognize(kind, f);
                  e.target.value = "";
                }}
              />
            </label>
          );
        })}
      </div>

      <button onClick={onNext} className="h-12 w-full rounded-xl bg-brand-600 font-bold text-white">
        체크리스트 작성 →
      </button>
    </div>
  );
}
