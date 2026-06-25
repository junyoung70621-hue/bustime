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

// 지역별 운수사 목록(운수사 선택 시 주소/전화 자동입력). 출처: 대전·계룡·세종 버스인가대수 자료.
export type RegionCompany = { name: string; address: string; phone: string };
export const REGION_COMPANIES: Record<string, RegionCompany[]> = {
  대전: [
    { name: "경익운수㈜", address: "대전 유성구 계백로801번길 31(원내동 461)", phone: "042-581-1511" },
    { name: "계룡버스㈜", address: "대전 대덕구 덕암로81번길 82(상서동211)", phone: "042-639-6800" },
    { name: "국민버스㈜", address: "대전 대덕구 신탄진로 756번안길 68-1(신탄진동 272-2)", phone: "042-626-2169" },
    { name: "금남교통㈜", address: "대전 대덕구 대전로1032번길 40(오정동 478-8)", phone: "042-582-3527" },
    { name: "대전교통㈜", address: "대전 중구 계룡로 742(오류동192-6)", phone: "042-523-2575" },
    { name: "대전버스㈜", address: "대전 중구 대둔산로 137번길 23(안영동 379)", phone: "042-586-9977" },
    { name: "대전비알티㈜", address: "대전 유성구 금남구즉로 1170(금고동 481)", phone: "042-931-9800" },
    { name: "대전승합㈜", address: "대전 대덕구 신탄진로315번길 72(신대동 4-1)", phone: "042-544-0181" },
    { name: "대전운수㈜", address: "대전 대덕구 신탄진로315번길 72(신대동 4-1)", phone: "042-626-2271" },
    { name: "동건운수㈜", address: "대전 대덕구 산업단지로87번길 56(신일동46-1)", phone: "042-936-3613" },
    { name: "동인여객㈜", address: "대전 동구 금산로 471(구도동 81)", phone: "042-285-8100" },
    { name: "산호교통㈜", address: "대전 동구 금산로 471(구도동 81)", phone: "042-285-8057" },
    { name: "옥천버스㈜", address: "충북 옥천군 옥천읍 삼금로 9(금구리139-8)", phone: "043-732-7700" },
    { name: "유성마을버스㈜", address: "대전 유성구 원계산로 194-1(계산동187-3)", phone: "042-864-3133" },
    { name: "한일버스㈜", address: "대전 대덕구 신탄진로315번길 72(신대동 4-1)", phone: "042-936-7710" },
    { name: "협진운수㈜", address: "대전 유성구 금남구즉로 1377(봉산동 705)", phone: "042-936-7961" },
  ],
  계룡: [
    { name: "경익버스", address: "충남 계룡시 두마면 팥거리1길 42(두계리36-2)", phone: "042-541-2220" },
  ],
  세종: [
    { name: "세종교통(일반)", address: "세종시 연서면 당산로 389(봉암리117-7)", phone: "044-867-7166" },
    { name: "세종교통(M버스)", address: "세종시 갈매로 1008(누리동194-24)", phone: "044-867-7166" },
    { name: "세종도시교통공사", address: "세종특별자치시 해들로 47(대평동270-22)", phone: "044-850-0125" },
    { name: "㈜케이밴코리아", address: "세종특별자치시 연동면 응암리 675-1", phone: "044-866-5505" },
    { name: "㈜세종제일운수", address: "세종시 갈매로 1008(누리동194-24)", phone: "044-868-7701" },
    { name: "㈜세종제일운수(M버스)", address: "세종시 갈매로 1008(누리동194-24)", phone: "044-868-7701" },
    { name: "오토노머스에이투지", address: "세종시 집현중앙7로3 산학연클러스터지원센터 406호", phone: "0507-1315-4630" },
  ],
};

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
