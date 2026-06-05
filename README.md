# 🚍 차량번호 기반 종점 도착 시간(ETA) 대시보드

티머니 단말기 A/S 기사님이 차고지에서 수리 대상 차량을 기다리는 시간을 줄이기 위한 프로토타입.
차량번호 끝 4자리 → 종점까지 남은 정류장 수 & 예상 도착 시간(ETA)을 보여줍니다.

## 스택
Next.js(App Router) · TypeScript · Tailwind CSS · Supabase · Vercel

## 동작 구조
1. 끝 4자리 입력 → `/api/bus/search?q=1234`
2. **Supabase** `vehicles` 테이블에서 끝자리 일치 차량(노선ID, 종점순번) 조회
3. 노선별 **공공데이터 실시간 위치 API**(`getBusPosByRtid`) 호출 → 해당 차량의 현재 구간순번(`sectOrd`) 추출
4. `ETA = (종점순번 - 현재순번) × 정류장당 평균시간(1.5분)` 계산 → 대시보드 표시

> 공공 API는 *노선ID 기준*이라 차량번호만으로는 위치를 못 찾습니다. 그래서 Supabase가 `차량번호 → 노선ID` 매핑을 담당합니다.

## 빠른 시작
```bash
npm install
```
1. **테이블 생성** — Supabase SQL Editor 에 `supabase/schema.sql` 실행
2. **데이터 적재** — Table Editor > Import CSV
   - `routes` ← `supabase/routes.csv` (노선 658개)
   - `vehicles` ← `supabase/vehicles.csv` (차량 9,575대)
3. **(키 활성화 후) 종점순번 채우기** — `node scripts/fill-last-seq.mjs` (노선별 종점순번을 Supabase `routes.last_seq` 에 직접 기록)
4. `npm run dev` → http://localhost:3000

> CSV는 사내 `차량단말기버전-*.xls` 에서 추출한 실데이터입니다. (표준노선ID=busRouteId, 차량번호=plainNo 로 공공 API와 매칭)
> `last_seq` 가 비어있는 노선은 ETA 대신 현재 위치만 표시됩니다.

## 환경 변수
| 변수 | Vercel 등록 | 설명 |
|---|:---:|---|
| `PUBLIC_DATA_API_KEY` | ✅ 필수 | 공공데이터포털 버스위치 API 인증키 |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ 필수 | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ 필수 | Supabase anon 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | 선택 | RLS 우회 읽기용 service_role 키 |
| `SUPABASE_DB_HOST/PORT/USER/PASSWORD` | ❌ 불필요 | 로컬 스크립트(적재·last_seq) 전용. **앱 런타임 미사용** |

로컬은 `.env.local`, 배포는 **Vercel > Project > Settings > Environment Variables** 에 위 ✅ 3개만 등록하면 됩니다.

## Vercel 배포 (GitHub 연동)
1. **GitHub에 푸시** (아래 "GitHub 푸시" 참고)
2. [vercel.com/new](https://vercel.com/new) → 해당 저장소 **Import** (Framework: Next.js 자동 감지)
3. **Environment Variables** 에 위 표의 ✅ 3개 등록 → **Deploy**
4. 끝. 공공 API는 서버(Route Handler)에서만 호출되어 키가 노출되지 않습니다(`https` 실패 시 `http` 자동 폴백).

### GitHub 푸시
```bash
# 이미 git init + 최초 커밋은 되어 있음. 원격만 연결:
git remote add origin https://github.com/<계정>/<레포>.git
git branch -M main
git push -u origin main
```
> ⚠️ 회사 차량 데이터(`supabase/vehicles.csv`, `routes.csv`)와 `.env.local` 은 `.gitignore` 로 **푸시 제외**됩니다. 데이터는 이미 Supabase에 있으니 배포엔 불필요합니다. (다른 PC에서 재적재하려면 원본 `.xls` 에서 CSV 재생성)

## 튜닝 포인트
- `lib/eta.ts` 의 `AVG_MIN_PER_STOP` (정류장당 평균 분) — 시간대/노선별로 보정 가능
- `last_seq`(종점순번)는 노선마다 다름 → 정확도를 위해 노선별 실제 정류장 수로 채워야 함
