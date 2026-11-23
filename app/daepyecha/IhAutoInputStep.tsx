"use client";

// ─────────────────────────────────────────────────────────────
// IH 자동입력 촬영 단계 (공용 UI — 인천 / 수도권 체크리스트)
//   단말기 관리자 화면을 촬영하면 서버(Gemini)가 번호를 읽어 onValues 로 넘김.
//   전부 선택사항 — 건너뛰고 수기 입력 가능.
// ─────────────────────────────────────────────────────────────
import { useState, type ReactNode } from "react";
import { compressImage } from "@/lib/daepyecha/photo";
import Icon from "@/components/Icon";

export type AutoSlot = { kind: string; label: string; hint: string };
type SlotState = { status: "idle" | "busy" | "done" | "error"; note: string };
const IDLE: SlotState = { status: "idle", note: "" };

export default function IhAutoInputStep({
  slots,
  model,
  onValues,
  onNext,
  onBack,
  children,
}: {
  slots: AutoSlot[];
  model?: string; // 서버 프롬프트의 기종별 번호 힌트 선택용(인천은 생략)
  onValues: (kind: string, values: Record<string, string>) => void;
  onNext: () => void;
  onBack: () => void;
  children?: ReactNode; // 안내문 아래·촬영칸 위 (수도권: 기종 선택)
}) {
  const [state, setState] = useState<Record<string, SlotState>>({});
  const set = (k: string, s: SlotState) => setState((prev) => ({ ...prev, [k]: s }));

  async function recognize(kind: string, file: File) {
    set(kind, { status: "busy", note: "인식 중…" });
    try {
      // 화면 글자가 크므로 2000px면 충분 — 업로드 용량도 함수 한도 내로.
      const blob = await compressImage(file, 2000, 0.85);
      const fd = new FormData();
      fd.append("kind", kind);
      if (model) fd.append("model", model);
      fd.append("image", blob, "shot.jpg");
      const res = await fetch("/api/checklist/ih-ocr", { method: "POST", body: fd });
      const json: { values?: Record<string, string>; error?: string } = await res.json();
      if (!res.ok || !json.values) throw new Error(json.error ?? "인식 실패");
      onValues(kind, json.values);
      const got = Object.values(json.values).filter(Boolean).join(" / ");
      set(kind, { status: "done", note: got || "인식됨" });
    } catch (e) {
      set(kind, { status: "error", note: e instanceof Error ? e.message : "인식 실패" });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button type="button" onClick={onBack} className="self-start text-sm font-semibold text-slate-500 hover:text-slate-700">
        이전: 증빙사진 촬영
      </button>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm font-bold text-slate-800">IH 번호 자동입력 (선택)</p>
        <p className="mt-1 text-xs font-semibold text-slate-700">
          단말기에서 <b>설정 &gt; 설정 &gt; 1472 관리자 모드 진입</b> 후 아래 화면을 촬영하면 번호가 자동 입력됩니다.
        </p>
        <p className="mt-0.5 text-xs text-slate-500">인식된 값은 다음 화면에서 확인·수정할 수 있어요. 건너뛰어도 됩니다.</p>
        <p className="mt-0.5 text-xs font-semibold text-slate-700">※ 입력이 잘되지 않을 경우 수동입력 바랍니다.</p>
      </div>

      {children}

      <div className="flex flex-col gap-2">
        {slots.map(({ kind, label, hint }) => {
          const s = state[kind] ?? IDLE;
          return (
            <label
              key={kind}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${
                s.status === "done" ? "border-emerald-300 bg-emerald-50" : s.status === "error" ? "border-red-300 bg-red-50" : "border-slate-300 bg-white"
              }`}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center text-slate-500">{s.status === "busy" ? <span className="text-xs">인식 중</span> : s.status === "done" ? <span className="text-xs font-bold text-emerald-700">완료</span> : <Icon name="camera" className="h-7 w-7" />}</span>
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
        체크리스트 작성
      </button>
    </div>
  );
}
