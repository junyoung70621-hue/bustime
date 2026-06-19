// ─────────────────────────────────────────────────────────────
// 공용 설치확인서 — 상수 + 헬퍼
// ─────────────────────────────────────────────────────────────
import type { GongyongBusType, GongyongForm, GongyongVehicle } from "./types";

export { REGIONS, REGION_CODE } from "@/lib/checklist-regional/templates";

export const GONGYONG_BUS_TYPES: GongyongBusType[] = ["시내버스", "마을버스", "리무진", "기타"];
export const MAX_VEHICLES = 10;

export function emptyVehicle(): GongyongVehicle {
  return { vehicleNo: "", main: "", sc1: "", sc2: "", sc3: "", gpsAnt: "", partition: "" };
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
    vehicles: [emptyVehicle()],
    operatorSignerName: "",
    operatorSig: null,
    installerName: "",
    installerSig: null,
    confirmDate: today,
  };
}
