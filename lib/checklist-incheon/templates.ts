// ─────────────────────────────────────────────────────────────
// 인천 B820 설치완료 체크리스트 양식 데이터(엑셀 원본 그대로, 병합 반영)
//   좌석표시기(빈좌석표시기) 아래 "전자노선도 ICON 확인" 행을 추가.
//   태그리스·좌석표시기·전자노선도 3개 항목은 "해당없음" 체크 가능(na=true).
// ─────────────────────────────────────────────────────────────
import type { IncRowDef, IncFormState } from "./types";

export const INC_MODEL = "B820";
export const INC_TITLE = "B820 단말기 설치 체크 리스트";

// B820 점검표 본문 행(케이스 1~6). m = [rowspan, colspan] — 병합에 가려진 셀은 키 없음.
export const INC_ROWS: IncRowDef[] = [
  // ── 케이스1 차량특성 ──────────────────────────────
  {
    caseNo: "1", caseLabel: "차량특성",
    method: "차량 특성 종류 확인",
    point: "일반A , 저상B , 전기차C , 기타D",
    ox: "vehicleType", bigo: "제조사", bigoKind: "manufacturer",
    m: { caseNo: [2, 1], caseLabel: [2, 3], method: [2, 1], point: [1, 1], ox: [1, 1], bigo: [1, 1] },
  },
  {
    point: "격벽설치 유무 기록  ( O / X 기록)",
    ox: "partition", bigo: "모델명", bigoKind: "modelName",
    m: { point: [1, 1], ox: [1, 1], bigo: [1, 1] },
  },

  // ── 케이스2 H/W (9행) ─────────────────────────────
  {
    caseNo: "2", caseLabel: "H/W",
    target: "표출단말기\n승하차단말기", item: "IH일치 확인", method: "단말기 라벨 확인",
    point: "단말기 내부 LCD 표출된 IH와\n단말기 외부 라벨 IH 일치 확인,",
    ox: "check", checkKey: "c_ih",
    m: { caseNo: [9, 1], caseLabel: [9, 1], target: [1, 1], item: [1, 1], method: [1, 1], point: [1, 1], ox: [1, 1], bigo: [1, 1] },
  },
  {
    target: "표출단말기", item: "LCD 확인", method: "부팅 및 통신상태 확인",
    point: "통신상태 확인 및 시간확인, 커넥터 연결상태 확인                  러버패드 부착상태 확인, 블랙 커버 조립상태 확인 , ",
    ox: "check", checkKey: "c_lcd",
    m: { target: [1, 1], item: [4, 1], method: [1, 1], point: [1, 1], ox: [1, 1], bigo: [1, 1] },
  },
  {
    target: "승차단말기", method: "부팅 및 통신상태 확인",
    point: "통신상태 확인 및 시간확인, 커넥터 연결상태 확인\n백 커버 조립상태 확인, 상단,후면 고무러버 확인",
    ox: "check", checkKey: "c_seung",
    m: { target: [1, 1], method: [1, 1], point: [1, 1], ox: [1, 1], bigo: [1, 1] },
  },
  {
    target: "하차단말기1", method: "부팅 및 통신상태 확인",
    point: "통신상태 확인 및 시간확인, 커넥터 연결상태 확인\n백 커버 조립상태 확인, 상단,후면 고무러버 확인",
    ox: "check", checkKey: "c_hacha1",
    m: { target: [1, 1], method: [1, 1], point: [1, 1], ox: [1, 1], bigo: [1, 1] },
  },
  {
    target: "하차단말기2", method: "부팅 및 통신상태 확인",
    point: "통신상태 확인 및 시간확인, 커넥터 연결상태 확인\n백 커버 조립상태 확인, 상단,후면 고무러버 확인",
    ox: "check", checkKey: "c_hacha2",
    m: { target: [1, 1], method: [1, 1], point: [1, 1], ox: [1, 1], bigo: [1, 1] },
  },
  {
    target: "LTE외장모뎀", item: "램프확인", method: "램프 등 및 통신확인",
    point: "LTE외장모뎀 전원 및 통신상태 확인",
    ox: "check", checkKey: "c_lte_modem",
    m: { target: [1, 1], item: [1, 1], method: [1, 1], point: [1, 1], ox: [1, 1], bigo: [1, 1] },
  },
  {
    target: "브라켓 및 케이블 고정상태 확인", method: "브라켓 고정,케이블 고정 타이 마감",
    point: "브라켓 고정상태,\n케이블의 케이블타이 작업 유무 확인",
    ox: "check", checkKey: "c_bracket",
    m: { target: [1, 2], method: [1, 1], point: [1, 1], ox: [1, 1], bigo: [1, 1] },
  },
  {
    target: "GPS , LTE , 타코메타", method: "케이블 연결상태 확인",
    point: "커넥터 연결상태 확인 및 점검 (제 위치에 연결 되었는가)",
    ox: "check", checkKey: "c_cable",
    m: { target: [1, 2], method: [1, 1], point: [1, 1], ox: [1, 1], bigo: [1, 1] },
  },
  {
    target: "DTG 확인", method: "DTG APP에서 확인",
    point: "차량,DTG간 연결상태 확인 및 점검 (정상적으로 연결 되었는가)",
    ox: "check", checkKey: "c_dtg",
    m: { target: [1, 2], method: [1, 1], point: [1, 1], ox: [1, 1], bigo: [1, 1] },
  },

  // ── 케이스3 운행 대기중 (13행) ─────────────────────
  {
    caseNo: "3", caseLabel: "운행\n대기중",
    target: "표출단말기\n상태바 정보\n확인", item: " GPS Icon",
    point: "표출부 상태바에 GPS Icon 활성화.\nAnt Bar가 3개이상 ",
    ox: "check", checkKey: "c_gps",
    m: { caseNo: [13, 1], caseLabel: [13, 1], target: [10, 1], item: [1, 1], method: [1, 1], point: [1, 1], ox: [1, 1], bigo: [1, 1] },
  },
  {
    item: " 단말운영 Icon", point: "표출부 상태바에 T Icon 이\n흰색 실선으로 표출",
    ox: "check", checkKey: "c_term_op",
    m: { item: [1, 1], method: [1, 1], point: [1, 1], ox: [1, 1], bigo: [1, 1] },
  },
  {
    item: " LTE Icon", point: "표출부 상태바에 LTE Ico 활성화.\nAnt Bar가 4개이상",
    ox: "check", checkKey: "c_lte_icon",
    m: { item: [1, 1], method: [1, 1], point: [1, 1], ox: [1, 1], bigo: [1, 1] },
  },
  {
    item: "수집센터 Icon", point: "표출부 상태바에 D Icon 이\n흰색 실선으로 표출",
    ox: "check", checkKey: "c_center",
    m: { item: [1, 1], method: [1, 1], point: [1, 1], ox: [1, 1], bigo: [1, 1] },
  },
  {
    item: "BMS Icon", point: "표출부 상태바에 B Icon 이\n흰색 실선으로 표출",
    ox: "check", checkKey: "c_bms",
    m: { item: [1, 1], method: [1, 1], point: [1, 1], ox: [1, 1], bigo: [1, 1] },
  },
  {
    item: "태그리스 ICON 확인", point: "태그리스 장치 연결 상태 (태그리스 기능을 사용할 때만 표시)",
    ox: "check", checkKey: "c_tagless", na: true,
    m: { item: [1, 1], method: [1, 1], point: [1, 1], ox: [1, 1], bigo: [1, 1] },
  },
  {
    item: "좌석표시기 ICON 확인", point: "좌석표시기 장치 연결 상태",
    ox: "check", checkKey: "c_seat", na: true,
    m: { item: [1, 1], method: [1, 1], point: [1, 1], ox: [1, 1], bigo: [1, 1] },
  },
  {
    // 신규 추가 행(좌석표시기 아래)
    item: "전자노선도 ICON 확인", point: "전자노선도 장치 연결 상태",
    ox: "check", checkKey: "c_route", na: true,
    m: { item: [1, 1], method: [1, 1], point: [1, 1], ox: [1, 1], bigo: [1, 1] },
  },
  {
    item: "DTG ICON 확인", point: "DTG 장치 연결 상태",
    ox: "check", checkKey: "c_dtg_icon",
    m: { item: [1, 1], method: [1, 1], point: [1, 1], ox: [1, 1], bigo: [1, 1] },
  },
  {
    item: "승하차 통신\n연결 확인", point: "표출부 승하차단말기 Icon 이\n녹색으로 표출",
    ox: "check", checkKey: "c_updown_comm",
    m: { item: [1, 1], method: [1, 1], point: [1, 1], ox: [1, 1], bigo: [1, 1] },
  },
  {
    target: "표출단말기", item: "시간확인",
    method: "표출단말기 화면에서 왼쪽 \n상단에 현재일시 현시 확인", point: "현재일시 제대로 현시",
    ox: "time", bigo: "시간/분",
    m: { target: [3, 1], item: [1, 1], method: [1, 1], point: [1, 1], ox: [1, 1], bigo: [1, 1] },
  },
  {
    item: "버전확인", method: "통합단말기 커널 버전\n통합단말기 램디스크버전",
    ox: "version",
    m: { item: [1, 1], method: [1, 1], point: [1, 1], ox: [1, 1], bigo: [1, 1] },
  },
  {
    item: "차량정보설정", method: "차량의 승객 좌석수 입력",
    ox: "none", bigo: "좌석수", bigoKind: "seat",
    m: { item: [1, 1], method: [1, 2], ox: [1, 1], bigo: [1, 1] },
  },

  // ── 케이스4 운행 시작 (4행) ────────────────────────
  {
    caseNo: "4", caseLabel: "운행\n시작",
    target: "표출단말기", item: "BMS , GPS", method: "앞뒤차 표시 , 정류장표시 확인",
    point: "표출단말기에서  '운행을 시작합니다' 음성 출력",
    ox: "check", checkKey: "c_bms_gps",
    m: { caseNo: [4, 1], caseLabel: [4, 1], target: [1, 1], item: [1, 1], method: [1, 1], point: [1, 1], ox: [1, 1], bigo: [1, 1] },
  },
  {
    target: "승차단말기", item: "통신확인 및\n카드 TAG", method: "볼룸 확인 , 카드 인식여부 확인",
    point: "승차 카드TAG인식 테스트 \n'잔액이 부족합니다' 음성 출력",
    ox: "check", checkKey: "c_card_seung",
    m: { target: [1, 1], item: [1, 1], method: [1, 1], point: [1, 1], ox: [1, 1], bigo: [1, 1] },
  },
  {
    target: "하차1단말기", item: "통신확인 및\n카드 TAG", method: "볼룸 확인 , 카드 인식여부 확인",
    point: "하차1 카드TAG인식 테스트 \n'잔액이 부족합니다' 음성 출력",
    ox: "check", checkKey: "c_card_hacha1",
    m: { target: [1, 1], item: [1, 1], method: [1, 1], point: [1, 1], ox: [1, 1], bigo: [1, 1] },
  },
  {
    target: "하차2단말기", item: "통신확인 및\n카드 TAG", method: " 볼륨 확인 , 카드 인식여부 확인",
    point: "하차2 카드TAG인식 테스트 \n'잔액이 부족합니다' 음성 출력",
    ox: "check", checkKey: "c_card_hacha2",
    m: { target: [1, 1], item: [1, 1], method: [1, 1], point: [1, 1], ox: [1, 1], bigo: [1, 1] },
  },

  // ── 케이스5 운행 종료 (2행) ────────────────────────
  {
    caseNo: "5", caseLabel: "운행\n종료",
    target: "표출단말기", item: "운행종료", method: "표출단말기에서 [운행] ▶ [확인]",
    point: "1.표출단말기에서 '운행을 종료합니다' 음성 출력\n2.종료 처리 정상여부 확인",
    ox: "check", checkKey: "c_end",
    m: { caseNo: [2, 1], caseLabel: [2, 1], target: [2, 1], item: [1, 1], method: [1, 1], point: [1, 1], ox: [1, 1], bigo: [1, 1] },
  },
  {
    item: "거래내역전송", method: "[운행종료]후 미전송 거래내역 파일갯수 확인",
    point: "미전송거래내역 파일:0",
    ox: "check", checkKey: "c_tx", bigo: '"미전송 발생시\n 센터장보고"',
    m: { item: [1, 1], method: [1, 1], point: [1, 1], ox: [1, 1], bigo: [1, 1] },
  },

  // ── 케이스6 특이사항 (2행) ─────────────────────────
  {
    caseNo: "6", caseLabel: "특이사항",
    target: "추가 자재사용 내역 및 특이사항", method: "운전자 봉 / 승하차 봉 etc.",
    ox: "etc", bigo: "수량", bigoKind: "etcQty",
    m: { caseNo: [2, 1], caseLabel: [2, 1], target: [1, 2], method: [1, 1], point: [1, 1], ox: [1, 1], bigo: [1, 1] },
  },
  {
    target: "입력사항 재확인",
    method: "차량번호 , 운수사ID , 단말기IH ,\n 차대번호 등 입력사항 재확인",
    point: "단말기 설치 시 직접입력해야 하는 부분이 정확하게 일치하는가",
    ox: "check", checkKey: "c_recheck",
    m: { target: [1, 2], method: [1, 1], point: [1, 1], ox: [1, 1], bigo: [1, 1] },
  },
];

