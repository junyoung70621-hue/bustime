// ─────────────────────────────────────────────────────────────
// 설치 완료 체크리스트 공용 타입
// ─────────────────────────────────────────────────────────────
import type { Center } from "@/lib/daepyecha/types";

export type CkModel = string; // 엑셀 시트명 기반(B620(한강셔틀)/B600/B620/B700/B710/B800)
export type VehicleType = "일반A" | "저상B" | "전기차C" | "기타D" | "";
export type OX = "O" | "X" | "";

// 모델별 점검표 1행(엑셀에서 자동 추출 → models.generated.ts)
export type CkRowKind =
  | "vehicleType"
  | "partition"
  | "time"
  | "version"
  | "seat"
  | "etc"
  | "installer"
  | "check"
  // 태그리스 전용 입력 행
  | "taglessFwVer" // 태그리스 FW / 비콘 FW
  | "deviceFwVer" // AFC FW / G/W FW
  | "appVehicleNo"; // 앱 내 설치 차량번호 입력
export type CkBigoKind = "manufacturer" | "modelName" | "seat" | "etcQty" | "static";
// 셀별 병합: 해당 키가 있으면 그 셀을 [rowspan, colspan]로 렌더, 없으면 병합에 가려져 렌더 안 함
export type CkCellKey = "caseNo" | "caseLabel" | "target" | "item" | "method" | "point" | "ox" | "bigo";
export type CkRowDef = {
  caseNo: number;
  caseLabel: string;
  target: string;
  item: string;
  method: string;
  point: string;
  icon?: string;
  kind: CkRowKind;
  onlyModel?: CkModel; // 지정 시 해당 모델에서만 체크 가능(예: CITS는 B700 전용)
  mergeUp?: boolean; // 셀병합 행: 별도 체크칸 없이 바로 위 체크행을 따라감
  bigo: string;
  bigoKind: CkBigoKind;
  m: Partial<Record<CkCellKey, [number, number]>>; // 원본 병합 반영(rowspan,colspan)
};

/** 점검 항목(O/X 체크 대상) 정의 */
export type CheckItem = {
  key: string; // 안정적 식별자
  caseNo: number; // 케이스 번호(1~6)
  caseLabel: string; // 케이스명
  target: string; // 점검대상 단말기
  item: string; // 점검항목
  method: string; // 점검방법
  point: string; // 점검POINT
  icon?: string; // 점검방법 칸 상태바 아이콘 경로(있을 때만)
  bigo?: string; // 비고
};

/** 작성/수정 폼 전체 상태 */
export type CkFormState = {
  center: Center | "";
  model: CkModel | "";
  // 태그리스(비콘/BLE) 양식 여부 — 표출형(B700/B710/B800)에서만 선택 가능
  tagless: boolean;
  // 태그리스 전용 입력 (tagless=true일 때만 사용)
  hubIH: string; // 허브 IH
  otherEquip: string; // 타사 장비 설치여부(메가박스 TV/대수, 공기청정기 등)
  taglessFw: string; // 태그리스 FW
  beaconFw: string; // 비콘 FW
  afcFw: string; // AFC FW
  gwFw: string; // G/W FW
  appVehicleNo: string; // 앱 내 설치 차량번호(예: 747208)
  // 상단 헤더
  installDate: string; // 설치일 YYYY-MM-DD (기본 오늘)
  installTime: string; // 설치시간 HH:MM
  routeNo: string; // 노선번호
  vehicleNo: string; // 차량번호
  lteModemIH: string; // LTE모뎀 IH (표출 계열)
  driverIH: string; // 운전자단말기 IH (운전자 계열: B600/B620/한강셔틀)
  operatorName: string; // 운수사명
  operatorId: string; // 운수사ID
  // 승.하차단말기 IH (승차 / 하차1 / 하차2)
  seungChaIH: string;
  hacha1IH: string;
  hacha2IH: string;
  // 승.하차단말기(모듈) IH (승차 / 하차1 / 하차2)
  seungChaModuleIH: string;
  hacha1ModuleIH: string;
  hacha2ModuleIH: string;
  mainIH: string; // AFC/BMS처리부,메인단말기 IH (프리셋)
  pyochulIH: string; // 표출단말기 IH (프리셋)
  pyochulModuleIH: string; // 표출(모듈) IH (프리셋)
  citsIH: string; // CITS 처리부 IH (프리셋)
  // 케이스1 차량특성
  vehicleType: VehicleType;
  partition: OX; // 격벽설치 유무
  manufacturer: string; // 제조사(비고)
  modelName: string; // 모델명(비고)
  // 점검 항목 O/X (key → checked)
  checks: Record<string, boolean>;
  // 시간확인(케이스3) — 시간확인 행만 NOW
  timeChecked: boolean;
  timeValue: string; // HH:MM
  // 버전/좌석수
  fwVer: string;
  osVer: string;
  seatCount: string;
  // 특이사항(케이스6)
  etcContent: string;
  etcQty: string;
  // 서명
  installerName: string; // 설치자 정자
  installerSig: string | null;
  operatorSignerName: string; // 운수사 담당자 정자
  operatorSig: string | null;
  // 확인일(휴대폰 날짜 자동)
  confirmDate: string; // YYYY-MM-DD
};

/** 저장된 체크리스트(DB row, 목록용) */
export type CkRow = {
  id: string;
  center: Center;
  operator: string;
  model: CkModel;
  install_date: string;
  vehicle_numbers: string;
  installer_name: string;
  operator_signer_name: string;
  data: CkFormState;
  pdf_path: string;
  created_at: string;
  updated_at: string;
  modified_by: string;
  deleted_at: string | null;
};
