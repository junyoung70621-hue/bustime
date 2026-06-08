// ⚠ 자동 생성 (엑셀에서 추출, 병합정보 포함) — 직접 수정 금지
import type { CkModel, CkRowDef } from "./types";

export const CK_MODELS: CkModel[] = ["B620(한강셔틀)","B600","B620","B700","B710","B800"];

export const CK_MODELS_DATA: Record<CkModel, { title: string; rows: CkRowDef[] }> = {
 "B620(한강셔틀)": {
  "title": "B620(한강셔틀) 단말기 체크 리스트",
  "rows": [
   {
    "caseNo": 1,
    "caseLabel": "차량특성",
    "target": "",
    "item": "",
    "method": "차량 특성 및 종류 확인",
    "point": "일반A , 저상B , 전기차C , 기타D",
    "kind": "vehicleType",
    "bigo": "제조사",
    "bigoKind": "manufacturer",
    "m": {
     "caseNo": [
      2,
      1
     ],
     "caseLabel": [
      2,
      3
     ],
     "method": [
      2,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 1,
    "caseLabel": "차량특성",
    "target": "",
    "item": "",
    "method": "",
    "point": "격벽설치 유무 기록 ( O / X 기록)",
    "kind": "partition",
    "bigo": "모델명",
    "bigoKind": "modelName",
    "m": {
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "운전자단말기,\r\n승하차단말기",
    "item": "수집센터, 운영관리 IP",
    "method": "단말기 센터시스템 정보 설정",
    "point": "단말기 내부 LCD 표출된 IP 확인",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "caseNo": [
      5,
      1
     ],
     "caseLabel": [
      5,
      1
     ],
     "target": [
      2,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "",
    "item": "IH일치 확인",
    "method": "단말기 라벨 확인",
    "point": "단말기 내부 LCD 표출된 IH와\r\n단말기 외부 라벨 IH 일치 확인,",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "운전자단말기",
    "item": "LCD 확인",
    "method": "부팅 및 통신상태 확인",
    "point": "통신상태 확인 및 시간확인, 서큘러 체결상태 확인 러버패드 부착상태 확인, 블랙 커버 조립상태 확인 ,",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "I형 브라켓,단말기브라켓 및\r\n 케이블 고정상태 확인",
    "item": "",
    "method": "브라켓 고정,케이블 고정 타이 마감",
    "point": "브라켓 고정상태,\r\n케이블의 케이블타이 작업 유무 확인",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      2
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "GPS 케이블, LTE, 안테나",
    "item": "",
    "method": "고정상태 확인",
    "point": "컨넥터 잠김상태 확인 및 조임",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      2
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 3,
    "caseLabel": "운행\r\n대기중",
    "target": "운전자단말기",
    "item": "시간확인",
    "method": "운전자단말기 화면에서 왼쪽 \r\n상단에 현재일시 현시 확인",
    "point": "현재일시 제대로 현시",
    "kind": "time",
    "bigo": "시간/분 표기",
    "bigoKind": "static",
    "m": {
     "caseNo": [
      3,
      1
     ],
     "caseLabel": [
      3,
      1
     ],
     "target": [
      3,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 3,
    "caseLabel": "운행\r\n대기중",
    "target": "",
    "item": "차량정보설정",
    "method": "좌석수 표시",
    "point": "차량의 승객 좌석수 입력",
    "kind": "seat",
    "bigo": "좌석 수",
    "bigoKind": "static",
    "m": {
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 3,
    "caseLabel": "운행\r\n대기중",
    "target": "",
    "item": "운행시작",
    "method": "운전자단말기 화면에서 운행대기중 화면 현시 중에\r\n[운행]버튼 ▶ 운전자ID입력 \r\n▶ [확인]버튼",
    "point": "-.다음과 같은 동작을 확인하여 운행이 정상적으로 \r\n시작됨을 확인\r\n1. 운전자단말기에서 '운행을시작합니다' 음성 출력\r\n2. 운전자단말기 메인화면 우측 상단 확인 \r\n - BMS 감도확인\r\n - c-sys, t-sys 감도확인\r\n - LTE, GPS, WLAN 감도확인\r\n3. 운전자단말기 메인화면 [내차이미지]에 정류장 표시\r\n4. 단말기 시간이 정상적으로 표시되는지 확인",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 4,
    "caseLabel": "운행중",
    "target": "운전자단말기",
    "item": "BMS",
    "method": "BMS 안테나 감도 확인",
    "point": "BMS 감도 상태확인\r\n- 화면 중앙상단 BMS 감도 상태 COLOR 기록 (녹색)",
    "kind": "check",
    "bigo": "감도 상태 COLOR 기록",
    "bigoKind": "static",
    "m": {
     "caseNo": [
      3,
      1
     ],
     "caseLabel": [
      3,
      1
     ],
     "target": [
      1,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 4,
    "caseLabel": "운행중",
    "target": "운전자단말기",
    "item": "c-sys, t-sys",
    "method": "c-sys, t-sys 감도 확인",
    "point": "c-sys, t-sys 감도 상태확인\r\n- 화면 중앙상단 c-sys, t-sys 감도 상태 COLOR 기록(녹색)",
    "kind": "check",
    "bigo": "감도 상태 COLOR 기록",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 4,
    "caseLabel": "운행중",
    "target": "운전자단말기",
    "item": "LTE, GPS, WLAN",
    "method": "LTE, GPS, WLAN 감도 확인",
    "point": "LTE, GPS, WLAN 감도 상태확인\r\n- 화면 중앙상단 LTE, GPS, WLAN 감도 BAR 기록",
    "kind": "check",
    "bigo": "감도 칸수 기록\r\n( )칸",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 5,
    "caseLabel": "운행종료",
    "target": "운전자단말기,\r\n승.하차단말기",
    "item": "운행종료",
    "method": "운전자단말기에서 [운행] ▶ [확인]",
    "point": "1.운전자단말기에서 '운행을 종료합니다' 음성 출력\r\n2.종료 처리 정상여부 확인",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "caseNo": [
      2,
      1
     ],
     "caseLabel": [
      2,
      1
     ],
     "target": [
      1,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 5,
    "caseLabel": "운행종료",
    "target": "운전자단말기,\r\n승.하차단말기",
    "item": "거래내역전송",
    "method": "[운행종료]후 미전송 거래내역 파일갯수 확인",
    "point": "미전송거래내역 파일:0",
    "kind": "check",
    "bigo": "\"미전송 발생시\r\n 센터장보고\"",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 6,
    "caseLabel": "특이사항",
    "target": "추가 자재사용 내역 및 특이사항",
    "item": "",
    "method": "운전자 봉 / 승하차 봉 etc.",
    "point": "내용기재",
    "kind": "etc",
    "bigo": "수량 :",
    "bigoKind": "etcQty",
    "m": {
     "caseNo": [
      2,
      1
     ],
     "caseLabel": [
      2,
      1
     ],
     "target": [
      1,
      2
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 6,
    "caseLabel": "특이사항",
    "target": "입력사항 재확인",
    "item": "",
    "method": "차량번호 , 운수사ID\r\n단말기IH 등 입력사항 재확인",
    "point": "단말기 설치 시 직접입력해야 하는 부분이 정확하게 일치하는가",
    "kind": "installer",
    "bigo": "(인)",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      2
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   }
  ]
 },
 "B600": {
  "title": "B600 단말기 체크 리스트",
  "rows": [
   {
    "caseNo": 1,
    "caseLabel": "차량특성",
    "target": "",
    "item": "",
    "method": "차량 특성 및 종류 확인",
    "point": "일반A , 저상B , 전기차C , 기타D",
    "kind": "vehicleType",
    "bigo": "제조사",
    "bigoKind": "manufacturer",
    "m": {
     "caseNo": [
      2,
      1
     ],
     "caseLabel": [
      2,
      3
     ],
     "method": [
      2,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 1,
    "caseLabel": "차량특성",
    "target": "",
    "item": "",
    "method": "",
    "point": "격벽설치 유무 기록 ( O / X 기록)",
    "kind": "partition",
    "bigo": "모델명",
    "bigoKind": "modelName",
    "m": {
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "운전자단말기,\r\n승.하차단말기",
    "item": "수집센터, 운영관리 IP",
    "method": "단말기 센터시스템 정보 설정",
    "point": "단말기 내부 LCD 표출된 IP 확인",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "caseNo": [
      8,
      1
     ],
     "caseLabel": [
      8,
      1
     ],
     "target": [
      2,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "",
    "item": "IH일치 확인",
    "method": "단말기 라벨 확인",
    "point": "단말기 내부 LCD 표출된 IH와\r\n단말기 외부 라벨 IH 일치 확인,",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "운전자단말기",
    "item": "LCD 확인",
    "method": "부팅 및 통신상태 확인",
    "point": "통신상태 확인 및 시간확인, 서큘러 체결상태 확인 러버패드 부착상태 확인, 블랙 커버 조립상태 확인 ,",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "item": [
      4,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "승차단말기",
    "item": "",
    "method": "부팅 및 통신상태 확인",
    "point": "통신상태 확인 및 시간확인, 커넥터 체결상태 확인 백 커버 조립상태 확인, 후면 고무러버 확인",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "하차단말기1",
    "item": "",
    "method": "부팅 및 통신상태 확인",
    "point": "통신상태 확인 및 시간확인, 서큘러 체결상태 확인 백 커버 조립상태 확인, 후면 고무러버 확인",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "하차단말기2",
    "item": "",
    "method": "부팅 및 통신상태 확인",
    "point": "통신상태 확인 및 시간확인, 서큘러 체결상태 확인 백 커버 조립상태 확인, 후면 고무러버 확인",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "브라켓 및 케이블 고정상태 확인",
    "item": "",
    "method": "브라켓 고정,케이블 고정 타이 마감",
    "point": "브라켓 고정상태,\r\n케이블의 케이블타이 작업 유무 확인",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      2
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "GPS 케이블, LTE, WI-FI 안테나",
    "item": "",
    "method": "고정상태 확인",
    "point": "컨넥터 잠김상태 확인 및 조임",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      2
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 3,
    "caseLabel": "운행\r\n대기중",
    "target": "운전자단말기",
    "item": "시간확인",
    "method": "운전자단말기 화면에서 왼쪽 \r\n상단에 현재일시 현시 확인",
    "point": "현재일시 제대로 현시",
    "kind": "time",
    "bigo": "시간/분 표기",
    "bigoKind": "static",
    "m": {
     "caseNo": [
      4,
      1
     ],
     "caseLabel": [
      4,
      1
     ],
     "target": [
      3,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 3,
    "caseLabel": "운행\r\n대기중",
    "target": "",
    "item": "차량정보설정",
    "method": "좌석수 표시",
    "point": "차량의 승객 좌석수 입력",
    "kind": "seat",
    "bigo": "좌석 수",
    "bigoKind": "static",
    "m": {
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 3,
    "caseLabel": "운행\r\n대기중",
    "target": "",
    "item": "운행시작",
    "method": "운전자단말기 화면에서 운행대기중 화면 현시 중에\r\n[운행]버튼 ▶ 운전자ID입력 \r\n▶ [확인]버튼",
    "point": "-.다음과 같은 동작을 확인하여 운행이 정상적으로 \r\n시작됨을 확인\r\n1. 운전자단말기에서 '운행을시작합니다' 음성 출력\r\n2. 운전자단말기 메인화면 우측 상단 확인 \r\n - BMS 감도확인\r\n - c-sys, t-sys 감도확인\r\n - LTE, GPS, WLAN 감도확인\r\n3. 운전자단말기 메인화면 [내차이미지]에 정류장 표시\r\n4. 단말기 시간이 정상적으로 표시되는지 확인",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "item": [
      1,
      1
     ],
     "method": [
      2,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 3,
    "caseLabel": "운행\r\n대기중",
    "target": "승.하차\r\n단말기",
    "item": "통신 및 정보 확인",
    "method": "",
    "point": "- 승, 하차단말기 LCD에 통신상태, 날짜, 차량번호 확인",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "item": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 4,
    "caseLabel": "운행중",
    "target": "운전자단말기",
    "item": "BMS",
    "method": "BMS 안테나 감도 확인",
    "point": "BMS 감도 상태확인\r\n- 화면 중앙상단 BMS 감도 상태 COLOR 기록 (녹색)",
    "kind": "check",
    "bigo": "감도 상태 COLOR 기록",
    "bigoKind": "static",
    "m": {
     "caseNo": [
      4,
      1
     ],
     "caseLabel": [
      4,
      1
     ],
     "target": [
      1,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 4,
    "caseLabel": "운행중",
    "target": "운전자단말기",
    "item": "c-sys, t-sys",
    "method": "c-sys, t-sys 감도 확인",
    "point": "c-sys, t-sys 감도 상태확인\r\n- 화면 중앙상단 c-sys, t-sys 감도 상태 COLOR 기록(녹색)",
    "kind": "check",
    "bigo": "감도 상태 COLOR 기록",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 4,
    "caseLabel": "운행중",
    "target": "운전자단말기",
    "item": "LTE, GPS, WLAN",
    "method": "LTE, GPS, WLAN 감도 확인",
    "point": "LTE, GPS, WLAN 감도 상태확인\r\n- 화면 중앙상단 LTE, GPS, WLAN 감도 BAR 기록",
    "kind": "check",
    "bigo": "감도 칸수 기록\r\n( )칸",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 4,
    "caseLabel": "운행중",
    "target": "승.하차\r\n단말기",
    "item": "카드 TAG",
    "method": "카드 인식여부 확인",
    "point": "승차, 하차1, 하차2 카드 TAG 인식 시험",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 5,
    "caseLabel": "운행종료",
    "target": "운전자단말기,\r\n승.하차단말기",
    "item": "운행종료",
    "method": "운전자단말기에서 [운행] ▶ [확인]",
    "point": "1.운전자단말기에서 '운행을 종료합니다' 음성 출력\r\n2.종료 처리 정상여부 확인",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "caseNo": [
      2,
      1
     ],
     "caseLabel": [
      2,
      1
     ],
     "target": [
      1,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 5,
    "caseLabel": "운행종료",
    "target": "운전자단말기,\r\n승.하차단말기",
    "item": "거래내역전송",
    "method": "[운행종료]후 미전송 거래내역 파일갯수 확인",
    "point": "미전송거래내역 파일:0",
    "kind": "check",
    "bigo": "\"미전송 발생시\r\n 센터장보고\"",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 6,
    "caseLabel": "특이사항",
    "target": "추가 자재사용 내역 및 특이사항",
    "item": "",
    "method": "운전자 봉 / 승하차 봉 etc.",
    "point": "내용기재",
    "kind": "etc",
    "bigo": "수량 :",
    "bigoKind": "etcQty",
    "m": {
     "caseNo": [
      2,
      1
     ],
     "caseLabel": [
      2,
      1
     ],
     "target": [
      1,
      2
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 6,
    "caseLabel": "특이사항",
    "target": "입력사항 재확인",
    "item": "",
    "method": "차량번호 , 운수사ID\r\n단말기IH 등 입력사항 재확인",
    "point": "단말기 설치 시 직접입력해야 하는 부분이 정확하게 일치하는가",
    "kind": "installer",
    "bigo": "(인)",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      2
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   }
  ]
 },
 "B620": {
  "title": "B620 단말기 체크 리스트",
  "rows": [
   {
    "caseNo": 1,
    "caseLabel": "차량특성",
    "target": "",
    "item": "",
    "method": "차량 특성 및 종류 확인",
    "point": "일반A , 저상B , 전기차C , 기타D",
    "kind": "vehicleType",
    "bigo": "제조사",
    "bigoKind": "manufacturer",
    "m": {
     "caseNo": [
      2,
      1
     ],
     "caseLabel": [
      2,
      3
     ],
     "method": [
      2,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 1,
    "caseLabel": "차량특성",
    "target": "",
    "item": "",
    "method": "",
    "point": "격벽설치 유무 기록 ( O / X 기록)",
    "kind": "partition",
    "bigo": "모델명",
    "bigoKind": "modelName",
    "m": {
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "운전자단말기,\r\n승하차단말기",
    "item": "수집센터, 운영관리 IP",
    "method": "단말기 센터시스템 정보 설정",
    "point": "단말기 내부 LCD 표출된 IP 확인",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "caseNo": [
      8,
      1
     ],
     "caseLabel": [
      8,
      1
     ],
     "target": [
      2,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "",
    "item": "IH일치 확인",
    "method": "단말기 라벨 확인",
    "point": "단말기 내부 LCD 표출된 IH와\r\n단말기 외부 라벨 IH 일치 확인,",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "운전자단말기",
    "item": "LCD 확인",
    "method": "부팅 및 통신상태 확인",
    "point": "통신상태 확인 및 시간확인, 서큘러 체결상태 확인 러버패드 부착상태 확인, 블랙 커버 조립상태 확인 ,",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "item": [
      2,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "승차단말기",
    "item": "",
    "method": "부팅 및 통신상태 확인",
    "point": "통신상태 확인 및 시간확인, 커넥터 체결상태 확인 백 커버 조립상태 확인, 후면 고무러버 확인",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "영수증기",
    "item": "출력확인",
    "method": "출력 및 통신상태 확인",
    "point": "테스트 내용 정상출력 확인, 조립 및 고정상태 확인",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "안내방송",
    "item": "음성확인",
    "method": "출력확인",
    "point": "안내방송 정상출력 확인, 엠프와 차량스피커 간 연결상태 확인",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "A형 브라켓,단말기브라켓 및\r\n 케이블 고정상태 확인",
    "item": "",
    "method": "브라켓 고정,케이블 고정 타이 마감",
    "point": "브라켓 고정상태,\r\n케이블의 케이블타이 작업 유무 확인",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      2
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "GPS 케이블, LTE, WI-FI 안테나",
    "item": "",
    "method": "고정상태 확인",
    "point": "컨넥터 잠김상태 확인 및 조임",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      2
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 3,
    "caseLabel": "운행\r\n대기중",
    "target": "운전자단말기",
    "item": "시간확인",
    "method": "운전자단말기 화면에서 왼쪽 \r\n상단에 현재일시 현시 확인",
    "point": "현재일시 제대로 현시",
    "kind": "time",
    "bigo": "시간/분 표기",
    "bigoKind": "static",
    "m": {
     "caseNo": [
      4,
      1
     ],
     "caseLabel": [
      4,
      1
     ],
     "target": [
      3,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 3,
    "caseLabel": "운행\r\n대기중",
    "target": "",
    "item": "차량정보설정",
    "method": "좌석수 표시",
    "point": "차량의 승객 좌석수 입력",
    "kind": "seat",
    "bigo": "좌석 수",
    "bigoKind": "static",
    "m": {
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 3,
    "caseLabel": "운행\r\n대기중",
    "target": "",
    "item": "운행시작",
    "method": "운전자단말기 화면에서 운행대기중 화면 현시 중에\r\n[운행]버튼 ▶ 운전자ID입력 \r\n▶ [확인]버튼",
    "point": "-.다음과 같은 동작을 확인하여 운행이 정상적으로 \r\n시작됨을 확인\r\n1. 운전자단말기에서 '운행을시작합니다' 음성 출력\r\n2. 운전자단말기 메인화면 우측 상단 확인 \r\n - BMS 감도확인\r\n - c-sys, t-sys 감도확인\r\n - LTE, GPS, WLAN 감도확인\r\n3. 운전자단말기 메인화면 [내차이미지]에 정류장 표시\r\n4. 단말기 시간이 정상적으로 표시되는지 확인",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "item": [
      1,
      1
     ],
     "method": [
      2,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 3,
    "caseLabel": "운행\r\n대기중",
    "target": "승.하차\r\n단말기",
    "item": "통신 및 정보 확인",
    "method": "",
    "point": "- 승, 하차단말기 LCD에 통신상태, 날짜, 차량번호 확인",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "item": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 4,
    "caseLabel": "운행중",
    "target": "운전자단말기",
    "item": "BMS",
    "method": "BMS 안테나 감도 확인",
    "point": "BMS 감도 상태확인\r\n- 화면 중앙상단 BMS 감도 상태 COLOR 기록 (녹색)",
    "kind": "check",
    "bigo": "감도 상태 COLOR 기록",
    "bigoKind": "static",
    "m": {
     "caseNo": [
      4,
      1
     ],
     "caseLabel": [
      4,
      1
     ],
     "target": [
      1,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 4,
    "caseLabel": "운행중",
    "target": "운전자단말기",
    "item": "c-sys, t-sys",
    "method": "c-sys, t-sys 감도 확인",
    "point": "c-sys, t-sys 감도 상태확인\r\n- 화면 중앙상단 c-sys, t-sys 감도 상태 COLOR 기록(녹색)",
    "kind": "check",
    "bigo": "감도 상태 COLOR 기록",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 4,
    "caseLabel": "운행중",
    "target": "운전자단말기",
    "item": "LTE, GPS, WLAN",
    "method": "LTE, GPS, WLAN 감도 확인",
    "point": "LTE, GPS, WLAN 감도 상태확인\r\n- 화면 중앙상단 LTE, GPS, WLAN 감도 BAR 기록",
    "kind": "check",
    "bigo": "감도 칸수 기록\r\n( )칸",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 4,
    "caseLabel": "운행중",
    "target": "승.하차\r\n단말기",
    "item": "카드 TAG",
    "method": "카드 인식여부 확인",
    "point": "승차, 하차1, 하차2 카드 TAG 인식 시험",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 5,
    "caseLabel": "운행종료",
    "target": "운전자단말기,\r\n승.하차단말기",
    "item": "운행종료",
    "method": "운전자단말기에서 [운행] ▶ [확인]",
    "point": "1.운전자단말기에서 '운행을 종료합니다' 음성 출력\r\n2.종료 처리 정상여부 확인",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "caseNo": [
      2,
      1
     ],
     "caseLabel": [
      2,
      1
     ],
     "target": [
      1,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 5,
    "caseLabel": "운행종료",
    "target": "운전자단말기,\r\n승.하차단말기",
    "item": "거래내역전송",
    "method": "[운행종료]후 미전송 거래내역 파일갯수 확인",
    "point": "미전송거래내역 파일:0",
    "kind": "check",
    "bigo": "\"미전송 발생시\r\n 센터장보고\"",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 6,
    "caseLabel": "특이사항",
    "target": "추가 자재사용 내역 및 특이사항",
    "item": "",
    "method": "운전자 봉 / 승하차 봉 etc.",
    "point": "내용기재",
    "kind": "etc",
    "bigo": "수량 :",
    "bigoKind": "etcQty",
    "m": {
     "caseNo": [
      2,
      1
     ],
     "caseLabel": [
      2,
      1
     ],
     "target": [
      1,
      2
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 6,
    "caseLabel": "특이사항",
    "target": "입력사항 재확인",
    "item": "",
    "method": "차량번호 , 운수사ID\r\n단말기IH 등 입력사항 재확인",
    "point": "단말기 설치 시 직접입력해야 하는 부분이 정확하게 일치하는가",
    "kind": "installer",
    "bigo": "(인)",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      2
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   }
  ]
 },
 "B700": {
  "title": "B700 단말기 체크 리스트",
  "rows": [
   {
    "caseNo": 1,
    "caseLabel": "차량특성",
    "target": "",
    "item": "",
    "method": "차량 특성 종류 확인",
    "point": "일반A , 저상B , 전기차C , 기타D",
    "kind": "vehicleType",
    "bigo": "제조사",
    "bigoKind": "manufacturer",
    "m": {
     "caseNo": [
      2,
      1
     ],
     "caseLabel": [
      2,
      3
     ],
     "method": [
      2,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 1,
    "caseLabel": "차량특성",
    "target": "",
    "item": "",
    "method": "",
    "point": "격벽설치 유무 기록 ( O / X 기록)",
    "kind": "partition",
    "bigo": "모델명",
    "bigoKind": "modelName",
    "m": {
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "표출단말기\r\n승하차단말기",
    "item": "IH일치 확인",
    "method": "단말기 라벨 확인",
    "point": "단말기 내부 LCD 표출된 IH와\r\n단말기 외부 라벨 IH 일치 확인,",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "caseNo": [
      9,
      1
     ],
     "caseLabel": [
      9,
      1
     ],
     "target": [
      1,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "표출단말기",
    "item": "LCD 확인",
    "method": "부팅 및 통신상태 확인",
    "point": "통신상태 확인 및 시간확인, 커넥터 연결상태 확인 \r\n러버패드 부착상태 확인, 블랙 커버 조립상태 확인 ,",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "item": [
      4,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "승차단말기",
    "item": "",
    "method": "부팅 및 통신상태 확인",
    "point": "통신상태 확인 및 시간확인, 커넥터 연결상태 확인\r\n백 커버 조립상태 확인, 상단,후면 고무러버 확인",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "하차단말기1",
    "item": "",
    "method": "부팅 및 통신상태 확인",
    "point": "통신상태 확인 및 시간확인, 커넥터 연결상태 확인\r\n백 커버 조립상태 확인, 상단,후면 고무러버 확인",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "하차단말기2",
    "item": "",
    "method": "부팅 및 통신상태 확인",
    "point": "통신상태 확인 및 시간확인, 커넥터 연결상태 확인\r\n백 커버 조립상태 확인, 상단,후면 고무러버 확인",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "LTE외장모뎀",
    "item": "램프확인",
    "method": "램프 등 및 통신확인",
    "point": "LTE외장모뎀 전원 및 통신상태 확인",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "브라켓 및 케이블 고정상태 확인",
    "item": "",
    "method": "브라켓 고정,케이블 고정 타이 마감",
    "point": "브라켓 고정상태,\r\n케이블의 케이블타이 작업 유무 확인",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      2
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "GPS , LTE , 타코메타",
    "item": "",
    "method": "케이블 연결상태 확인",
    "point": "커넥터 연결상태 확인 및 점검 (제 위치에 연결 되었는가)",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      2
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "DTG 확인",
    "item": "",
    "method": "DTG APP에서 확인",
    "point": "차량,DTG간 연결상태 확인 및 점검 (정상적으로 연결 되었는가)",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      2
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 3,
    "caseLabel": "운행\r\n대기중",
    "target": "표출단말기\r\n상태바 정보\r\n확인",
    "item": "CITS표출부 GPS Icon",
    "method": "",
    "point": "CITS표출부 상태바에 GPS Icon 활성화.\r\nAnt Bar가 3개이상",
    "icon": "/checklist/icon-gps.png",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "caseNo": [
      7,
      1
     ],
     "caseLabel": [
      11,
      1
     ],
     "target": [
      7,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 3,
    "caseLabel": "운행\r\n대기중",
    "target": "",
    "item": "CITS표출부\r\n단말운영 Icon",
    "method": "",
    "point": "CITS표출부 상태바에 T Icon 이\r\n흰색 실선으로 표출",
    "icon": "/checklist/icon-cits.png",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 3,
    "caseLabel": "운행\r\n대기중",
    "target": "",
    "item": "AFC표출부 LTE Icon",
    "method": "",
    "point": "AFC표출부 상태바에 LTE Ico 활성화.\r\nAnt Bar가 4개이상",
    "icon": "/checklist/icon-lte.png",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 3,
    "caseLabel": "운행\r\n대기중",
    "target": "",
    "item": "AFC표출부\r\n단말운영센터 Icon",
    "method": "",
    "point": "AFC표출부 상태바에 T Icon 이\r\n흰색 실선으로 표출",
    "icon": "/checklist/icon-t.png",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 3,
    "caseLabel": "운행\r\n대기중",
    "target": "",
    "item": "AFC표출부\r\n수집센터 Icon",
    "method": "",
    "point": "AFC표출부 상태바에 D Icon 이\r\n흰색 실선으로 표출",
    "icon": "/checklist/icon-d.png",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 3,
    "caseLabel": "운행\r\n대기중",
    "target": "",
    "item": "AFC표출부\r\nBMS센터 Icon",
    "method": "",
    "point": "AFC표출부 상태바에 B Icon 이\r\n흰색 실선으로 표출",
    "icon": "/checklist/icon-b.png",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 3,
    "caseLabel": "운행\r\n대기중",
    "target": "",
    "item": "승하차 통신\r\n연결 확인",
    "method": "",
    "point": "표출부에 승하차단말기 테두리 녹색으로 표기",
    "icon": "/checklist/icon-check.png",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 3,
    "caseLabel": "운행\r\n대기중",
    "target": "표출단말기",
    "item": "시간확인",
    "method": "표출단말기 화면에서 왼쪽 \r\n상단에 현재일시 현시 확인",
    "point": "현재일시 제대로 현시",
    "kind": "time",
    "bigo": "시간/분",
    "bigoKind": "static",
    "m": {
     "caseNo": [
      4,
      1
     ],
     "target": [
      4,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 3,
    "caseLabel": "운행\r\n대기중",
    "target": "",
    "item": "버전확인",
    "method": "FW버전 최신여부 확인\r\nOS버전 최신여부 확인",
    "point": "확인FW버전 [ ] / 확인OS버전 [ ]",
    "kind": "version",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "item": [
      2,
      1
     ],
     "method": [
      2,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 3,
    "caseLabel": "운행\r\n대기중",
    "target": "",
    "item": "",
    "method": "",
    "point": "표출기 화면_서울(승하차 : B800) 표시",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 3,
    "caseLabel": "운행\r\n대기중",
    "target": "",
    "item": "차량정보설정",
    "method": "차량의 승객 좌석수 입력",
    "point": "",
    "kind": "seat",
    "bigo": "좌석수",
    "bigoKind": "seat",
    "m": {
     "item": [
      1,
      1
     ],
     "method": [
      1,
      2
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 4,
    "caseLabel": "운행 시작",
    "target": "표출단말기",
    "item": "BMS , GPS",
    "method": "앞뒤차 표시 , 정류장표시 확인",
    "point": "표출단말기에서 '운행을 시작합니다' 음성 출력",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "caseNo": [
      4,
      1
     ],
     "caseLabel": [
      4,
      1
     ],
     "target": [
      1,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 4,
    "caseLabel": "운행 시작",
    "target": "승차단말기",
    "item": "통신확인 및\r\n카드 TAG",
    "method": "볼룸 확인 , 카드 인식여부 확인",
    "point": "승차 카드TAG인식 테스트 \r\n'잔액이 부족합니다' 음성 출력",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 4,
    "caseLabel": "운행 시작",
    "target": "하차1단말기",
    "item": "통신확인 및\r\n카드 TAG",
    "method": "볼룸 확인 , 카드 인식여부 확인",
    "point": "하차1 카드TAG인식 테스트 \r\n'잔액이 부족합니다' 음성 출력",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 4,
    "caseLabel": "운행 시작",
    "target": "하차2단말기",
    "item": "통신확인 및\r\n카드 TAG",
    "method": "볼륨 확인 , 카드 인식여부 확인",
    "point": "하차2 카드TAG인식 테스트 \r\n'잔액이 부족합니다' 음성 출력",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 5,
    "caseLabel": "운행 종료",
    "target": "표출단말기",
    "item": "운행종료",
    "method": "표출단말기에서 [운행] ▶ [확인]",
    "point": "1.표출단말기에서 '운행을 종료합니다' 음성 출력\r\n2.종료 처리 정상여부 확인",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "caseNo": [
      2,
      1
     ],
     "caseLabel": [
      2,
      1
     ],
     "target": [
      2,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 5,
    "caseLabel": "운행 종료",
    "target": "",
    "item": "거래내역전송",
    "method": "[운행종료]후 미전송 거래내역 파일갯수 확인",
    "point": "미전송거래내역 파일:0",
    "kind": "check",
    "bigo": "\"미전송 발생시\r\n 센터장보고\"",
    "bigoKind": "static",
    "m": {
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 6,
    "caseLabel": "특이사항",
    "target": "추가 자재사용 내역 및 특이사항",
    "item": "",
    "method": "운전자 봉 / 승하차 봉 etc.",
    "point": "내용기재",
    "kind": "etc",
    "bigo": "수량",
    "bigoKind": "etcQty",
    "m": {
     "caseNo": [
      2,
      1
     ],
     "caseLabel": [
      2,
      1
     ],
     "target": [
      1,
      2
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 6,
    "caseLabel": "특이사항",
    "target": "입력사항 재확인",
    "item": "",
    "method": "차량번호 , 운수사ID , 단말기IH ,\r\n 차대번호 등 입력사항 재확인",
    "point": "단말기 설치 시 직접입력해야 하는 부분이 정확하게 일치하는가",
    "kind": "installer",
    "bigo": "(인)",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      2
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   }
  ]
 },
 "B710": {
  "title": "B710 단말기 체크 리스트",
  "rows": [
   {
    "caseNo": 1,
    "caseLabel": "차량특성",
    "target": "",
    "item": "",
    "method": "차량 특성 종류 확인",
    "point": "일반A , 저상B , 전기차C , 기타D",
    "kind": "vehicleType",
    "bigo": "제조사",
    "bigoKind": "manufacturer",
    "m": {
     "caseNo": [
      2,
      1
     ],
     "caseLabel": [
      2,
      3
     ],
     "method": [
      2,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 1,
    "caseLabel": "차량특성",
    "target": "",
    "item": "",
    "method": "",
    "point": "격벽설치 유무 기록 ( O / X 기록)",
    "kind": "partition",
    "bigo": "모델명",
    "bigoKind": "modelName",
    "m": {
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "표출단말기\r\n승하차단말기",
    "item": "IH일치 확인",
    "method": "단말기 라벨 확인",
    "point": "단말기 내부 LCD 표출된 IH와\r\n단말기 외부 라벨 IH 일치 확인,",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "caseNo": [
      9,
      1
     ],
     "caseLabel": [
      9,
      1
     ],
     "target": [
      1,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "표출단말기",
    "item": "LCD 확인",
    "method": "부팅 및 통신상태 확인",
    "point": "통신상태 확인 및 시간확인, 커넥터 연결상태 확인\r\n러버패드 부착상태 확인, 블랙 커버 조립상태 확인 ,",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "item": [
      4,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "승차단말기",
    "item": "",
    "method": "부팅 및 통신상태 확인",
    "point": "통신상태 확인 및 시간확인, 커넥터 연결상태 확인\r\n백 커버 조립상태 확인, 상단,후면 고무러버 확인",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "하차단말기1",
    "item": "",
    "method": "부팅 및 통신상태 확인",
    "point": "통신상태 확인 및 시간확인, 커넥터 연결상태 확인\r\n백 커버 조립상태 확인, 상단,후면 고무러버 확인",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "하차단말기2",
    "item": "",
    "method": "부팅 및 통신상태 확인",
    "point": "통신상태 확인 및 시간확인, 커넥터 연결상태 확인\r\n백 커버 조립상태 확인, 상단,후면 고무러버 확인",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "LTE외장모뎀",
    "item": "램프확인",
    "method": "램프 등 및 통신확인",
    "point": "LTE외장모뎀 전원 및 통신상태 확인",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "브라켓 및 케이블 고정상태 확인",
    "item": "",
    "method": "브라켓 고정,케이블 고정 타이 마감",
    "point": "브라켓 고정상태,\r\n케이블의 케이블타이 작업 유무 확인",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      2
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "GPS , LTE , 타코메타",
    "item": "",
    "method": "케이블 연결상태 확인",
    "point": "커넥터 연결상태 확인 및 점검 (제 위치에 연결 되었는가)",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      2
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "DTG 확인",
    "item": "",
    "method": "DTG APP에서 확인",
    "point": "차량,DTG간 연결상태 확인 및 점검 (정상적으로 연결 되었는가)",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      2
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 3,
    "caseLabel": "운행\r\n대기중",
    "target": "표출단말기\r\n상태바 정보\r\n확인",
    "item": "GPS Icon",
    "method": "",
    "point": "표출부 상태바에 GPS Icon 활성화.\r\nAnt Bar가 3개이상",
    "icon": "/checklist/icon-gps.png",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "caseNo": [
      6,
      1
     ],
     "caseLabel": [
      9,
      1
     ],
     "target": [
      6,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 3,
    "caseLabel": "운행\r\n대기중",
    "target": "",
    "item": "단말운영 Icon",
    "method": "",
    "point": "표출부 상태바에 T Icon 이\r\n흰색 실선으로 표출",
    "icon": "/checklist/icon-cits.png",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 3,
    "caseLabel": "운행\r\n대기중",
    "target": "",
    "item": "LTE Icon",
    "method": "",
    "point": "표출부 상태바에 LTE Ico 활성화.\r\nAnt Bar가 4개이상",
    "icon": "/checklist/icon-lte.png",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 3,
    "caseLabel": "운행\r\n대기중",
    "target": "",
    "item": "수집센터 Icon",
    "method": "",
    "point": "표출부 상태바에 D Icon 이\r\n흰색 실선으로 표출",
    "icon": "/checklist/icon-d.png",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 3,
    "caseLabel": "운행\r\n대기중",
    "target": "",
    "item": "BMS Icon",
    "method": "",
    "point": "표출부 상태바에 B Icon 이\r\n흰색 실선으로 표출",
    "icon": "/checklist/icon-b.png",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 3,
    "caseLabel": "운행\r\n대기중",
    "target": "",
    "item": "승하차 통신\r\n연결 확인",
    "method": "",
    "point": "표출부 승하차단말기 Icon 이\r\n녹색으로 표출",
    "icon": "/checklist/icon-check.png",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 3,
    "caseLabel": "운행\r\n대기중",
    "target": "표출단말기",
    "item": "시간확인",
    "method": "표출단말기 화면에서 왼쪽 \r\n상단에 현재일시 현시 확인",
    "point": "현재일시 제대로 현시",
    "kind": "time",
    "bigo": "시간/분",
    "bigoKind": "static",
    "m": {
     "caseNo": [
      3,
      1
     ],
     "target": [
      3,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 3,
    "caseLabel": "운행\r\n대기중",
    "target": "",
    "item": "버전확인",
    "method": "FW버전 최신여부 확인\r\nOS버전 최신여부 확인",
    "point": "확인FW버전 [ ] / 확인OS버전 [ ]",
    "kind": "version",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 3,
    "caseLabel": "운행\r\n대기중",
    "target": "",
    "item": "차량정보설정",
    "method": "차량의 승객 좌석수 입력",
    "point": "",
    "kind": "seat",
    "bigo": "좌석수",
    "bigoKind": "seat",
    "m": {
     "item": [
      1,
      1
     ],
     "method": [
      1,
      2
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 4,
    "caseLabel": "운행 시작",
    "target": "표출단말기",
    "item": "BMS , GPS",
    "method": "앞뒤차 표시 , 정류장표시 확인",
    "point": "표출단말기에서 '운행을 시작합니다' 음성 출력",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "caseNo": [
      4,
      1
     ],
     "caseLabel": [
      4,
      1
     ],
     "target": [
      1,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 4,
    "caseLabel": "운행 시작",
    "target": "승차단말기",
    "item": "통신확인 및\r\n카드 TAG",
    "method": "볼룸 확인 , 카드 인식여부 확인",
    "point": "승차 카드TAG인식 테스트 \r\n'잔액이 부족합니다' 음성 출력",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 4,
    "caseLabel": "운행 시작",
    "target": "하차1단말기",
    "item": "통신확인 및\r\n카드 TAG",
    "method": "볼룸 확인 , 카드 인식여부 확인",
    "point": "하차1 카드TAG인식 테스트 \r\n'잔액이 부족합니다' 음성 출력",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 4,
    "caseLabel": "운행 시작",
    "target": "하차2단말기",
    "item": "통신확인 및\r\n카드 TAG",
    "method": "볼륨 확인 , 카드 인식여부 확인",
    "point": "하차2 카드TAG인식 테스트 \r\n'잔액이 부족합니다' 음성 출력",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 5,
    "caseLabel": "운행 종료",
    "target": "표출단말기",
    "item": "운행종료",
    "method": "표출단말기에서 [운행] ▶ [확인]",
    "point": "1.표출단말기에서 '운행을 종료합니다' 음성 출력\r\n2.종료 처리 정상여부 확인",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "caseNo": [
      2,
      1
     ],
     "caseLabel": [
      2,
      1
     ],
     "target": [
      2,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 5,
    "caseLabel": "운행 종료",
    "target": "",
    "item": "거래내역전송",
    "method": "[운행종료]후 미전송 거래내역 파일갯수 확인",
    "point": "미전송거래내역 파일:0",
    "kind": "check",
    "bigo": "\"미전송 발생시\r\n 센터장보고\"",
    "bigoKind": "static",
    "m": {
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 6,
    "caseLabel": "특이사항",
    "target": "추가 자재사용 내역 및 특이사항",
    "item": "",
    "method": "운전자 봉 / 승하차 봉 etc.",
    "point": "내용기재",
    "kind": "etc",
    "bigo": "수량",
    "bigoKind": "etcQty",
    "m": {
     "caseNo": [
      2,
      1
     ],
     "caseLabel": [
      2,
      1
     ],
     "target": [
      1,
      2
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 6,
    "caseLabel": "특이사항",
    "target": "입력사항 재확인",
    "item": "",
    "method": "차량번호 , 운수사ID , 단말기IH ,\r\n 차대번호 등 입력사항 재확인",
    "point": "단말기 설치 시 직접입력해야 하는 부분이 정확하게 일치하는가",
    "kind": "installer",
    "bigo": "(인)",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      2
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   }
  ]
 },
 "B800": {
  "title": "B800 단말기 체크 리스트",
  "rows": [
   {
    "caseNo": 1,
    "caseLabel": "차량특성",
    "target": "",
    "item": "",
    "method": "차량 특성 종류 확인",
    "point": "일반A , 저상B , 전기차C , 기타D",
    "kind": "vehicleType",
    "bigo": "제조사",
    "bigoKind": "manufacturer",
    "m": {
     "caseNo": [
      2,
      1
     ],
     "caseLabel": [
      2,
      3
     ],
     "method": [
      2,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 1,
    "caseLabel": "차량특성",
    "target": "",
    "item": "",
    "method": "",
    "point": "격벽설치 유무 기록 ( O / X 기록)",
    "kind": "partition",
    "bigo": "모델명",
    "bigoKind": "modelName",
    "m": {
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "표출단말기\r\n승하차단말기",
    "item": "IH일치 확인",
    "method": "단말기 라벨 확인",
    "point": "단말기 내부 LCD 표출된 IH와\r\n단말기 외부 라벨 IH 일치 확인,",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "caseNo": [
      9,
      1
     ],
     "caseLabel": [
      9,
      1
     ],
     "target": [
      1,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "표출단말기",
    "item": "LCD 확인",
    "method": "부팅 및 통신상태 확인",
    "point": "통신상태 확인 및 시간확인, 커넥터 연결상태 확인 러버패드 부착상태 확인, 블랙 커버 조립상태 확인 ,",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "item": [
      4,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "승차단말기",
    "item": "",
    "method": "부팅 및 통신상태 확인",
    "point": "통신상태 확인 및 시간확인, 커넥터 연결상태 확인\r\n백 커버 조립상태 확인, 상단,후면 고무러버 확인",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "하차단말기1",
    "item": "",
    "method": "부팅 및 통신상태 확인",
    "point": "통신상태 확인 및 시간확인, 커넥터 연결상태 확인\r\n백 커버 조립상태 확인, 상단,후면 고무러버 확인",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "하차단말기2",
    "item": "",
    "method": "부팅 및 통신상태 확인",
    "point": "통신상태 확인 및 시간확인, 커넥터 연결상태 확인\r\n백 커버 조립상태 확인, 상단,후면 고무러버 확인",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "LTE외장모뎀",
    "item": "램프확인",
    "method": "램프 등 및 통신확인",
    "point": "LTE외장모뎀 전원 및 통신상태 확인",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "브라켓 및 케이블 고정상태 확인",
    "item": "",
    "method": "브라켓 고정,케이블 고정 타이 마감",
    "point": "브라켓 고정상태,\r\n케이블의 케이블타이 작업 유무 확인",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      2
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "GPS , LTE , 타코메타",
    "item": "",
    "method": "케이블 연결상태 확인",
    "point": "커넥터 연결상태 확인 및 점검 (제 위치에 연결 되었는가)",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      2
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 2,
    "caseLabel": "H/W",
    "target": "DTG 확인",
    "item": "",
    "method": "DTG APP에서 확인",
    "point": "차량,DTG간 연결상태 확인 및 점검 (정상적으로 연결 되었는가)",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      2
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 3,
    "caseLabel": "운행\r\n대기중",
    "target": "표출단말기\r\n상태바 정보\r\n확인",
    "item": "GPS Icon",
    "method": "",
    "point": "표출부 상태바에 GPS Icon 활성화.\r\nAnt Bar가 3개이상",
    "icon": "/checklist/icon-gps.png",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "caseNo": [
      6,
      1
     ],
     "caseLabel": [
      9,
      1
     ],
     "target": [
      6,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 3,
    "caseLabel": "운행\r\n대기중",
    "target": "",
    "item": "단말운영 Icon",
    "method": "",
    "point": "표출부 상태바에 T Icon 이\r\n흰색 실선으로 표출",
    "icon": "/checklist/icon-cits.png",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 3,
    "caseLabel": "운행\r\n대기중",
    "target": "",
    "item": "LTE Icon",
    "method": "",
    "point": "표출부 상태바에 LTE Ico 활성화.\r\nAnt Bar가 4개이상",
    "icon": "/checklist/icon-lte.png",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 3,
    "caseLabel": "운행\r\n대기중",
    "target": "",
    "item": "수집센터 Icon",
    "method": "",
    "point": "표출부 상태바에 D Icon 이\r\n흰색 실선으로 표출",
    "icon": "/checklist/icon-d.png",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 3,
    "caseLabel": "운행\r\n대기중",
    "target": "",
    "item": "BMS Icon",
    "method": "",
    "point": "표출부 상태바에 B Icon 이\r\n흰색 실선으로 표출",
    "icon": "/checklist/icon-b.png",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 3,
    "caseLabel": "운행\r\n대기중",
    "target": "",
    "item": "승하차 통신\r\n연결 확인",
    "method": "",
    "point": "표출부 승하차단말기 Icon 이\r\n녹색으로 표출",
    "icon": "/checklist/icon-check.png",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 3,
    "caseLabel": "운행\r\n대기중",
    "target": "표출단말기",
    "item": "시간확인",
    "method": "표출단말기 화면에서 왼쪽 \r\n상단에 현재일시 현시 확인",
    "point": "현재일시 제대로 현시",
    "kind": "time",
    "bigo": "시간/분",
    "bigoKind": "static",
    "m": {
     "caseNo": [
      3,
      1
     ],
     "target": [
      3,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 3,
    "caseLabel": "운행\r\n대기중",
    "target": "",
    "item": "버전확인",
    "method": "FW버전 최신여부 확인\r\nOS버전 최신여부 확인",
    "point": "확인FW버전 [ ] / 확인OS버전 [ ]",
    "kind": "version",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 3,
    "caseLabel": "운행\r\n대기중",
    "target": "",
    "item": "차량정보설정",
    "method": "차량의 승객 좌석수 입력",
    "point": "",
    "kind": "seat",
    "bigo": "좌석수",
    "bigoKind": "seat",
    "m": {
     "item": [
      1,
      1
     ],
     "method": [
      1,
      2
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 4,
    "caseLabel": "운행 시작",
    "target": "표출단말기",
    "item": "BMS , GPS",
    "method": "앞뒤차 표시 , 정류장표시 확인",
    "point": "표출단말기에서 '운행을 시작합니다' 음성 출력",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "caseNo": [
      4,
      1
     ],
     "caseLabel": [
      4,
      1
     ],
     "target": [
      1,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 4,
    "caseLabel": "운행 시작",
    "target": "승차단말기",
    "item": "통신확인 및\r\n카드 TAG",
    "method": "볼룸 확인 , 카드 인식여부 확인",
    "point": "승차 카드TAG인식 테스트 \r\n'잔액이 부족합니다' 음성 출력",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 4,
    "caseLabel": "운행 시작",
    "target": "하차1단말기",
    "item": "통신확인 및\r\n카드 TAG",
    "method": "볼룸 확인 , 카드 인식여부 확인",
    "point": "하차1 카드TAG인식 테스트 \r\n'잔액이 부족합니다' 음성 출력",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 4,
    "caseLabel": "운행 시작",
    "target": "하차2단말기",
    "item": "통신확인 및\r\n카드 TAG",
    "method": "볼륨 확인 , 카드 인식여부 확인",
    "point": "하차2 카드TAG인식 테스트 \r\n'잔액이 부족합니다' 음성 출력",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 5,
    "caseLabel": "운행 종료",
    "target": "표출단말기",
    "item": "운행종료",
    "method": "표출단말기에서 [운행] ▶ [확인]",
    "point": "1.표출단말기에서 '운행을 종료합니다' 음성 출력\r\n2.종료 처리 정상여부 확인",
    "kind": "check",
    "bigo": "",
    "bigoKind": "static",
    "m": {
     "caseNo": [
      2,
      1
     ],
     "caseLabel": [
      2,
      1
     ],
     "target": [
      2,
      1
     ],
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 5,
    "caseLabel": "운행 종료",
    "target": "",
    "item": "거래내역전송",
    "method": "[운행종료]후 미전송 거래내역 파일갯수 확인",
    "point": "미전송거래내역 파일:0",
    "kind": "check",
    "bigo": "\"미전송 발생시\r\n 센터장보고\"",
    "bigoKind": "static",
    "m": {
     "item": [
      1,
      1
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 6,
    "caseLabel": "특이사항",
    "target": "추가 자재사용 내역 및 특이사항",
    "item": "",
    "method": "운전자 봉 / 승하차 봉 etc.",
    "point": "내용기재",
    "kind": "etc",
    "bigo": "수량",
    "bigoKind": "etcQty",
    "m": {
     "caseNo": [
      2,
      1
     ],
     "caseLabel": [
      2,
      1
     ],
     "target": [
      1,
      2
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   },
   {
    "caseNo": 6,
    "caseLabel": "특이사항",
    "target": "입력사항 재확인",
    "item": "",
    "method": "차량번호 , 운수사ID , 단말기IH ,\r\n 차대번호 등 입력사항 재확인",
    "point": "단말기 설치 시 직접입력해야 하는 부분이 정확하게 일치하는가",
    "kind": "installer",
    "bigo": "(인)",
    "bigoKind": "static",
    "m": {
     "target": [
      1,
      2
     ],
     "method": [
      1,
      1
     ],
     "point": [
      1,
      1
     ],
     "ox": [
      1,
      1
     ],
     "bigo": [
      1,
      1
     ]
    }
   }
  ]
 }
};
