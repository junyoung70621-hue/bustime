// ─────────────────────────────────────────────────────────────
// 대폐차 자재 지급확인서 공용 타입
// ─────────────────────────────────────────────────────────────

export type Model = "B620" | "B700" | "B710" | "B800";
export type Center = "강남" | "강서" | "강북" | "강동";
export type NewReused = "신규" | "재활용";
export type Purpose = "대폐차" | "증차";
export type OfficeType = "본사" | "영업소";

/** 모델별 품목 정의(정적 템플릿) */
export type ItemTemplate = {
  name: string; // 품목명
  bigo: string; // 비고(용도 설명)
  hasNewReused: boolean; // 신규/재활용 선택 대상 여부
};

/** 작성/저장되는 품목 1행 */
export type ItemState = {
  name: string;
  bigo: string;
  qty: number; // 수량
  hasNewReused: boolean;
  newReused: NewReused | null; // hasNewReused일 때만 값
};

/** 작성 중 폼 전체 상태 */
export type FormState = {
  center: Center | "";
  operator: string; // 운수사
  officeType: OfficeType; // 본사/영업소
  purpose: Purpose; // 대폐차/증차
  model: Model | "";
  vehicleCount: number; // 차량 대수
  vehicleNumbers: string; // 차량번호(선택)
  issuedDate: string; // YYYY-MM-DD
  items: ItemState[];
  receiverName: string; // 인수자(운수회사) 정자명
  receiverSig: string | null; // 인수자 서명 dataURL(PNG)
  transferorName: string; // 인계자(자사) 정자명
  transferorSig: string | null; // 인계자 서명 dataURL(PNG)
};

/** 저장된 확인서(DB row) */
export type ConfirmationRow = {
  id: string;
  center: Center;
  operator: string;
  office_type: string; // 본사/영업소
  model: Model;
  purpose: string; // 대폐차/증차
  vehicle_count: number;
  vehicle_numbers: string;
  items: ItemState[];
  receiver_name: string;
  transferor_name: string;
  issued_date: string;
  pdf_path: string;
  created_at: string;
};
