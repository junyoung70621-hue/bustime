# Supabase → 회사 서버 자체 운영 전환 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** DB(5개 테이블)와 PDF·증빙사진을 Supabase에서 회사 도커 서버(Postgres 컨테이너 + `/app/data/files`)로 옮기고, 팀즈 캡처만 Supabase에 남긴다.

**Architecture:** compose에 `db`(postgres:17-alpine)를 추가하고, 앱의 supabase-js DB/Storage 호출을 `lib/db.ts`(pg Pool + 파라미터 SQL)와 `lib/storage.ts`(로컬 파일)로 교체한다. 캡처(`captures` 버킷)는 `lib/supabaseAdmin.ts`로 Supabase에 계속 올린다. 스케줄·백업은 서버 crontab.

**Tech Stack:** Next.js 14 App Router, Node 22(컨테이너)/Node 24(로컬 테스트), `pg` 8, Docker Compose v2, `node --test`.

**Spec:** `docs/superpowers/specs/2026-11-25-supabase-to-selfhost-design.md`

## Global Constraints

- compose name/container `myapp`, 서비스 `web`, 포트 `${WEB_PORT:-8090}:3000`, `restart: unless-stopped`, TZ `Asia/Seoul` — 기존 유지.
- `db` 포트는 **외부에 publish 하지 않는다**.
- 모든 SQL 값은 `$n` 파라미터로만. 문자열 조합으로 값 삽입 금지(테이블/컬럼명 고정 문자열만 허용).
- 파일 루트: `process.env.FILES_ROOT ?? "/app/data/files"`, 버킷 디렉터리 `daepyecha`, `checklist`. 기존 `pdf_path` 값 형식 그대로.
- 캡처는 Supabase `captures` 버킷 유지. env는 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`(서버 전용). `NEXT_PUBLIC_SUPABASE_*`는 전부 제거.
- 응답 JSON 형태(`{ rows }`, `{ row }`, `{ id }`, `{ ok, ... }`, 에러 `{ error }`)와 상태코드는 기존과 동일 — 화면 코드는 수정하지 않는다(사진 업로드·UUID 2곳 제외).
- `date` 컬럼은 `"YYYY-MM-DD"` 문자열, `timestamptz`는 ISO 문자열(`toISOString()`)로 응답.
- http 운영: `COOKIE_SECURE=false`. 클라이언트 코드에서 `crypto.randomUUID()` 금지.
- 증빙사진: 장당 최대 15MB, JPEG(시작 바이트 `FF D8 FF`)만, 1회 최대 8장(idx 0~7).
- 테스트: `npm test` = `node --test tests/` (Node ≥ 23.6, 로컬 Node 24). DB 통합 테스트는 `TEST_DATABASE_URL` 없으면 skip.
- 커밋은 이 작업에서 만진 파일만 골라서(`git add <파일>`), `git add .` 금지.

## Review Focus

1. **jsonb 배열 저장** — `items`(배열)를 그대로 pg 파라미터로 넘기면 Postgres 배열 리터럴로 변환되어 저장 실패. 기대: 대폐차 저장 시 `items`가 그대로 왕복. → Task 2 `jsonb()` 테스트 + Task 5 수동 확인.
2. **잘못된 id 형식** — `/api/checklist/abc` 처럼 UUID가 아닌 id면 Postgres가 예외. 기대: 기존처럼 404(GET/PUT) 또는 400, 500 아님. → Task 2 `isUuid` 테스트, Task 5·6에서 라우트 첫 줄 검사.
3. **날짜가 Date 객체로 나옴** — `install_date`가 Date면 다운로드 파일명이 `Tue Nov 25 2026…`로 깨짐. 기대: `"2026-11-25"`. → Task 2 통합 테스트.
4. **검색어 특수문자** — `%`, `_`, `,`, `(`, `\` 포함 검색. 기대: 500 없이 문자 그대로 검색. → Task 2 `likeContains` 테스트.
5. **이전된 `pdf_path`가 저장소 키 규칙과 안 맞음** — 옛 데이터에 예상 밖 경로가 있으면 다운로드가 `invalid key`로 실패. 기대: 전환 전에 검증 스크립트가 목록으로 알려줌. → Task 9 `verify-migration.mjs`.

---

### Task 1: 인프라 — Postgres 컨테이너와 초기 스키마

**Files:**
- Create: `db/init.sql`
- Modify: `docker-compose.yml`, `Dockerfile`, `.env.example`, `.dockerignore`, `package.json`

**Interfaces:**
- Produces: 컨테이너 안 env `DATABASE_URL=postgres://app:<pw>@db:5432/app`, `FILES_ROOT=/app/data/files`; 이미지 안 `/app/scripts/`; 런타임 의존성 `pg`.

- [ ] **Step 1: `db/init.sql` 작성** — `supabase/schema.sql`을 복사하되 `enable row level security`, `create policy`, `drop policy`, `to anon, authenticated` 관련 줄을 모두 제거. `create extension if not exists pg_trgm;`, 모든 `alter table … add column if not exists`(teams_file, variant, sig 등)는 유지. 결과 테이블 컬럼은 Supabase와 동일해야 함.

- [ ] **Step 2: compose 수정**
  - `db`: `image: postgres:17-alpine`, `container_name: myapp-db`, `restart: unless-stopped`, env `POSTGRES_USER=app`, `POSTGRES_DB=app`, `POSTGRES_PASSWORD=${POSTGRES_PASSWORD:?POSTGRES_PASSWORD 필요}`, `TZ=Asia/Seoul`, volumes `pgdata:/var/lib/postgresql/data`, `./db/init.sql:/docker-entrypoint-initdb.d/init.sql:ro`, healthcheck `pg_isready -U app -d app` (interval 5s, retries 20). `ports` 없음.
  - `web`: build args 블록 삭제, `environment`에 `DATABASE_URL: postgres://app:${POSTGRES_PASSWORD}@db:5432/app`, `FILES_ROOT: /app/data/files` 추가, `depends_on: { db: { condition: service_healthy } }`.
  - `volumes:`에 `pgdata:` 추가.

- [ ] **Step 3: Dockerfile 수정** — `ARG NEXT_PUBLIC_SUPABASE_*` 2줄 삭제, 런타임 스테이지에 `COPY --from=build /app/scripts ./scripts` 추가.

- [ ] **Step 4: package.json** — `pg`를 devDependencies → dependencies, `"test": "node --test tests/"` 스크립트 추가, `@types/pg` devDependency 추가. `npm install` 후 lock 갱신.

- [ ] **Step 5: `.env.example`** — `POSTGRES_PASSWORD=` 추가(설명: 영문·숫자 24자 이상, 바꾸면 기존 볼륨과 안 맞음), `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` 삭제, `SUPABASE_URL=https://xxxx.supabase.co`(설명: 팀즈 캡처 이미지 전용) 추가, `SUPABASE_SERVICE_ROLE_KEY` 설명을 "캡처 전용"으로. `.dockerignore`에 `tests` 추가.

- [ ] **Step 6: 검증**
  Run: `cp .env.example .env.test && sed -i 's/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=testpw/' .env.test && docker compose --env-file .env.test config >/dev/null && echo OK; rm .env.test`
  Expected: `OK` (env_file `.env` 부재 시엔 임시로 `.env` 복사해 확인).
  Docker Desktop이 켜져 있으면 추가로: `docker run -d --name pgtest -e POSTGRES_USER=app -e POSTGRES_DB=app -e POSTGRES_PASSWORD=testpw -p 55432:5432 -v "$PWD/db/init.sql:/docker-entrypoint-initdb.d/init.sql:ro" postgres:17-alpine` → `docker exec pgtest psql -U app -d app -c '\dt'` 에 테이블 5개. (이 컨테이너는 Task 2 통합 테스트에 재사용, `TEST_DATABASE_URL=postgres://app:testpw@localhost:55432/app`)

- [ ] **Step 7: Commit** — `git add db/init.sql docker-compose.yml Dockerfile .env.example .dockerignore package.json package-lock.json && git commit -m "chore(docker): Postgres 컨테이너·초기 스키마 추가"`

---

### Task 2: `lib/db.ts` — pg 연결과 쿼리 헬퍼

**Files:**
- Create: `lib/db.ts`, `tests/db.test.mjs`

**Interfaces:**
- Produces:
  - `q<T = Record<string, any>>(text: string, params?: unknown[]): Promise<T[]>`
  - `q1<T = Record<string, any>>(text: string, params?: unknown[]): Promise<T | null>` — 첫 행 또는 null
  - `jsonb(v: unknown): string` — `JSON.stringify(v ?? null)`; jsonb 컬럼 파라미터는 반드시 이걸로 감싸고 SQL에서 `$n::jsonb`
  - `likeContains(s: string): string` — `\`→`\\`, `%`→`\%`, `_`→`\_` 이스케이프 후 `%…%`
  - `isUuid(s: string): boolean` — `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`
  - 타입 `VehicleRow`, `RouteRow`, `Station` (`lib/supabase.ts`에서 그대로 이동, 주석 포함)
- `lib/db.ts`는 `@/` import 금지(테스트가 Node로 직접 import).

- [ ] **Step 1: 실패하는 테스트 작성** (`tests/db.test.mjs`, `import { … } from "../lib/db.ts"`)
  - `likeContains("50%_a\\b") === "%50\\%\\_a\\\\b%"`
  - `isUuid("3f2b9c1e-0a4d-4e1f-9b2a-1234567890ab") === true`, `isUuid("abc") === false`, `isUuid("3f2b9c1e-0a4d-4e1f-9b2a-1234567890ab' or 1=1") === false`
  - `jsonb([{name:"a",qty:1}]) === '[{"name":"a","qty":1}]'`, `jsonb(undefined) === "null"`
  - 통합(`{ skip: !process.env.TEST_DATABASE_URL }`, 실행 전 `process.env.DATABASE_URL = TEST_DATABASE_URL`):
    - `daepyecha_confirmations`에 `items = $1::jsonb`(값 `jsonb([{name:"x"}])`), `issued_date='2026-11-25'`로 insert 후 `q1`로 읽으면 `row.items` deepEqual `[{name:"x"}]`, `row.issued_date === "2026-11-25"`, `typeof row.created_at === "string"` 이고 `row.created_at.endsWith("Z")`. 끝나면 delete.
    - `q("select 1 from vehicles where plate_no ilike $1", [likeContains("a,b(c)")])` 가 throw 없이 배열 반환.

- [ ] **Step 2: 실패 확인** — Run: `npm test` / Expected: `Cannot find module …/lib/db.ts`

- [ ] **Step 3: 구현** — `pg.Pool`을 첫 호출 때 `DATABASE_URL`로 생성(`max: 10`), 없으면 `throw new Error("DATABASE_URL 환경변수가 없습니다.")`. 모듈 로드 시 `pg.types.setTypeParser(1082, v => v)`, `setTypeParser(1184, v => new Date(v).toISOString())`, `setTypeParser(1114, 같은 처리)`.

- [ ] **Step 4: 통과 확인** — Run: `TEST_DATABASE_URL=postgres://app:testpw@localhost:55432/app npm test` / Expected: 모두 pass (Docker 없으면 단위 테스트 pass + 통합 skip, 이 경우 Task 10 서버 검증에서 확인)

- [ ] **Step 5: Commit** — `git add lib/db.ts tests/db.test.mjs && git commit -m "feat(db): pg 연결·쿼리 헬퍼 추가"`

---

### Task 3: `lib/storage.ts` — 로컬 파일 저장소

**Files:**
- Create: `lib/storage.ts`, `tests/storage.test.mjs`

**Interfaces:**
- Produces:
  - `type Bucket = "daepyecha" | "checklist"`
  - `putFile(bucket: Bucket, key: string, bytes: Uint8Array, opts?: { overwrite?: boolean }): Promise<void>` — 기본 overwrite=false(이미 있으면 throw, 기존 `upsert:false`와 동일). 하위 폴더 자동 생성.
  - `getFile(bucket: Bucket, key: string): Promise<Uint8Array | null>` — 없으면 null
  - `removeFiles(bucket: Bucket, keys: string[]): Promise<void>` — 없는 파일 무시
  - `isValidKey(key: string): boolean` — `^[A-Za-z0-9_-]+(\/[A-Za-z0-9_-][A-Za-z0-9_.-]*)*$` 이고 `..` 세그먼트 없음
  - 루트는 호출 시점의 `process.env.FILES_ROOT ?? "/app/data/files"`. 유효하지 않은 key나 해석 결과가 `<root>/<bucket>/` 밖이면 `throw new Error("invalid key")`.

- [ ] **Step 1: 실패하는 테스트** (`FILES_ROOT`를 `fs.mkdtempSync(os.tmpdir()+"/st-")`로)
  - put → get 왕복 바이트 동일 (`gangnam/3f2b…ab.pdf`)
  - 같은 키 두 번째 put(기본) → reject, `{overwrite:true}` → 성공
  - `getFile("checklist","none/x.pdf") === null`
  - `removeFiles("checklist",["none/x.pdf"])` → resolve
  - `isValidKey("_photos/abc-123/0.jpg") === true`, `isValidKey("../etc/passwd") === false`, `isValidKey("a/../b.pdf") === false`, `isValidKey("/abs.pdf") === false`
  - `putFile("checklist","../x.pdf",…)` → reject `invalid key`

- [ ] **Step 2: 실패 확인** — `npm test` → module not found

- [ ] **Step 3: 구현** — `node:fs/promises`(`writeFile` with `flag: "wx"` / `"w"`, `mkdir recursive`, `readFile`, `rm force`), `node:path.resolve`로 루트 밖 검사.

- [ ] **Step 4: 통과 확인** — `npm test` → pass

- [ ] **Step 5: Commit** — `git add lib/storage.ts tests/storage.test.mjs && git commit -m "feat(storage): 로컬 파일 저장소 추가"`

---

### Task 4: 캡처 전용 Supabase 클라이언트 정리

**Files:**
- Modify: `lib/supabaseAdmin.ts`, `lib/daepyecha/capture.ts`

**Interfaces:**
- Produces: `getSupabaseAdmin()`(기존 이름 유지) — URL을 `process.env.SUPABASE_URL`에서 읽음. `uploadCapturePublic(id: string, jpg: Uint8Array): Promise<string>`(sb 인자 제거, 내부에서 `getSupabaseAdmin()`; env 없으면 `""` 반환), 새 함수 `removeCaptures(ids: string[]): Promise<void>`(실패·env 없음 무시).
- Consumes: 없음.

- [ ] **Step 1:** `supabaseAdmin.ts` 주석을 "팀즈 인라인 캡처(captures 버킷) 전용"으로, URL env를 `SUPABASE_URL`로 변경(Next는 서버 코드의 `NEXT_PUBLIC_*`도 빌드 때 박아 넣으므로 반드시 이름 변경).
- [ ] **Step 2:** `capture.ts`에 위 시그니처 적용. 동작(경로 `${id}.jpg`, upsert, `?v=Date.now()`)은 동일.
- [ ] **Step 3: 확인** — `npx tsc --noEmit` 는 호출부(Task 5·6에서 수정) 때문에 실패해도 됨. 이 두 파일 자체 오류가 없는지만 본다.
- [ ] **Step 4: Commit** — `git add lib/supabaseAdmin.ts lib/daepyecha/capture.ts && git commit -m "refactor(capture): Supabase는 캡처 전용으로 축소"`

---

### Task 5: 대폐차(자재 지급확인서) API 5개 전환

**Files:**
- Modify: `app/api/daepyecha/route.ts`, `app/api/daepyecha/[id]/route.ts`, `app/api/daepyecha/[id]/download/route.ts`, `app/api/daepyecha/download-zip/route.ts`, `app/api/daepyecha/trash/route.ts`

**Interfaces:**
- Consumes: Task 2 `q`, `q1`, `jsonb`, `likeContains`, `isUuid`; Task 3 `putFile`, `getFile`, `removeFiles`(bucket `"daepyecha"`).

변환 규칙(모든 라우트 공통):
- `adminClient()`/`getSupabase*()`와 "SERVICE_ROLE_KEY 없음" 503 분기 삭제. DB 예외는 `try/catch`로 잡아 기존 메시지 접두어(`조회 실패:`, `저장 실패:` …) + `e.message`로 500.
- `[id]` 라우트는 첫 줄에서 `if (!isUuid(params.id))` → GET/PUT/download는 `404 { error: "기록 없음" }`, DELETE/PATCH는 `400 { error: "잘못된 id" }`.
- 목록 GET: `select <기존 컬럼 목록> from daepyecha_confirmations where variant=$1 and deleted_at is [not] null [and center=$n] [and (operator ilike $n or vehicle_numbers ilike $n)] [and issued_date >= $n] [and issued_date <= $n] order by created_at desc limit 500`. 검색값은 `likeContains(q)` 하나를 두 조건에 같은 `$n`으로.
- POST: 저장소 `putFile` → `insert … returning id`; insert 실패 시 `removeFiles`로 롤백(기존과 동일). `items`는 `jsonb(meta.items ?? [])` + `$n::jsonb`.
- PUT: `update … set …, updated_at = now() where id=$1`; 업데이트 0행이면 404.
- DELETE soft: `update … set deleted_at = now()`; hard: `pdf_path` 조회 → `removeFiles` → `delete`.
- PATCH: `deleted_at = null`.
- download: `getFile` → null이면 `500 { error: "파일 다운로드 실패" }`(기존과 동일), 헤더 그대로.
- zip: `ids`를 `isUuid`로 거른 뒤 `where id = any($1::uuid[])`.
- trash 비우기: select → `removeFiles` → `delete … where variant=$1 and deleted_at is not null`.
- 릴레이 메일·파일명 로직은 손대지 않는다.

- [ ] **Step 1:** 위 규칙으로 5개 파일 변환.
- [ ] **Step 2: 타입 확인** — Run: `npx tsc --noEmit 2>&1 | grep "app/api/daepyecha"` / Expected: 출력 없음
- [ ] **Step 3: 동작 확인(Docker 가능 시)** — `DATABASE_URL=postgres://app:testpw@localhost:55432/app FILES_ROOT=./.tmp-files npm run dev` 후, 로그인한 브라우저에서 `/daepyecha` 신규 저장 1건 → 목록 표시 → PDF 다운로드 파일명에 날짜가 `YYYY-MM-DD` → 수정 저장 → 휴지통 → 복원 → 영구삭제 후 `.tmp-files/daepyecha/`에 파일 없음. `curl -s localhost:3000/api/daepyecha/abc` (로그인 쿠키 포함) → 404. (Docker 없으면 Task 10 서버 검증에서 동일 시나리오 수행)
- [ ] **Step 4: Commit** — `git add app/api/daepyecha && git commit -m "refactor(daepyecha): Supabase → Postgres·로컬 파일"`

---

### Task 6: 체크리스트 API 5개 전환

**Files:**
- Modify: `app/api/checklist/route.ts`, `app/api/checklist/[id]/route.ts`, `app/api/checklist/[id]/download/route.ts`, `app/api/checklist/download-zip/route.ts`, `app/api/checklist/trash/route.ts`

**Interfaces:**
- Consumes: Task 2·3(bucket `"checklist"`), Task 4 `uploadCapturePublic(id, jpg)`, `removeCaptures(ids)`; `relayUploadedPhotos`는 Task 7에서 `sb` 인자를 뺀 `relayUploadedPhotos(refs, info)`로 바뀜 — 이 태스크에서 호출부를 새 시그니처로 맞춘다.

- [ ] **Step 1:** Task 5의 변환 규칙을 그대로 적용. 차이점만:
  - 목록 GET: `install_date` 기간 필터, `tagless=1`이면 `and data->>'tagless' = 'true'`.
  - `data`는 `jsonb(meta.data ?? {})`.
  - `install_date`는 `meta.install_date || null`.
  - hard DELETE·trash 비우기에서 캡처 정리는 `removeCaptures([...ids])`.
  - `uploadCapturePublic(id, relayBytes)` 새 시그니처.
- [ ] **Step 2: 타입 확인** — `npx tsc --noEmit 2>&1 | grep "app/api/checklist/(route|\[id\]|download|trash)"` → 출력 없음(Task 7 전이라 photoRelay 관련 오류만 남을 수 있음)
- [ ] **Step 3: 동작 확인** — Task 5 Step 3과 같은 시나리오를 수도권·지역·공용 체크리스트 탭에서 1건씩. 태그리스 필터 동작.
- [ ] **Step 4: Commit** — `git add app/api/checklist/route.ts "app/api/checklist/[id]" app/api/checklist/download-zip app/api/checklist/trash && git commit -m "refactor(checklist): Supabase → Postgres·로컬 파일"`

---

### Task 7: 증빙사진 업로드를 우리 서버로 + http용 UUID

**Files:**
- Create: `app/api/checklist/photos/route.ts`, `lib/uuid.ts`, `tests/uuid.test.mjs`
- Modify: `lib/daepyecha/photo.ts`, `lib/daepyecha/photoRelay.ts`, `lib/daepyecha/photo-upload.ts`(주석·`PHOTO_BUCKET` 타입을 `Bucket`으로), `app/daepyecha/checklist/ChecklistModal.tsx:161`, `app/daepyecha/checklist-incheon/IncheonChecklistModal.tsx:162`
- Delete: `app/api/checklist/photo-upload-urls/route.ts`, `lib/supabaseBrowser.ts`

**Interfaces:**
- Produces:
  - `POST /api/checklist/photos` multipart `{ batchId: string, idx: string, label: string, file: File }` → `200 { path: string, filename: string }` (`path = photoTempPath(batchId, idx)`, `filename = \`${label}.jpg\``). 실패 `400 { error }`(batchId `^[0-9a-f-]{8,}$` 아님 / idx 0~7 아님 / 파일 없음 / 15MB 초과 / JPEG 아님). 저장은 `putFile("checklist", path, bytes, { overwrite: true })`. middleware matcher(`/api/checklist/:path*`)로 로그인 필수 — 별도 처리 불필요.
  - `uploadPhotosDirect(slots, batchId): Promise<PhotoRef[]>` — 시그니처 유지, 장마다 위 API에 병렬 POST, 실패 시 `사진 업로드 실패(<label>): <error>` throw.
  - `relayUploadedPhotos(refs: PhotoRef[], info): Promise<void>` — `sb` 인자 제거, `getFile`/`removeFiles`("checklist") 사용. 성공 시에만 삭제하는 규칙 유지.
  - `uuid(): string` (`lib/uuid.ts`) — `crypto.getRandomValues` 16바이트로 RFC4122 v4 문자열.

- [ ] **Step 1: 실패하는 테스트** (`tests/uuid.test.mjs`) — `uuid()` 1000개가 모두 `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/` 매칭, 중복 없음.
- [ ] **Step 2: 실패 확인** — `npm test` → module not found
- [ ] **Step 3: 구현** — `lib/uuid.ts`, 두 모달의 `crypto.randomUUID()` → `uuid()`; photos 라우트; `photo.ts`/`photoRelay.ts` 수정; 두 파일 삭제.
- [ ] **Step 4: 통과·잔여 확인**
  Run: `npm test && npx tsc --noEmit && grep -rn "randomUUID" app/daepyecha components lib/daepyecha | grep -v "^app/api"`
  Expected: 테스트 pass, tsc 오류 0, grep 출력 없음
- [ ] **Step 5: 동작 확인** — 휴대폰을 PC와 같은 망에서 `http://<PC IP>:3000`으로 접속(= 비보안 컨텍스트 재현) → 수도권 체크리스트 신규 작성, 사진 8장 → 저장 성공, 팀즈 사진 폴더에 8장, `.tmp-files/checklist/_photos/` 비어 있음. 9MB급 원본 1장도 성공.
- [ ] **Step 6: Commit** — `git add app/api/checklist/photos lib/uuid.ts tests/uuid.test.mjs lib/daepyecha/photo.ts lib/daepyecha/photoRelay.ts lib/daepyecha/photo-upload.ts app/daepyecha/checklist/ChecklistModal.tsx app/daepyecha/checklist-incheon/IncheonChecklistModal.tsx && git rm app/api/checklist/photo-upload-urls/route.ts lib/supabaseBrowser.ts && git commit -m "feat(checklist): 증빙사진 서버 직접 업로드, http용 UUID"`

---

### Task 8: 차량 관리·버스 검색 전환, `lib/supabase.ts` 제거

**Files:**
- Modify: `app/api/admin/vehicles/route.ts`, `app/api/bus/search/route.ts`, `VehicleRow`/`RouteRow`/`Station`을 import 하는 모든 파일(`grep -rln "@/lib/supabase\"" app lib components`)
- Delete: `lib/supabase.ts`

**Interfaces:**
- Consumes: Task 2 전부.

- [ ] **Step 1: admin/vehicles** — GET: `… where plate_no ilike $1 or route_id ilike $1 or route_name ilike $1 or garage_name ilike $1 order by plate_no limit 200`(q 없으면 where 생략). POST: `insert into vehicles (plate_no, <EDITABLE…>) values (…)`(컬럼명은 `EDITABLE` 상수에서만 가져옴). PATCH: `patch` 키(= `EDITABLE`의 부분집합)로 `set col=$n` 조립, `where plate_no=$last`. DELETE: `delete … where plate_no=$1`. 503 분기 삭제.
- [ ] **Step 2: bus/search** — 후보: `… where plate_no ilike $1 limit 50`, 값 `'%' + q`(q는 이미 `^\d{1,4}$` 검증됨). routes: `where route_id = any($1::text[])`. front_car_log upsert: `insert into front_car_log (service_date, vehicle_id, front_tail, front_gap, sect_ord, recorded_at) select * from jsonb_to_recordset($1::jsonb) as x(service_date date, vehicle_id text, front_tail text, front_gap int, sect_ord int, recorded_at timestamptz) on conflict (service_date, vehicle_id) do update set front_tail=excluded.front_tail, front_gap=excluded.front_gap, sect_ord=excluded.sect_ord, recorded_at=excluded.recorded_at` (값 `jsonb(frontRecords)`, 실패는 기존처럼 console.error만). history: `where service_date=$1 and vehicle_id = any($2::text[])`.
- [ ] **Step 3:** 타입 import를 `@/lib/db`로 바꾸고 `lib/supabase.ts` 삭제.
- [ ] **Step 4: 전체 확인**
  Run: `npx tsc --noEmit && npm test && npm run build && grep -rln "supabase" app lib components middleware.ts`
  Expected: 오류 0, 테스트 pass, 빌드 성공, grep 결과는 `lib/supabaseAdmin.ts`, `lib/daepyecha/capture.ts` 두 개뿐.
- [ ] **Step 5: 동작 확인** — `/`(버스 검색)에서 끝자리 4자리 검색 → 결과·ETA 표시, `front_car_log`에 행 생김. `/admin`에서 차량 검색·추가·수정·삭제, 검색어 `50%` 입력 시 오류 없음.
- [ ] **Step 6: Commit** — `git add app/api/admin/vehicles/route.ts app/api/bus/search/route.ts <타입 import 바꾼 파일들> && git rm lib/supabase.ts && git commit -m "refactor: 차량·검색 Postgres 전환, supabase DB 클라이언트 제거"`

---

### Task 9: 스크립트 — 로컬 DB 접속 + 데이터 이전·검증

**Files:**
- Create: `scripts/pg-config.mjs`, `scripts/migrate-storage.mjs`, `scripts/verify-migration.mjs`
- Modify: `scripts/seed-front-car.mjs`, `scripts/purge-front-car.mjs`, `scripts/fill-last-seq.mjs`

**Interfaces:**
- Produces:
  - `loadEnv(): Record<string,string>` — `{...process.env}` + `.env.local`(있으면) 병합(기존 각 스크립트의 코드를 옮김)
  - `targetPg(env)` → `env.DATABASE_URL` 있으면 `{ connectionString }`(SSL 없음), 없으면 기존 Supabase 설정(`ssl: { rejectUnauthorized: false }`)
  - `sourcePg(env)` → 항상 Supabase 설정(SUPABASE_DB_*)
  - `migrate-storage.mjs`: env `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FILES_ROOT`. 버킷 `daepyecha`, `checklist`를 재귀 list(100개씩 페이지) → 이미 같은 크기 파일이 있으면 skip, 아니면 다운로드 저장. 끝에 `버킷별 파일 수/바이트` 출력. 재실행 안전.
  - `verify-migration.mjs`: 5개 테이블 `count(*)`를 source/target 비교, target의 모든 `pdf_path`에 대해 `isValidKey` 규칙(storage.ts와 같은 정규식) 불일치 목록과 `FILES_ROOT` 내 파일 부재 목록 출력. 하나라도 있으면 `exit 1`, 아니면 `검증 통과` 출력.

- [ ] **Step 1:** `pg-config.mjs` 작성, 세 스크립트가 `loadEnv`/`targetPg` 사용하도록 교체.
- [ ] **Step 2:** `migrate-storage.mjs`, `verify-migration.mjs` 작성.
- [ ] **Step 3: 확인(Docker 가능 시)** — 로컬 pgtest에 Supabase 데이터를 Task 10 Step 2의 3번 명령으로 복원한 뒤 `DATABASE_URL=… FILES_ROOT=./.tmp-files node scripts/migrate-storage.mjs && DATABASE_URL=… FILES_ROOT=./.tmp-files node scripts/verify-migration.mjs` → `검증 통과`. `DATABASE_URL=… node scripts/purge-front-car.mjs` 정상 종료.
- [ ] **Step 4: Commit** — `git add scripts/pg-config.mjs scripts/migrate-storage.mjs scripts/verify-migration.mjs scripts/seed-front-car.mjs scripts/purge-front-car.mjs scripts/fill-last-seq.mjs && git commit -m "feat(scripts): 로컬 DB 접속, 데이터 이전·검증 스크립트"`

---

### Task 10: 운영 — crontab·백업·전환 절차서

**Files:**
- Create: `deploy/backup.sh`, `deploy/crontab.txt`, `docs/운영-서버.md`
- Modify: `vercel.json` (전환 당일에만, 아래 Step 4)
- Delete: `.github/workflows/purge-front-car.yml`, `.github/workflows/seed-front-car.yml` (전환 당일, Step 4)

**Interfaces:**
- `deploy/backup.sh <compose 폴더>`: `docker compose exec -T db pg_dump -U app app | gzip > ~/myapp-backup/YYYY-MM-DD/db.sql.gz`, `docker run --rm -v myapp_data:/d:ro alpine tar czf - -C /d files > …/files.tar.gz`, 14일 넘은 날짜 폴더 삭제. 실패 시 exit≠0.
- `deploy/crontab.txt` (CRON_TZ=Asia/Seoul, 경로는 `~/bustime_atec`):
  - `0 7 * * *` seed, `0 0 * * *` purge (`docker compose exec -T web node scripts/…`)
  - `0 3 * * *` `deploy/backup.sh`
  - `30 6 * * *` Supabase 깨우기: `curl -fsS -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_URL/storage/v1/bucket" >/dev/null` (값은 `.env`에서 source)
  - 모든 줄 출력은 `~/myapp-cron.log`에 append.

- [ ] **Step 1:** `backup.sh`, `crontab.txt` 작성. `bash -n deploy/backup.sh` 통과.
- [ ] **Step 2: `docs/운영-서버.md`** — 아래 전환 절차를 명령 그대로 담는다:
  1. 공지(새 주소 `http://<서버주소>:8090`, "주의 요함" 표시, 앱 설치 불가, 저장 중단 시간).
  2. 서버: `git pull`, `.env`에 `POSTGRES_PASSWORD`·`SUPABASE_URL` 추가, `docker compose up -d --build`(빈 DB로 기동).
  3. 데이터: `docker run --rm postgres:17-alpine pg_dump "<Supabase 세션 풀러 URL: aws-1-ap-southeast-2.pooler.supabase.com:5432, user postgres.<ref>>" --data-only --no-owner -t public.vehicles -t public.routes -t public.daepyecha_confirmations -t public.checklist_confirmations -t public.front_car_log > supa.sql` → `docker compose exec -T db psql -v ON_ERROR_STOP=1 -U app app < supa.sql`. (직접 호스트 `db.<ref>.supabase.co`는 IPv6 전용이라 풀러 사용)
  4. 파일: `docker compose exec -T -e SUPABASE_URL -e SUPABASE_SERVICE_ROLE_KEY web node scripts/migrate-storage.mjs`
  5. 검증: `docker compose exec -T -e SUPABASE_DB_HOST=… -e SUPABASE_DB_PORT=5432 -e SUPABASE_DB_USER=postgres.<ref> -e SUPABASE_DB_PASSWORD=… web node scripts/verify-migration.mjs` → `검증 통과`가 아니면 **중단**하고 공지 철회(Vercel 그대로).
  6. 실사용 확인: 자재확인서·체크리스트 신규 저장 1건씩, PDF 열기, 사진 8장 저장, 팀즈 폴더·스레드(인라인 사진) 확인, 버스 검색.
  7. `crontab deploy/crontab.txt`(기존 crontab 있으면 병합), `sudo systemctl enable docker`.
  8. Vercel: `vercel.json`에 `"redirects": [{ "source": "/(.*)", "destination": "http://<서버주소>:8090/$1", "permanent": false }]` 추가 후 `git push origin main`(Vercel 연결 저장소), GitHub Actions 워크플로 2개 삭제 커밋.
  9. 30일 뒤: Supabase 테이블 데이터·`daepyecha`/`checklist` 버킷 비우기(프로젝트·`captures` 유지).
  - 복원 절차: `gunzip -c db.sql.gz | docker compose exec -T db psql -U app app`(빈 DB에), `files.tar.gz`를 볼륨에 풀기.
  - 업데이트 절차: `git pull && docker compose up -d --build`.
- [ ] **Step 3: Commit** — `git add deploy docs/운영-서버.md && git commit -m "docs(ops): 백업·crontab·전환 절차"`
- [ ] **Step 4 (전환 당일, 절차서 6번 통과 후):** `vercel.json` 리다이렉트 + 워크플로 삭제 커밋 → `git push origin main`, `git push atec main`.
