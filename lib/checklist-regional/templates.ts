// ─────────────────────────────────────────────────────────────
// 설치 완료 체크리스트(지역: 대전·세종) — 모델 메타 + 공용 상수
//   점검표 본문은 models.generated.ts(엑셀 자동추출)에서 모델별로 제공.
// ─────────────────────────────────────────────────────────────
import type { RegFormState, RegModel, Region } from "./types";

export { REG_MODELS, REG_MODELS_DATA } from "./models.generated";
export type { RegModel, RegModelDef } from "./models.generated";

export const REGIONS: Region[] = ["대전", "세종", "경북", "제주", "포항", "안동", "김해"];

// Storage 키(ASCII)용 지역 코드
export const REGION_CODE: Record<string, string> = {
  대전: "daejeon",
  세종: "sejong",
  경북: "gyeongbuk",
  제주: "jeju",
  포항: "pohang",
  안동: "andong",
  김해: "gimhae",
  고속시외: "gosi",
};

/** 모델별 헤더 구성 */
export type RegHeaderCfg = {
  idLabel: string; // 승.하차 ID/IH 라벨
  driverLabel: string; // 운전자 ID/IH 라벨
  hasOperatorId: boolean; // 운수사ID 표기 여부
  operatorIdInline: boolean; // true=운수사명/운수사ID 한 칸(B400), false=별도행(B600)
  fwRow: boolean; // F/W 버전 행(B500/B650)
  beforeAfter: boolean; // 교체전/교체후 IH(B600)
  vehicleTypeOptions: string[]; // 차량특성 선택지(비었으면 차량특성 행 없음)
};

const VT_B400 = ["현대 저상 A", "현대 일반 B", "현대 일렉시티 C", "화이버드 D", "이-화이버드 E", "기타"];
const VT_B600 = ["현대 저상 A", "현대 일반 B", "현대 일렉시티 C", "화이버드 D", "이-화이버드 E", "BYD F", "기타"];

export const REG_HEADER: Record<RegModel, RegHeaderCfg> = {
  B400: { idLabel: "승.하차단말기 IH", driverLabel: "운전자단말기 IH", hasOperatorId: true, operatorIdInline: true, fwRow: false, beforeAfter: false, vehicleTypeOptions: VT_B400 },
  B500: { idLabel: "승.하차1,하차2 단말기 ID", driverLabel: "운전자단말기 ID", hasOperatorId: false, operatorIdInline: false, fwRow: true, beforeAfter: false, vehicleTypeOptions: [] },
  B600: { idLabel: "승.하차단말기 IH", driverLabel: "운전자단말기 IH", hasOperatorId: true, operatorIdInline: false, fwRow: false, beforeAfter: true, vehicleTypeOptions: VT_B600 },
  B650: { idLabel: "승.하차1,하차2 단말기 ID", driverLabel: "운전자단말기 ID", hasOperatorId: false, operatorIdInline: false, fwRow: true, beforeAfter: false, vehicleTypeOptions: [] },
};

/** 점검 행의 안정적 체크 키 */
export function regCheckKey(model: string, index: number): string {
  return `${model}#${index}`;
}

/** 빈 폼 상태 생성 */
export function emptyRegForm(today: string): RegFormState {
  return {
    region: "",
    model: "",
    inspectDate: today,
    vehicleNo: "",
    operatorName: "",
    operatorId: "",
    seungCha: "",
    hacha1: "",
    hacha2: "",
    driverId: "",
    seungChaAfter: "",
    hacha1After: "",
    hacha2After: "",
    driverIdAfter: "",
    seungChaFw: "",
    hacha1Fw: "",
    hacha2Fw: "",
    driverFw: "",
    vehicleType: "",
    vehicleTypeEtc: "",
    partition: "",
    checks: {},
    etcContent: "",
    etcQty: "",
    inspectorName: "",
    inspectorSig: null,
    confirmDate: today,
  };
}
