"use client";

// ─────────────────────────────────────────────────────────────
// 수도권 체크리스트 IH 자동입력 단계 (증빙사진 다음)
//   기종 선택 → 기종별 관리자 화면 촬영 → 인식값을 폼 필드에 반영.
//   기종을 여기서 먼저 정해야 함: 폼의 모델 선택은 presetFor()로 IH칸을 비우므로
//   인식 후 모델을 고르면 인식값이 지워진다.
//   현재 B800·B700 지원 (B710은 화면 사진 받은 뒤 AUTO 에 추가). LTE는 제외.
// ─────────────────────────────────────────────────────────────
import IhAutoInputStep, { type AutoSlot } from "../IhAutoInputStep";
import { presetFor } from "@/lib/checklist/templates";
import type { CkFormState, CkModel } from "@/lib/checklist/types";

type AutoCfg = { slots: AutoSlot[]; toPatch: (kind: string, v: Record<string, string>) => Partial<CkFormState> };

// FW/OS 는 기존 기록처럼 앞자리 0 없이("0029" → "29")
const noLeadZero = (s: string) => s.replace(/^0+(?=\d)/, "");

// 승하차 단말기 / 승하차 모듈(CPU) — 화면 구성이 같아 공용
function doorPatch(kind: string, v: Record<string, string>): Partial<CkFormState> {
  const p: Partial<CkFormState> = {};
  if (kind === "door") {
    if (v.seungcha) p.seungChaIH = v.seungcha;
    if (v.hacha1) p.hacha1IH = v.hacha1;
    if (v.hacha2) p.hacha2IH = v.hacha2;
  } else if (kind === "module") {
    if (v.seungcha) p.seungChaModuleIH = v.seungcha;
    if (v.hacha1) p.hacha1ModuleIH = v.hacha1;
    if (v.hacha2) p.hacha2ModuleIH = v.hacha2;
  }
  return p;
}

const AUTO: Partial<Record<CkModel, AutoCfg>> = {
  B800: {
    slots: [
      { kind: "fw", label: "1. FW·OS 버전", hint: "관리자메뉴 - 버전조회 - 10페이지 (표출 장치: AFC / OS)" },
      { kind: "version", label: "2. 메인·표출 IH", hint: "관리자메뉴 - 버전조회 - 1페이지" },
      { kind: "door", label: "3. 승하차 단말기 IH", hint: "관리자메뉴 - 버전조회 - 2페이지" },
      { kind: "module", label: "4. 승하차 모듈 IH", hint: "관리자메뉴 - 버전조회 - 3페이지" },
    ],
    toPatch(kind, v) {
      if (kind === "fw") {
        const p: Partial<CkFormState> = {};
        if (v.afc) p.fwVer = noLeadZero(v.afc);
        if (v.os) p.osVer = noLeadZero(v.os);
        return p;
      }
      if (kind === "version") {
        const p: Partial<CkFormState> = {};
        if (v.afc) p.mainIH = v.afc; // 수도권 B800 기존 기록: 메인단말기 IH = AFC 번호
        if (v.pyochul) p.pyochulIH = v.pyochul;
        if (v.hmi) p.pyochulModuleIH = v.hmi;
        return p;
      }
      return doorPatch(kind, v);
    },
  },
};
// B700: 승하차 단말기·CPU 한 화면, OS(management VerCode)·FW(통합 단말기 커널 AFC) 따로 촬영
AUTO.B700 = {
  slots: [
    { kind: "version", label: "1. 메인·표출 IH", hint: "버전조회 - 단말기 버전 - IH 번호 (통합/AFC/BMS/표출/HMI)" },
    { kind: "doormodule", label: "2. 승하차 단말기·모듈 IH", hint: "버전조회 - 단말기 버전 - 아래로 (승하차 단말기 + CPU)" },
    { kind: "os", label: "3. 확인 OS버전", hint: "management 화면 상단 VerCode" },
    { kind: "fw", label: "4. 확인 FW버전", hint: "버전조회 - 단말기 버전 - 통합 단말기 커널 버전 (AFC)" },
  ],
  toPatch(kind, v) {
    const p: Partial<CkFormState> = {};
    if (kind === "version") {
      const main = [v.unified, v.afc, v.bms].filter(Boolean).join(" / "); // B700 프리셋 표기: 통합 / AFC / BMS
      if (main) p.mainIH = main;
      if (v.pyochul) p.pyochulIH = v.pyochul;
      if (v.hmi) p.pyochulModuleIH = v.hmi;
    } else if (kind === "doormodule") {
      Object.assign(p, doorPatch("door", v), doorPatch("module", { seungcha: v.seungchaCpu, hacha1: v.hacha1Cpu, hacha2: v.hacha2Cpu }));
    } else if (kind === "os") {
      if (v.os) p.osVer = noLeadZero(v.os);
    } else if (kind === "fw") {
      if (v.afc) p.fwVer = noLeadZero(v.afc);
    }
    return p;
  },
};
const AUTO_MODELS = Object.keys(AUTO) as CkModel[];

export default function AutoStep({
  data,
  patch,
  onNext,
  onBack,
}: {
  data: CkFormState;
  patch: (p: Partial<CkFormState>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const cfg = AUTO[data.model];
  const pick = (m: CkModel) => {
    if (data.model !== m) patch({ model: m, checks: {}, ...presetFor(m) }); // 폼의 모델 선택과 동일 처리
  };

  return (
    <IhAutoInputStep key={data.model} slots={cfg?.slots ?? []} model={data.model} onValues={(k, v) => cfg && patch(cfg.toPatch(k, v))} onNext={onNext} onBack={onBack}>
      <div>
        <span className="mb-1 block text-xs font-semibold text-slate-600">기종 선택</span>
        <div className="flex gap-2">
          {AUTO_MODELS.map((m) => (
            <button key={m} type="button" onClick={() => pick(m)} className={`h-11 flex-1 rounded-xl text-sm font-bold ring-1 ${data.model === m ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-slate-600 ring-slate-200"}`}>
              {m}
            </button>
          ))}
        </div>
        {!cfg && <p className="mt-1 text-xs text-slate-500">다른 기종은 아직 자동입력이 없어요 — 아래 &quot;체크리스트 작성&quot;으로 넘어가 수기 입력하세요.</p>}
      </div>
    </IhAutoInputStep>
  );
}
