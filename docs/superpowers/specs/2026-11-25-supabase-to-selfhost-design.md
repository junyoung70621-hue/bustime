# Supabase → 회사 서버 자체 운영 전환 설계

작성일: 2026-11-25 · 상태: 초안(승인 대기)

## 1. 목적과 이유

이미 회사 도커 서버(`myapp`, 포트 8090, 외부 접속 가능)에서 앱은 돌고 있지만, DB와 파일은 여전히 Supabase(해외 클라우드)에 있다.
이것을 **전부 회사 서버 안으로** 옮긴다.

사용자가 말한 이유: **비용·보안·속도**.
- 비용: 무료 플랜 1GB를 넘으면 월 약 $25. PDF가 계속 쌓이므로 언젠가는 넘는다.
- 보안: 회사 문서(서명 포함 PDF, 차량 정보)를 외부 서비스에 두지 않는다.
- 속도: 앱↔DB 왕복이 해외 → 같은 서버(1ms 미만).

판단 기준(사용자가 정한 우선순위): **사용자(현장 기사·사무실)가 느끼는 품질**이 운영 편의보다 우선.

## 2. 목표 / 비목표 / 실패 조건

**목표**
- DB(테이블 5개)와 파일(PDF·사진·캡처)을 회사 서버 도커 안에서 운영.
- 기존 기록·PDF를 **하나도 빠짐없이** 옮긴다.
- 화면과 사용 방법은 지금과 **똑같이** 유지한다. 단, 접속 주소는 바뀐다(5-9, 옛 주소는 자동 이동).
- 앞차 아침 기록(07:00)·자정 정리(00:00)를 서버에서 계속 실행.
- 매일 자동 백업.

**비목표**
- 화면·기능 변경, 로그인 방식 변경.
- Vercel 병행 운영(전환 후 Vercel은 끈다 — 두 곳에서 따로 저장되면 데이터가 갈라짐).

**실패 조건 (동작은 해도 실패로 본다)**
- 옛 기록이나 PDF가 일부라도 사라짐.
- 현장에서 체크리스트/사진 저장이 실패함.
- 팀즈 폴더 자동 업로드(메일 릴레이)가 끊김.

## 3. 제약

- 서버: 리눅스 + Docker Compose v2, 외부에서 `http://서버주소:8090` 접속 가능. 현재 HTTPS 없음.
- 앱: Next.js 14 App Router, Node 22, 기존 Dockerfile/compose(`myapp`/`web`/`/app/data` 볼륨) 유지.
- 지금 Supabase 사용 범위
  - 테이블: `vehicles`, `routes`, `daepyecha_confirmations`, `checklist_confirmations`, `front_car_log` (스키마: `supabase/schema.sql`)
  - 파일 버킷: `daepyecha`(PDF), `checklist`(PDF + 증빙사진 임시본 `_photos/…`), `captures`(팀즈 인라인용 공개 JPG)
  - 코드: API 라우트 13개 + `lib/daepyecha/{capture,photo,photoRelay}.ts` + `lib/supabase*.ts` 3개
  - 스크립트: `scripts/*.mjs`(pg 직접 접속, `.env.local`에서 SUPABASE_DB_* 읽음, SSL 강제)
  - GitHub Actions 2개(앞차 시드 07:00, 정리 00:00)가 Supabase DB에 직접 접속
- 인증은 `middleware.ts` matcher(`/daepyecha*`, `/api/daepyecha`, `/api/checklist`)가 담당.

## 4. 검토한 방법

| | A. Postgres 컨테이너 | B. SQLite 파일 | C. Supabase 통째 설치 |
|---|---|---|---|
| 데이터 이전 | pg_dump 그대로 | 변환 스크립트 | 그대로 |
| 코드 수정 | 약 16파일 | 약 16파일 + 날짜/UUID 처리 | 거의 없음 |
| 스케줄 스크립트 | 주소만 변경 | 3개 재작성 | 그대로 |
| 컨테이너 | 2개 | 1개 | 10개 안팎, 메모리 2~4GB |
| 동시 저장 | 강함 | 보통 | 강함 |

**선택: A.** 사용자 체감(기록 누락 없음, 동시 저장 안정)이 가장 확실하고 작업량도 적다.
B는 운영 편의 이점이 관리자에게만 있고, C는 무거워서 속도·관리 목적과 맞지 않는다.

## 5. 설계

