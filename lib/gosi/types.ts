// ─────────────────────────────────────────────────────────────
// 고속/시외 증·대폐차 설치확인서 타입
//   엑셀/워드 "고속_시외_설치확인서.doc" 기준 — 단일 차량 + 자재 체크표.
// ─────────────────────────────────────────────────────────────

export type GosiPurpose = "증차" | "대폐차" | "재설치";

/** 자재 1행 */
export type GosiItem = {
  name: string; // 품명
  qty: string; // 수량
  done: boolean; // 완료여부
  custom: boolean; // 사용자 추가 품목(이름 편집/삭제 가능)
};

/** 작성/수정 폼 전체 상태 */
export type GosiForm = {
  purpose: GosiPurpose | ""; // 구분(증차/대폐차/재설치)
  requestDate: string; // 요청일자
  installDate: string; // 설치일자
  operatorName: string; // 운수사명(고속사명)
  vehicleNo: string; // 차량번호
  driverIH: string; // 운전자IH
  scIH: string; // 승하차IH
  receiptSn: string; // 영수증기 S/N
  barcodeSn: string; // 바코드 S/N
  items: GosiItem[];
  // 서명: 티머니측 담당자 + 고속사(운수사)
  tmoneyName: string; // 소속 티머니 — 성명/서명
  tmoneySig: string | null;
  operatorSignerName: string; // 고속사명 — 직인 또는 서명날인
  operatorSig: string | null;
  confirmDate: string; // 확인일자 YYYY-MM-DD
};

/** 저장된 행(목록용) — checklist_confirmations(variant='gosi') 공유 */
export type GosiRow = {
  id: string;
  center: string; // "고속시외"
  operator: string; // 운수사명
  model: string; // "고속시외"
  install_date: string;
  vehicle_numbers: string;
  installer_name: string;
  operator_signer_name: string;
  data: GosiForm;
  pdf_path: string;
  created_at: string;
  updated_at: string;
  modified_by: string;
  deleted_at: string | null;
};
