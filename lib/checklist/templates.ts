// ─────────────────────────────────────────────────────────────
// 설치 완료 체크리스트 — 모델 메타 + 공용 상수
//   점검표 본문은 models.generated.ts(엑셀 자동추출)에서 모델별로 제공.
// ─────────────────────────────────────────────────────────────
import type { CkModel, CkFormState, CkRowDef } from "./types";

export { CK_MODELS, CK_MODELS_DATA } from "./models.generated";
export { CK_TAGLESS_DATA, TAGLESS_MODELS, TAGLESS_CHECK_KEY } from "./tagless";

// Storage 키(ASCII)용 모델 코드
export const CK_MODEL_CODE: Record<string, string> = {
  "B620(한강셔틀)": "b620shuttle",
  B600: "b600",
  B620: "b620",
  B700: "b700",
  B710: "b710",
  B800: "b800",
};

// 표출단말기 계열(상태바 아이콘) vs 운전자단말기 계열
export const PYOCHUL_MODELS = ["B700", "B710", "B800"];
export function modelFamily(m: string): "pyochul" | "driver" {
  return PYOCHUL_MODELS.includes(m) ? "pyochul" : "driver";
}
// 한강셔틀은 승하차단말기 IH 칸이 없음
export const hasSeunghacha = (m: string) => m !== "B620(한강셔틀)";
// B710은 승.하차단말기(모듈) IH 칸이 없음
export const hasSeunghachaModule = (m: string) => m !== "B710";

// 모델별 IH 프리셋(자동 입력값). 미지정 항목은 빈칸.
export const MODEL_PRESETS: Record<string, Partial<CkFormState>> = {
  B700: { mainIH: "44000 / 46000 / 46005", pyochulIH: "45000", pyochulModuleIH: "47005", citsIH: "47000" },
  // B800/B710: CITS 없음. 표출단말기 IH / 표출(모듈) IH 만.
  B800: { seungChaIH: "1560", seungChaModuleIH: "5900", mainIH: "57000", pyochulIH: "56000", pyochulModuleIH: "58000" },
  B710: { seungChaIH: "15530", mainIH: "44500 / 46500 / 46505", pyochulIH: "45500", pyochulModuleIH: "47505" },
  B620: { driverIH: "14510", seungChaIH: "15510" },
  B600: { driverIH: "14500", seungChaIH: "1550" },
  "B620(한강셔틀)": {},
};

const BLANK_IH: Partial<CkFormState> = {
  seungChaIH: "", hacha1IH: "", hacha2IH: "",
  seungChaModuleIH: "", hacha1ModuleIH: "", hacha2ModuleIH: "",
  mainIH: "", pyochulIH: "", pyochulModuleIH: "", citsIH: "", lteModemIH: "", driverIH: "",
};

/** 모델 선택 시 적용할 IH 프리셋(빈칸 초기화 후 모델값 적용) */
export function presetFor(model: string): Partial<CkFormState> {
  return { ...BLANK_IH, ...(MODEL_PRESETS[model] ?? {}) };
}

/** 빈 폼 상태 생성 */
export function emptyCkForm(today: string): CkFormState {
  return {
    center: "",
    model: "",
    tagless: false,
    hubIH: "",
    otherEquip: "",
    taglessFw: "",
    beaconFw: "",
    afcFw: "",
    gwFw: "",
    appVehicleNo: "",
    installDate: today,
    installTime: "",
    routeNo: "",
    vehicleNo: "",
    lteModemIH: "",
    driverIH: "",
    operatorName: "",
    operatorId: "",
    seungChaIH: "",
    hacha1IH: "",
    hacha2IH: "",
    seungChaModuleIH: "",
    hacha1ModuleIH: "",
    hacha2ModuleIH: "",
    mainIH: "",
    pyochulIH: "",
    pyochulModuleIH: "",
    citsIH: "",
    vehicleType: "",
    partition: "",
    manufacturer: "",
    modelName: "",
    checks: {},
    timeChecked: false,
    timeValue: "",
    fwVer: "",
    osVer: "",
    seatCount: "",
    etcContent: "",
    etcQty: "",
    installerName: "",
    installerSig: null,
    operatorSignerName: "",
    operatorSig: null,
    confirmDate: today,
  };
}

/** 점검 행의 안정적 체크 키(모델 무관, 내용 기반) */
export function rowCheckKey(model: CkModel, index: number): string {
  return `${model}#${index}`;
}

/** 점검 행이 현재 모델에서 체크 대상인지(onlyModel 지정 시 그 모델에서만). 예: CITS는 B700 전용 */
export function rowCheckActive(r: CkRowDef, model: string): boolean {
  return !r.onlyModel || r.onlyModel === model;
}

/** mergeUp 행의 O/X·체크는 바로 위 체크행을 따라감. 제어하는 행 인덱스 반환(아니면 자기 자신) */
export function controllingCheckIndex(rows: CkRowDef[], i: number): number {
  let j = i;
  while (j > 0 && rows[j].mergeUp) j--;
  return j;
}