// 모달 체크 항목(순서·라벨·해당없음 여부) — 본문 행에서 파생
export type IncCheckItem = { key: string; caseNo: string; caseLabel: string; label: string; na: boolean };
export const INC_CHECK_ITEMS: IncCheckItem[] = (() => {
  const out: IncCheckItem[] = [];
  let curNo = "", curLabel = "";
  for (const r of INC_ROWS) {
    if (r.caseNo) curNo = r.caseNo;
    if (r.caseLabel) curLabel = r.caseLabel.replace(/\n/g, " ");
    if (r.ox === "check" && r.checkKey) {
      const label = [r.target, r.item, r.method].filter(Boolean).join(" · ").replace(/\s+/g, " ").trim();
      out.push({ key: r.checkKey, caseNo: curNo, caseLabel: curLabel, label, na: !!r.na });
    }
  }
  return out;
})();

// 전체 체크 키 / 해당없음 가능 키
export const INC_CHECK_KEYS = INC_CHECK_ITEMS.map((i) => i.key);
export const INC_NA_KEYS = INC_CHECK_ITEMS.filter((i) => i.na).map((i) => i.key);

export function emptyIncForm(today: string): IncFormState {
  return {
    center: "인천",
    installDate: today,
    installTime: "",
    routeNo: "",
    vehicleNo: "",
    operatorName: "",
    operatorId: "",
    seungChaIH: "",
    hacha1IH: "",
    hacha2IH: "",
    seungChaModuleIH: "",
    hacha1ModuleIH: "",
    hacha2ModuleIH: "",
    mainIH: "",
    lteModemIH: "",
    pyochulIH: "",
    pyochulModuleIH: "",
    vehicleType: "",
    partition: "",
    manufacturer: "",
    modelName: "",
    checks: {},
    naChecks: {},
    timeValue: "",
    fwVer: "",
    osVer: "",
    seatCount: "",
    etcContent: "",
    etcQty: "",
    installerName: "",
    installerSig: null,
    confirmDate: today,
  };
}

// 항목 완료 판정: 체크(○) 또는 해당없음이면 완료
export function incItemDone(d: IncFormState, key: string, na: boolean): boolean {
  return !!d.checks[key] || (na && !!d.naChecks[key]);
}
