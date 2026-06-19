// ─────────────────────────────────────────────────────────────
// 고속/시외 설치확인서 — 고정 품목 + 헬퍼
// ─────────────────────────────────────────────────────────────
import type { GosiForm, GosiItem, GosiPurpose } from "./types";

export const GOSI_PURPOSES: GosiPurpose[] = ["증차", "대폐차", "재설치"];

// 고정 자재 품목(워드 양식 11종)
export const GOSI_ITEMS: string[] = [
  "고속버스 거치대(비금호향)",
  "Main 전원케이블(비금호향)(프린터 전원케이블 포함)-DIY 퓨즈",
  "행선판 케이블(5M)",
  "AUDIO케이블 IN(8m)",
  "AUDIO 케이블 OUT(8m)",
  "VIDEO 케이블 IN (8M)",
  "VIDEO 케이블 OUT (8m)",
  "베이스플레이트",
  "쿠션(3M접착형)",
  "GPS ANT(5M)",
  "LTE ANT",
];

export function fixedItems(): GosiItem[] {
  return GOSI_ITEMS.map((name) => ({ name, qty: "", done: false, custom: false }));
}

export function emptyGosiForm(today: string): GosiForm {
  return {
    purpose: "",
    requestDate: today,
    installDate: today,
    operatorName: "",
    vehicleNo: "",
    driverIH: "",
    scIH: "",
    receiptSn: "",
    barcodeSn: "",
    items: fixedItems(),
    tmoneyName: "",
    tmoneySig: null,
    operatorSignerName: "",
    operatorSig: null,
    confirmDate: today,
  };
}
