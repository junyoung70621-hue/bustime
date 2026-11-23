"use client";

// ─────────────────────────────────────────────────────────────
// IH 자동입력 촬영 단계 (인천 체크리스트, 증빙사진 8장 다음 페이지)
//   촬영 UI는 공용 IhAutoInputStep. 여기서는 인천 화면 4종과 필드 매핑만.
// ─────────────────────────────────────────────────────────────
import IhAutoInputStep, { type AutoSlot } from "../IhAutoInputStep";
import type { IncFormState } from "@/lib/checklist-incheon/types";

// 폼 화면의 "설명" 팝업에서도 재사용
export const SLOTS: AutoSlot[] = [
  { kind: "version", label: "1. 버전조회 (통합+표출)", hint: "관리자메뉴 - 버전조회 - 1페이지" },
  { kind: "door", label: "2. 승하차 단말기", hint: "관리자메뉴 - 버전조회 - 2페이지" },
  { kind: "module", label: "3. 승하차 모듈", hint: "관리자메뉴 - 버전조회 - 3페이지" },
  { kind: "lte", label: "4. LTE모뎀", hint: "관리자메뉴 - 정보조회 - 오른쪽 상단 V 화살표 - LTE정보 - 1페이지" },
];

// 인식 결과 → 체크리스트 필드 (빈 값은 덮어쓰지 않음)
function toPatch(kind: string, v: Record<string, string>): Partial<IncFormState> {
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

export default function AutoInputStep({
  patch,
  onNext,
  onBack,
}: {
  patch: (p: Partial<IncFormState>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return <IhAutoInputStep slots={SLOTS} onValues={(k, v) => patch(toPatch(k, v))} onNext={onNext} onBack={onBack} />;
}
