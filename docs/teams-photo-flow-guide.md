# Teams 자동 업로드 — Power Automate 플로우 설정 (수도권 설치완료) · V2 상세판

수도권 설치완료 체크리스트를 저장하면 앱이 릴레이 메일함(`RELAY_MAIL_TO`)으로 **두 통**의 메일을 보냅니다.
Power Automate **"새 메일이 도착하면(V2)"** 트리거로 받아 Teams(=SharePoint 문서함)에 반영합니다.

> **V2 기준** 출력 참조: `triggerBody()?['Subject']`, `triggerBody()?['BodyPreview']`,
> `triggerBody()?['Attachments']`(각 항목 `Name`/`ContentBytes`/`IsInline`). (V3는 `triggerOutputs()?['body/...']`)

## 메일 3종 전체 맵 (제목 prefix가 서로 겹치지 않음)

| 문서 | 제목(Subject) | 본문 첫 줄 | 처리 흐름 |
|---|---|---|---|
| 자재 지급확인서 | `대폐차\|센터\|운수사\|지급일\|new\|이전파일` | `대폐차 자재 지급확인서…` | (기존) 센터 폴더 저장 |
| 체크리스트 | `대폐차\|센터\|운수사\|날짜\|new\|이전파일` | (수도권) `운수사_차량_대폐차_날짜 설치완료` | (기존) 센터 폴더 저장 + **흐름 B** 스레드 게시 |
| 증빙사진 | `증빙사진\|수도권\|센터\|운수사\|차량\|날짜` | 요약 | **흐름 A** 사진 폴더 저장 |

- **핵심:** 사진은 `증빙사진`으로 시작 → `대폐차`로 시작하는 자재/체크리스트와 안 겹칩니다.
  덕분에 기존 센터폴더 흐름이 제목필터 `대폐차`만 두면 사진 메일을 **자동으로 건너뜁니다.**
- 사진 메일은 사진이 **1장 이상일 때만** 발송됩니다.

---

## 0. 공통 준비

1. https://make.powerautomate.com 접속(회사 테넌트 확인).
2. 커넥터: **Office 365 Outlook**(릴레이 메일함), **SharePoint**, **Microsoft Teams**.
3. 대상 채널의 SharePoint 주소 확보: Teams 채널 → **Files** 탭 → **···** → **Open in SharePoint** → 주소 메모.
   - 예: `https://atecmobility.sharepoint.com/sites/대폐차`, 라이브러리 = **Documents(문서)**.

---

## 1. 기존 "센터 폴더 저장" 흐름 — 제목 필터만 확인 (수도권 폴더 중복 방지)

이미 잘못 만들어진 **최상위 `수도권` 폴더**는, 예전 흐름이 사진 메일까지 잡아 생긴 것입니다.
제목 prefix를 `증빙사진`으로 바꿨으니, **기존 흐름 트리거의 Subject Filter 만 `대폐차`로** 맞추면 해결됩니다.

1. **My flows** → 예전 자재/체크리스트 업로드 흐름 → **Edit**
2. 트리거 **When a new email arrives (V2)** 클릭 → **Show advanced options**
3. **Subject Filter** = `대폐차` (이미 그렇다면 그대로 두기)
4. **Save**
5. 이미 잘못 생긴 **최상위 `수도권` 폴더는 수동 삭제**

> Subject Filter는 "포함" 매칭이라 `증빙사진|…`은 `대폐차`를 포함하지 않아 더 이상 잡히지 않습니다.

---

## 흐름 A — 증빙사진 → 폴더 (신규)

**목표:** `Documents/사진/수도권/{센터}/{운수사}/{차량번호}/{항목명}.jpg`
(SharePoint Create file은 경로상 없는 폴더를 자동 생성)

### A-1. 새 흐름
- **+ Create → Automated cloud flow** → 이름 `대폐차 증빙사진 업로드`
- 트리거 **Office 365 Outlook · When a new email arrives (V2)**

### A-2. 트리거
- **Folder**: Inbox
- **Show advanced options**: **Include Attachments = Yes**, **Only with Attachments = Yes**, **Subject Filter = `증빙사진`**

### A-3. Condition
- **+ New step → Control → Condition**
- 왼쪽(fx): `startsWith(triggerBody()?['Subject'], '증빙사진')` · **is equal to** · 오른쪽 `true`
- 이후 동작은 **True** 칸 안에.

### A-4. Compose `Subject_Parts` (True 안)
- **Data Operation → Compose** → 이름 `Subject_Parts`
- Inputs(fx): `split(triggerBody()?['Subject'], '|')`

  | 인덱스 | 값 | 예 |
  |---|---|---|
  | `[1]` | 수도권(고정) | 수도권 |
  | `[2]` | 센터 | 강남 |
  | `[3]` | 운수사 | 대도운수 |
  | `[4]` | 차량번호 | 70-1234 |
  | `[5]` | 날짜 | 2026-06-24 |

