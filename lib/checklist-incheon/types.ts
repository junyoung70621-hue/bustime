// ─────────────────────────────────────────────────────────────
// 인천 B820 설치완료 체크리스트 공용 타입
//   B820 단일 기종 고정 양식(엑셀 "인천 B820 설치완료 체크리스트" 기반).
//   센터는 "인천" 고정, 운수사 서명·증빙사진 없음(설치자 서명만).
// ─────────────────────────────────────────────────────────────
import type { VehicleType, OX, CkCellKey } from "@/lib/checklist/types";

export type { VehicleType, OX, CkCellKey };

// O/X 칸 표기 방식
export type IncOxKind =
  | "check" // 체크 시 ○
  | "vehicleType" // 차량 특성 마지막 글자(A/B/C/D)
  | "partition" // 격벽설치 O/X
  | "time" // 시간확인 HH:MM
  | "version" // FW/OS 버전(점검POINT에 표기)
  | "seat" // 좌석수(비고에 표기)
  | "etc" // 특이사항(점검POINT=내용, 비고=수량)
  | "none"; // 표기 없음

// B820 양식 1행 정의(원본 병합 반영)
export type IncRowDef = {
  caseNo?: string;
  caseLabel?: string;
  target?: string;
  item?: string;
  method?: string;
  point?: string;
  ox: IncOxKind;
  checkKey?: string; // ox="check"일 때 체크 식별자
  na?: boolean; // "해당없음" 별도 체크 가능 항목(빈좌석표시기·전자노선도·태그리스)
  bigo?: string;
  bigoKind?: "manufacturer" | "modelName" | "seat" | "etcQty"; // 비고칸에 입력값 병기
  // 원본 병합 반영(rowspan,colspan). 없으면 병합에 가려진 셀 → 렌더 안 함.
  m: Partial<Record<CkCellKey, [number, number]>>;
};

// 작성/수정 폼 전체 상태
export type IncFormState = {
  center: "인천"; // 고정
  installDate: string; // YYYY-MM-DD
  installTime: string; // HH:MM
  routeNo: string;
  vehicleNo: string;
  operatorName: string;
  operatorId: string;
  // IH (상단 헤더)
  seungChaIH: string;
  hacha1IH: string;
  hacha2IH: string;
  seungChaModuleIH: string;
  hacha1ModuleIH: string;
  hacha2ModuleIH: string;
  mainIH: string; // AFC/BMS처리부,메인단말기 IH
  lteModemIH: string; // LTE모뎀 IH
  pyochulIH: string; // 표출단말기 IH
  pyochulModuleIH: string; // 표출(모듈) IH
  // 케이스1 차량특성
  vehicleType: VehicleType;
  partition: OX; // 격벽설치 유무
  manufacturer: string; // 제조사(비고)
  modelName: string; // 모델명(비고)
  // 점검 항목 O/X
  checks: Record<string, boolean>; // key → 체크(○)
  naChecks: Record<string, boolean>; // key → 해당없음
  // 케이스3 입력
  timeValue: string; // 시간확인 HH:MM
  fwVer: string;
  osVer: string;
  seatCount: string;
  // 케이스6 특이사항
  etcContent: string;
  etcQty: string;
  // 서명(설치자만)
  installerName: string;
  installerSig: string | null;
  // 확인일(휴대폰 날짜 자동)
  confirmDate: string;
};

// 저장된 체크리스트(DB row, 목록용) — 기본 체크리스트와 동일 테이블(variant=incheon)
export type IncRow = {
  id: string;
  center: string;
  operator: string;
  model: string;
  install_date: string;
  vehicle_numbers: string;
  installer_name: string;
  operator_signer_name: string;
  data: IncFormState;
  pdf_path: string;
  created_at: string;
  updated_at: string;
  modified_by: string;
  deleted_at: string | null;
};