### 5-1. 인프라 (docker-compose)
- `db` 서비스 추가: `postgres:17-alpine`, 이름 있는 볼륨 `pgdata`, `restart: unless-stopped`, TZ `Asia/Seoul`.
  - **포트를 외부에 열지 않는다**(도커 내부망에서 `web`만 접속).
  - healthcheck(`pg_isready`) → `web`은 `depends_on: condition: service_healthy`.
  - 최초 기동 시 `db/init.sql`(= `schema.sql`에서 RLS/정책/Supabase 전용 구문 제거본)을 `/docker-entrypoint-initdb.d`로 실행.
- `.env`: `POSTGRES_PASSWORD` 추가, `DATABASE_URL=postgres://app:${POSTGRES_PASSWORD}@db:5432/app`.
  Supabase는 캡처용 `SUPABASE_URL`+`SUPABASE_SERVICE_ROLE_KEY`(서버 전용)만 남기고 anon 키 제거.
- 빌드 인자 `NEXT_PUBLIC_SUPABASE_*` 제거(브라우저가 Supabase에 직접 붙는 곳이 없어짐).

### 5-2. DB 접근 코드
- `lib/db.ts` 하나: `pg` Pool(지연 생성, `DATABASE_URL`) + 파라미터 쿼리 헬퍼. **모든 값은 `$1` 파라미터로만**(문자열 조합 금지).
- 13개 라우트와 lib 파일의 supabase-js 호출을 SQL로 교체. 쿼리 의미(필터·정렬·페이지·휴지통·검색)는 그대로.
  - 검색 `ilike` + `orIlike` 이스케이프 → `ILIKE $n` + `%`/`_` 이스케이프.
  - `data->>tagless` 등 jsonb 조건 그대로 SQL로.
- `lib/supabase.ts`·`lib/supabaseBrowser.ts` 삭제, 타입(`VehicleRow` 등)은 `lib/db.ts` 쪽으로 이동. DB·PDF·사진 경로에서 Supabase 호출은 0이 되어야 함(캡처 제외, 5-5).
- `pg`를 devDependencies → dependencies로.

### 5-3. 파일 저장 (`/app/data/files`)
- `lib/storage.ts`: `put/get/remove(bucket, path)` — 실제 위치 `/app/data/files/<bucket>/<path>`.
  - 버킷·경로는 화이트리스트/정규식 검증, 정규화 후 루트 밖이면 거부(경로 조작 차단).
- **버킷 이름과 경로 규칙을 그대로 유지** → DB의 `pdf_path` 값 수정 불필요.
- PDF 업로드·다운로드·ZIP·삭제·휴지통 흐름은 저장 대상만 교체.

### 5-4. 증빙사진 업로드 (수도권·인천 체크리스트)
- 기존: 서명 URL 발급 → 브라우저가 Supabase로 직접 PUT(Vercel 4.5MB 제한 우회용).
- 변경: 브라우저가 **우리 서버 `/api/checklist/photos`로 multipart 업로드**(장당 1요청, 기존처럼 병렬) → `checklist/_photos/<batchId>/<n>.jpg`에 저장.
  - 응답·`PhotoRef` 형태 동일 → 저장/릴레이 쪽 로직(`normalizePhotoRefs`, 릴레이 후 삭제) 그대로.
  - 크기 상한(장당 예: 15MB)과 JPEG 형식 검사.
- `/api/checklist/photo-upload-urls`와 `lib/supabaseBrowser.ts` 삭제.

### 5-5. 팀즈 인라인 캡처 (공개 이미지) — **Supabase에 그대로 둔다**
- 이미 팀즈 글에 박힌 캡처 이미지는 Supabase 공개 URL을 가리킨다. 사용자 결정: **예전 글의 사진이 깨지면 안 됨.**
  → Supabase 프로젝트는 `captures` 버킷 용도로만 유지(무료 범위).
