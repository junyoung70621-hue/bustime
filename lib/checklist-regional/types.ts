// ─────────────────────────────────────────────────────────────
// 설치 완료 체크리스트(지역: 대전·세종) 공용 타입
//   기존 체크리스트(lib/checklist)와 동일한 방식 — 점검표 본문은 CkRowDef 재사용.
//   다른 점: 기종 B400/B500/B600/B650, 헤더가 모델별로 상이, 서명은 점검자 1개.
// ─────────────────────────────────────────────────────────────
import type { OX } from "@/lib/checklist/types";
import type { RegModel } from "./models.generated";

export type { RegModel } from "./models.generated";
export type Region = "대전" | "세종" | "경북" | "제주" | "포항" | "안동" | "김해";

/** 작성/수정 폼 전체 상태 */
export type RegFormState = {
  region: Region | "";
  model: RegModel | "";
  // 상단 헤더
  inspectDate: string; // 점검일 YYYY-MM-DD (기본 오늘)
  vehicleNo: string; // 차량번호
  operatorName: string; // 운수사명
  operatorId: string; // 운수사ID (모델에 따라)
  // 승.하차 ID/IH (승차 / 하차1 / 하차2) — 모델에 따라 ID 또는 IH
  seungCha: string;
  hacha1: string;
  hacha2: string;
  driverId: string; // 운전자단말기 ID/IH
  // 교체후(B600 교체전/교체후) — 위 필드가 교체전
  seungChaAfter: string;
  hacha1After: string;
  hacha2After: string;
  driverIdAfter: string;
  // F/W 버전(B500/B650)
  seungChaFw: string;
  hacha1Fw: string;
  hacha2Fw: string;
  driverFw: string;
  // 케이스1 차량특성
  vehicleType: string; // 선택 라벨(예: "현대 저상 A") — O/X엔 끝글자 표기
  partition: OX; // 격벽설치 유무
  // 점검 항목 O/X (key → checked)
  checks: Record<string, boolean>;
  // 특이사항(마지막 케이스)
  etcContent: string;
  etcQty: string;
  // 서명(점검자 1개)
  inspectorName: string; // 점검자 정자
  inspectorSig: string | null;
  // 확인일(자동)
  confirmDate: string; // YYYY-MM-DD
};

/** 저장된 체크리스트(DB row, 목록용) — 기존 checklist_confirmations 테이블 공유(variant='regional') */
export type RegRow = {
  id: string;
  center: string; // = region(대전/세종)
  operator: string;
  model: string;
  install_date: string;
  vehicle_numbers: string;
  installer_name: string;
  operator_signer_name: string;
  data: RegFormState;
  pdf_path: string;
  created_at: string;
  updated_at: string;
  modified_by: string;
  deleted_at: string | null;
};
