// ─────────────────────────────────────────────────────────────
// 공용 설치확인서 — 상수 + 헬퍼
// ─────────────────────────────────────────────────────────────
import type { GongyongBusType, GongyongForm, GongyongVehicle } from "./types";

export { REGIONS, REGION_CODE } from "@/lib/checklist-regional/templates";

export const GONGYONG_BUS_TYPES: GongyongBusType[] = ["시내버스", "마을버스", "리무진", "기타"];
export const MAX_VEHICLES = 15;

// 포항 전용 회사 목록(회사명 선택 시 영업소/주소/전화 자동입력)
export type PohangCompany = { company: string; office: string; address: string; phone: string };
export const POHANG_COMPANIES: PohangCompany[] = [
  { company: "㈜포항버스", office: "양덕영업소", address: "경북 포항 북구 양덕동", phone: "054-256-8500" },
  { company: "㈜포항버스", office: "문덕영업소", address: "경북 포항 남구 오천읍", phone: "054-256-8500" },
  { company: "㈜포항버스 마을", office: "", address: "경북 포항 북구 흥해리", phone: "054-256-8500" },
  { company: "㈜금아여행", office: "", address: "경북 포항 남구 희망대로659번길 40", phone: "054-272-6671" },
];

export function emptyVehicle(): GongyongVehicle {
  return { vehicleNo: "", main: "", sc1: "", sc2: "", sc3: "", gpsAnt: "", partition: "", iface: "", modem: "" };
}

export function emptyGongyongForm(today: string): GongyongForm {
  return {
    region: "",
    installDate: today,
    busType: "",
    operatorName: "",
    officeType: "",
    installType: "",
    address: "",
    phone: "",
    routeType: "",
    customerRequest: "",
    etc: "",
    docType: "설치",
    companyName: "",
    officeName: "",
    newTerminal: false,
    vehicles: [emptyVehicle()],
    operatorSignerName: "",
    operatorSig: null,
    installerName: "",
    installerSig: null,
    confirmDate: today,
  };
}
