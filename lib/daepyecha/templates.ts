// ─────────────────────────────────────────────────────────────
// 모델별 자재 품목 템플릿 (원본 엑셀 "설치 자재 지급확인서_양식"에서 추출)
//   sheet1=B620, sheet3=B700, sheet5=B710, sheet7=B800 (각 12품목, 행 8~19)
//   hasNewReused = 원본 비고에 "(신규 , 재활용)" 표기가 있던 품목
// ※ 실제 양식과 품목/비고가 다르면 이 파일만 수정하면 됨.
// ─────────────────────────────────────────────────────────────
import type { Model, Center, ItemTemplate } from "./types";

export const CENTERS: Center[] = ["강남", "강서", "강북", "강동"];
export const MODELS: Model[] = ["B620", "B700", "B710", "B800"];

// Storage 객체 키는 ASCII만 허용 → 센터명을 영문 코드로 매핑(경로용)
export const CENTER_CODE: Record<Center, string> = {
  강남: "gangnam",
  강서: "gangseo",
  강북: "gangbuk",
  강동: "gangdong",
};

export const MODEL_TEMPLATES: Record<Model, ItemTemplate[]> = {
  B620: [
    { name: "운전자 전원 케이블 (6M) (프린터 겸용)", bigo: "* 차량메인전원 → 운전자, 영수증 전원공급용", hasNewReused: false },
    { name: "승차 전원 케이블 (6M)", bigo: "* 차량메인전원 → 승차 전원공급용", hasNewReused: false },
    { name: "승차 통신 케이블 (1.5M / 6M)", bigo: "* 운전자 → 승차 통신용", hasNewReused: false },
    { name: "영수증기 통신 케이블 (1M)", bigo: "* 운전자 → 영수증기 통신용", hasNewReused: false },
    { name: "타코메타 케이블", bigo: "* 타코메타 전원 및 통신용", hasNewReused: false },
    { name: "GPS ANT", bigo: "* GPS 안테나 수신용", hasNewReused: false },
    { name: "LTE ANT", bigo: "* LTE 안테나 수신용", hasNewReused: true },
    { name: "운전자봉 (U형 , ㄱ형)", bigo: "* 운전자 설치 및 고정용", hasNewReused: true },
    { name: "운전자 브라켓 (힌지 포함)", bigo: "* 운전자 설치 및 고정용", hasNewReused: true },
    { name: "운전자 블랙커버", bigo: "* 운전자 백커버", hasNewReused: true },
    { name: "승하차 브라켓 (가로형 , 세로형)", bigo: "* 승하차 설치 및 고정용", hasNewReused: true },
    { name: "승하차 백커버 (가로형 , 세로형)", bigo: "* 승하차 설치 및 고정용", hasNewReused: true },
  ],
  B700: [
    { name: "통합단말기 전원 케이블", bigo: "* 차량메인전원 → 통합 전원 공급용", hasNewReused: false },
    { name: "표출기 통신케이블 (8M)", bigo: "* 통합 → 표출기 전원 및 통신용", hasNewReused: false },
    { name: "승차 통신 케이블 (10M)", bigo: "* 통합 → 승차 전원 및 통신용", hasNewReused: false },
    { name: "하차1 통신 케이블 (20M)", bigo: "* 통합 → 하차1 전원 및 통신용", hasNewReused: false },
    { name: "하차2 통신 케이블 (18M)", bigo: "* 통합 → 하차2 전원 및 통신용", hasNewReused: false },
    { name: "타코메타 케이블", bigo: "* 타코메타 전원 및 통신용", hasNewReused: false },
    { name: "외장 LTE 모뎀 케이블", bigo: "* 통합 → 외장모뎀 전원 및 통신용", hasNewReused: false },
    { name: "V2X 전원 케이블", bigo: "* V2X 전원 공급용", hasNewReused: false },
    { name: "GPS ANT", bigo: "* GPS 안테나 수신용", hasNewReused: true },
    { name: "LTE ANT", bigo: "* LTE 안테나 수신용", hasNewReused: true },
    { name: "운전자봉 (U형 , ㄱ형)", bigo: "* 표출기 설치 및 고정용", hasNewReused: true },
    { name: "운전자 브라켓 (힌지 포함)", bigo: "* 표출기 설치 및 고정용", hasNewReused: true },
  ],
  B710: [
    { name: "통합단말기 전원 케이블 (일반 , 카운티용)", bigo: "* 차량메인전원 → 통합 전원 공급용", hasNewReused: false },
    { name: "표출기 통신케이블", bigo: "* 통합 → 표출기 전원 및 통신용", hasNewReused: false },
    { name: "승차 통신 케이블 (10M)", bigo: "* 통합 → 승차 전원 및 통신용", hasNewReused: false },
    { name: "하차1 통신 케이블 (20M)", bigo: "* 통합 → 하차1 전원 및 통신용", hasNewReused: false },
    { name: "하차2 통신 케이블 (18M)", bigo: "* 통합 → 하차2 전원 및 통신용", hasNewReused: false },
    { name: "타코메타 케이블", bigo: "* 타코메타 전원 및 통신용", hasNewReused: false },
    { name: "외장 LTE 모뎀 케이블", bigo: "* 통합 → 외장모뎀 전원 및 통신용", hasNewReused: false },
    { name: "GPS ANT", bigo: "* GPS 안테나 수신용", hasNewReused: false },
    { name: "LTE ANT", bigo: "* LTE 안테나 수신용", hasNewReused: true },
    { name: "운전자봉 (U형 , ㄱ형)", bigo: "* 표출기 설치 및 고정용", hasNewReused: true },
    { name: "운전자 브라켓 (힌지 포함)", bigo: "* 표출기 설치 및 고정용", hasNewReused: true },
    { name: "통합단말기 고정브라켓", bigo: "* 통합단말기 설치 및 고정용", hasNewReused: true },
  ],
  B800: [
    { name: "통합단말기 전원 케이블", bigo: "* 차량메인전원 → 통합 전원 공급용", hasNewReused: false },
    { name: "표출기 통신케이블", bigo: "* 통합 → 표출기 전원 및 통신용", hasNewReused: false },
    { name: "승차 통신 케이블 (7M)", bigo: "* 통합 → 승차 전원 및 통신용", hasNewReused: false },
    { name: "하차1 통신 케이블 (17M)", bigo: "* 통합 → 하차1 전원 및 통신용", hasNewReused: false },
    { name: "하차2 통신 케이블 (15M)", bigo: "* 통합 → 하차2 전원 및 통신용", hasNewReused: false },
    { name: "타코메타 케이블", bigo: "* 타코메타 전원 및 통신용", hasNewReused: false },
    { name: "외장 LTE 모뎀 케이블", bigo: "* 통합 → 외장모뎀 전원 및 통신용", hasNewReused: false },
    { name: "GPS ANT", bigo: "* GPS 안테나 수신용", hasNewReused: false },
    { name: "운전자봉 (U형 , ㄱ형)", bigo: "* 표출기 설치 및 고정용", hasNewReused: true },
    { name: "운전자 브라켓 (힌지 포함)", bigo: "* 표출기 설치 및 고정용", hasNewReused: true },
    { name: "통합단말기 고정브라켓", bigo: "* 통합단말기 설치 및 고정용", hasNewReused: true },
    { name: "통합단말기 백커버", bigo: "* 통합단말기 백커버", hasNewReused: true },
  ],
};

/** 모델 선택 시 빈 품목 상태 생성(수량은 차량 대수로 채움) */
export function itemsForModel(model: Model, qty: number): import("./types").ItemState[] {
  return MODEL_TEMPLATES[model].map((t) => ({
    name: t.name,
    bigo: t.bigo,
    qty,
    hasNewReused: t.hasNewReused,
    newReused: t.hasNewReused ? "신규" : null,
  }));
}