### A-5. Apply to each → Create file (True 안)
- **Control → Apply to each** → 입력(fx): `triggerBody()?['Attachments']`
- 내부 **SharePoint → Create file**:
  - **Site Address**: 0번 사이트
  - **Folder Path**(fx):
    ```
    concat('/사진/수도권/', outputs('Subject_Parts')?[2], '/', outputs('Subject_Parts')?[3], '/', outputs('Subject_Parts')?[4])
    ```
  - **File Name**(fx): `items('Apply_to_each')?['Name']`
  - **File Content**(fx): `items('Apply_to_each')?['ContentBytes']`

### A-6. Save → Test

---

## 흐름 B — 체크리스트 캡쳐 + 차량번호 텍스트 스레드 게시 (신규)

**자재 문서도 `대폐차`로 시작**하므로, 흐름 B는 **체크리스트만** 골라야 합니다.
→ 본문 첫 줄 캡션에 `설치완료`가 들어가는 점을 이용해 조건으로 거릅니다.

### B-1. 트리거
- **When a new email arrives (V2)** · Include Attachments = **Yes** · **Subject Filter = `대폐차`**

### B-2. Condition (자재 제외, 체크리스트만)
- 왼쪽(fx): `contains(triggerBody()?['BodyPreview'], '설치완료')` · **is equal to** · 오른쪽 `true`
- 이후 동작은 **True** 안에.

### B-3. Compose `Caption` (True 안)
- Inputs(fx):
  ```
  trim(replace(first(split(triggerBody()?['BodyPreview'], decodeUriComponent('%0A'))), decodeUriComponent('%0D'), ''))
  ```
  결과: `대도운수_70-1234_대폐차_2026-06-24 설치완료`

### B-4. 게시 (권장: 캡쳐 저장 + 텍스트 메시지)
1. **SharePoint → Create file**:
   - Folder Path(fx) 예: `concat('/설치완료캡쳐/', split(triggerBody()?['Subject'],'|')?[1])`
   - File Name(fx): `concat(outputs('Caption'), '.jpg')`
   - File Content(fx): `first(triggerBody()?['Attachments'])?['ContentBytes']`
2. **Microsoft Teams → Post message in a chat or channel**:
   - Post as = Flow bot / Post in = Channel / Team·Channel 선택
   - Message = 동적콘텐츠 **Outputs(Caption)** + 줄바꿈 + **Link to item**(위 Create file)
- (선택) 인라인 이미지: **Post adaptive card** 의 Image url 에 저장된 파일 URL 사용.
  data URI 직접삽입은 카드 28KB 한도라 캡쳐엔 불가.

### B-5. Save

---

## 점검 체크리스트
- [ ] 기존 센터폴더 흐름 Subject Filter = `대폐차` → 사진메일 미수신, 최상위 `수도권` 폴더 안 생김
- [ ] 흐름 A: `사진/수도권/{센터}/{운수사}/{차량번호}/` 에 항목명 파일 생성("없음"/미촬영은 없음)
- [ ] 흐름 B: 체크리스트 저장 시에만 스레드에 `운수사_차량_대폐차_날짜 설치완료` + 캡쳐 게시 (자재 저장 시엔 게시 안 됨)
- [ ] SMTP env 미설정 시 앱 저장 정상, 릴레이만 비활성

## 자주 막히는 곳
- **V2 vs V3 참조**: V2 `triggerBody()?['Subject']`·`['Attachments']`·`['BodyPreview']`(PascalCase). 트리거 버전 바꾸면 모든 수식도 같이 바꿔야 함.
- **첨부 콘텐츠 필드(V2)**: `Name`, `ContentBytes`, `IsInline`. File Content엔 ContentBytes.
- **줄바꿈**: `\r\n` 대비해 `%0A`로 자르고 `%0D` 제거.
- **본문이 HTML로 옴**: `Body` 대신 `BodyPreview`(plain text) 사용.
- **Apply to each 이름**: 식의 `'Apply_to_each'`가 실제 루프 이름과 같아야 함(예: `Apply_to_each_2`면 그대로).

## 앱 측 구현 위치 (코드 변경 시 본 문서도 갱신)
- 제목/본문/첨부: `lib/daepyecha/teams.ts` (`sendRelayMail`, `sendPhotoRelayMail` — 사진 제목 prefix `증빙사진`)
- 사진 전송·캡션 주입: `app/api/checklist/route.ts` (POST, `variant === "default"`)
- 촬영 UI/슬롯/압축: `app/daepyecha/checklist/PhotoStep.tsx`, `lib/daepyecha/photo.ts`