- 어차피 남기므로 **새 캡처도 지금처럼 Supabase `captures`에 업로드**(`lib/daepyecha/capture.ts` 동작 유지).
  - 이유: 회사 서버는 http라 팀즈가 http 이미지를 인라인으로 못 띄울 위험이 있음 → Supabase(https)면 위험 없음.
  - capture.ts는 supabase-js 대신 Storage REST(fetch) 호출로 바꿔도 되고 supabase-js를 이 용도로만 남겨도 됨(빌더 판단).
  - 필요한 env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`(서버 전용). `captures` 삭제 흐름(휴지통 영구삭제)도 Supabase 대상 유지.
- 무료 플랜 자동 일시정지 방지: 서버 crontab에서 하루 1회 Supabase API 호출(5-6에 포함).
- 캡처 업로드 실패는 지금처럼 저장을 막지 않는다(인라인 사진만 빠짐).

### 5-6. 스케줄 작업
- 스크립트들이 `DATABASE_URL`을 우선 사용하도록 수정(없으면 기존 SUPABASE_DB_* — 이전 작업에 필요). SSL은 원격일 때만.
- 런타임 이미지에 `scripts/` 포함.
- 서버 crontab:
  - 07:00 `docker compose exec -T web node scripts/seed-front-car.mjs`
  - 00:00 `docker compose exec -T web node scripts/purge-front-car.mjs`
  - 하루 1회 Supabase 깨우기 호출(5-5, 자동 일시정지 방지)
- GitHub Actions 두 워크플로는 전환 후 삭제(Supabase 대상).

### 5-7. 데이터 이전 (전환 당일 1회)
1. 사용자에게 공지 → 짧은 저장 중단 시간(예상 30분 이내, 데이터량 기준).
2. Supabase에서 `pg_dump --data-only`(public의 5개 테이블) → 로컬 `db`에 복원.
3. `scripts/migrate-storage.mjs`(일회용): Supabase `daepyecha`·`checklist` 버킷의 모든 파일을 `/app/data/files/<bucket>/`로 다운로드(`captures`는 Supabase 유지라 제외).
4. **검증**: 테이블별 행 수 비교, 모든 `pdf_path` 파일 존재 확인, 파일 수/총 용량 비교. 하나라도 어긋나면 전환 중단.
5. 새 버전 기동 → PDF 열기·신규 저장·사진·팀즈 릴레이 실제 1건씩 확인.
6. Vercel에는 새 주소로 보내는 리다이렉트만 배포(5-9).
7. 되돌리기는 **전환 당일 검증 실패 시에만**: 이전 버전 이미지로 되돌리고 Vercel 원복. 당일엔 Supabase 데이터를 건드리지 않는다.
8. 30일 뒤(문제 없으면) Supabase의 테이블 데이터와 `daepyecha`·`checklist` 버킷 비우기. **프로젝트와 `captures` 버킷은 계속 유지.**

### 5-8. 백업
- 서버 crontab 매일 03:00: `pg_dump`(압축) + `files` 폴더 tar → `~/myapp-backup/날짜/`, 14일 보관.
- 같은 디스크라 서버 고장에는 무력 → 주 1회 다른 곳(사내 NAS 등)으로 복사 권장.
- 복원 절차를 문서로 남긴다(README 또는 `docs/`).

### 5-9. http 운영 (사용자 결정)
- 회사 도메인·포트 개방이 불가하여 **`http://서버주소:8090` 그대로 운영**. Tailscale Funnel·DuckDNS 등 HTTPS 대안은 검토 후 사용자가 제외.
- 사용자가 받아들인 결과(전환 공지에 포함):
  - 주소가 바뀜(`https://bustime-beta.vercel.app` → `http://서버주소:8090`), 브라우저 "주의 요함" 표시, 홈 화면 앱 설치 불가.
  - 비밀번호·PDF가 암호화 없이 전송됨.
- http에서 깨지는 브라우저 기능 수정: 클라이언트의 `crypto.randomUUID()` 2곳(`ChecklistModal.tsx:161`, `IncheonChecklistModal.tsx:162`)
  → `crypto.getRandomValues` 기반 UUID 생성 함수로 교체. (전수 검색 결과 클라이언트의 secure-context 전용 API는 이 2곳뿐)
- `COOKIE_SECURE=false` 유지.
- 기존 Vercel 주소: 전환 후 Vercel에는 **새 주소로 이동시키는 리다이렉트만** 배포(북마크·설치된 앱 대응). 앱 기능은 Vercel에서 내림.
- 나중에 도메인이 생기면 Caddy 컨테이너 추가로 HTTPS 전환 가능(이번 범위 밖).

## 6. 빌더에게 맡기는 것
- 쿼리별 구체 SQL, 헬퍼 함수 모양.
- 사진 업로드 엔드포인트의 세부 응답 형식(기존 `PhotoRef` 호환만 지키면 됨).
- 이전 스크립트의 재시도·진행 표시.
- 백업 스크립트 세부(파일명, 압축 방식).

## 7. 사용자 결정 사항
- 도메인/HTTPS: 불가 → http 운영(5-9).
- 예전 팀즈 인라인 사진: 깨지면 안 됨 → captures는 Supabase 유지(5-5).
- 되돌리기: **전환 당일 검증 실패 시에만**. 전환 후 새 데이터의 역방향 이전은 하지 않음.
- Vercel 유지 + DB만 회사 서버안: DB 포트 인터넷 노출 등 보안 악화로 제외.

## 8. 미정
- 전환 일시(저장 중단 30분 이내).
- 백업을 서버 밖 어디로 복사할지(정해질 때까지 서버 내 14일 보관만).
