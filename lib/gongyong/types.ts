// ─────────────────────────────────────────────────────────────
// 공용 설치확인서 타입 (대전·세종 등 지역 — 다차량 1장 양식)
//   엑셀 "공용 설치확인서.xlsx" 기준.
// ─────────────────────────────────────────────────────────────
import type { Region } from "@/lib/checklist-regional/types";

export type GongyongBusType = "시내버스" | "마을버스" | "리무진" | "기타";
export type GongyongInstallType = "증차" | "대폐차";
export type GongyongOffice = "본사" | "영업소";

/** 표 1행 = 차량 1대 */
export type GongyongVehicle = {
  vehicleNo: string; // 차량번호
  main: string; // 운전자조작기(버스메인) IH
  sc1: string; // 승하차단말기1
  sc2: string; // 승하차단말기2
  sc3: string; // 승하차단말기3
  gpsAnt: string; // GPS 안테나(수량)
  partition: string; // ㄷ자 격벽용(수량)
};

/** 작성/수정 폼 전체 상태 */
export type GongyongForm = {
  region: Region | "";
  installDate: string; // 설치확인일자 YYYY-MM-DD
  busType: GongyongBusType | ""; // 버스 구분
  operatorName: string; // 운수사명
  officeType: GongyongOffice | ""; // 본사/영업소
  installType: GongyongInstallType | ""; // 설치구분(증차/대폐차)
  address: string; // 주소
  phone: string; // 전화번호
  routeType: string; // 노선구분
  customerRequest: string; // 고객 요청 사항
  etc: string; // 기타 사항
  vehicles: GongyongVehicle[]; // 차량 목록(최대 10)
  // 서명
  operatorSignerName: string; // 운수사 확인
  operatorSig: string | null;
  installerName: string; // 설치자 확인
  installerSig: string | null;
  confirmDate: string; // YYYY-MM-DD
};

/** 저장된 행(목록용) — checklist_confirmations(variant='gongyong') 공유 */
export type GongyongRow = {
  id: string;
  center: string; // = region
  operator: string;
  model: string; // "공용"
  install_date: string;
  vehicle_numbers: string;
  installer_name: string;
  operator_signer_name: string;
  data: GongyongForm;
  pdf_path: string;
  created_at: string;
  updated_at: string;
  modified_by: string;
  deleted_at: string | null;
};
