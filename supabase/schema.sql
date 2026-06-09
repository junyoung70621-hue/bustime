-- ─────────────────────────────────────────────────────────────
-- 4. Supabase 스키마 (실데이터: 차량단말기버전 .xls 기반)
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 실행 → 이후 CSV import.
-- ─────────────────────────────────────────────────────────────

-- ── 노선 마스터 (고유 658개). last_seq 는 노선정보조회 API로 나중에 채움 ──
create table if not exists public.routes (
  route_id   text primary key,         -- 표준노선ID = 공공 API busRouteId
  route_name text not null default '',
  last_seq   int,                      -- 종점 구간순번(정류장 수). NULL = 미수집
  route_type text,                     -- 노선유형(1공항/2마을/3간선/4지선/5순환/6광역/15심야). NULL = 미수집
  stations   jsonb                     -- 정류장 목록 [{seq,nm}] (마을버스 회차지 표시용). NULL = 미수집
);

-- ── 차량 (고유 9,575대) ──
create table if not exists public.vehicles (
  plate_no    text primary key,        -- 차량번호 (= 공공 API plainNo)
  vehicle_id  text not null default '', -- 차량ID (보조 매칭용)
  route_id    text,                    -- 표준노선ID (routes.route_id)
  route_name  text not null default '', -- 노선명(편의상 중복 보관)
  garage_name text not null default '', -- 영업소/차고지
  operator    text not null default ''  -- 교통사업자명
);

create index if not exists idx_vehicles_route on public.vehicles (route_id);

-- 끝자리 검색(ilike '%1234') 가속
create extension if not exists pg_trgm;
create index if not exists idx_vehicles_plate_trgm
  on public.vehicles using gin (plate_no gin_trgm_ops);

-- ── RLS: anon 읽기 허용 ──
alter table public.vehicles enable row level security;
alter table public.routes   enable row level security;

drop policy if exists "read vehicles" on public.vehicles;
create policy "read vehicles" on public.vehicles for select to anon, authenticated using (true);

drop policy if exists "read routes" on public.routes;
create policy "read routes" on public.routes for select to anon, authenticated using (true);

-- ─────────────────────────────────────────────────────────────
-- 데이터 적재 순서
--  1) 위 SQL 실행 (테이블 생성)
--  2) Table Editor > routes  > Import data via CSV > supabase/routes.csv
--  3) Table Editor > vehicles> Import data via CSV > supabase/vehicles.csv
--  4) (키 활성화 후) scripts/fill-last-seq.mjs 실행 → routes.last_seq 채움
-- ─────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────
-- 대폐차 자재 지급확인서 (공개 작성, 쓰기는 service_role API 경유)
-- 별도: Storage 비공개 버킷 'daepyecha' 생성 필요(Public OFF).
-- ─────────────────────────────────────────────────────────────
create table if not exists public.daepyecha_confirmations (
  id              uuid primary key default gen_random_uuid(),
  center          text not null,             -- 강남/강서/강북/강동
  operator        text not null default '',  -- 운수사
  office_type     text not null default '',  -- 본사/영업소
  model           text not null,             -- B620/B700/B710/B800
  purpose         text not null default '대폐차', -- 대폐차/증차
  vehicle_count   int  not null default 0,
  vehicle_numbers text not null default '',
  items           jsonb not null default '[]'::jsonb, -- [{name,bigo,qty,newReused?}]
  etc             text not null default '',  -- 기타사항(표 13번 행)
  receiver_name   text not null default '',  -- 인수자(운수회사) 정자명
  transferor_name text not null default '',  -- 인계자(자사) 정자명
  issued_date     date not null,
  pdf_path        text not null,             -- Storage 내 경로
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(), -- 최종수정일(사이트에만 표기, PDF 미포함)
  modified_by     text not null default '',  -- 수정자명(수정 시 필수)
  deleted_at      timestamptz                -- 휴지통: null=정상, 값 있으면 휴지통
);
create index if not exists idx_dpc_center  on public.daepyecha_confirmations (center);
create index if not exists idx_dpc_created on public.daepyecha_confirmations (created_at desc);
create index if not exists idx_dpc_issued  on public.daepyecha_confirmations (issued_date desc);
create index if not exists idx_dpc_deleted on public.daepyecha_confirmations (deleted_at);

-- 기존 테이블이 이미 있는 경우(컬럼 추가 마이그레이션):
alter table public.daepyecha_confirmations
  add column if not exists etc         text not null default '',
  add column if not exists updated_at  timestamptz not null default now(),
  add column if not exists modified_by text not null default '',
  add column if not exists deleted_at  timestamptz;

alter table public.daepyecha_confirmations enable row level security;
drop policy if exists "read dpc" on public.daepyecha_confirmations;
create policy "read dpc" on public.daepyecha_confirmations
  for select to anon, authenticated using (true);
-- INSERT/UPDATE/DELETE 정책 없음 → service_role(키 서버전용)만 쓰기 가능

-- ─────────────────────────────────────────────────────────────
-- 설치 완료 체크리스트 (공개 작성, 쓰기는 service_role API)
-- 별도: Storage 비공개 버킷 'checklist' 생성 필요.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.checklist_confirmations (
  id                   uuid primary key default gen_random_uuid(),
  center               text not null,
  operator             text not null default '', -- 운수사명
  model                text not null,            -- B620(한강셔틀)/B620/B700/B710/B800
  install_date         date,
  vehicle_numbers      text not null default '',
  installer_name       text not null default '', -- 설치자 정자
  operator_signer_name text not null default '', -- 운수사 담당자 정자
  data                 jsonb not null default '{}'::jsonb, -- 폼 전체 스냅샷(서명 제외)
  pdf_path             text not null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  modified_by          text not null default '',
  deleted_at           timestamptz
);
create index if not exists idx_ck_center  on public.checklist_confirmations (center);
create index if not exists idx_ck_created on public.checklist_confirmations (created_at desc);
create index if not exists idx_ck_install on public.checklist_confirmations (install_date desc);
create index if not exists idx_ck_deleted on public.checklist_confirmations (deleted_at);

alter table public.checklist_confirmations enable row level security;
drop policy if exists "read ck" on public.checklist_confirmations;
create policy "read ck" on public.checklist_confirmations
  for select to anon, authenticated using (true);

-- ─────────────────────────────────────────────────────────────
-- 앞차 기록 (시내버스 GPS/LTE 장애 시 위치 가늠용)
-- 검색 시 그 노선 전 차량의 "바로 앞차" 관계를 그날(KST)자로 기록.
-- 신호가 잡힐 때 기록해 두고, 끊겼을 때 마지막 앞차를 보여준다. 매일 운행일별로 누적.
-- 쓰기는 service_role(검색 API)만, 읽기는 anon 허용.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.front_car_log (
  service_date date not null,                    -- KST 운행일
  vehicle_id   text not null,                    -- 뒤차(기록 대상) 차량ID (= 공공 API vehId)
  front_tail   text not null,                    -- 앞차 번호 끝 4자리
  front_gap    int  not null default 0,          -- 앞차까지 구간(정거장) 수
  sect_ord     int  not null default 0,          -- 기록 시점 내 구간순번
  recorded_at  timestamptz not null default now(),
  primary key (service_date, vehicle_id)
);
create index if not exists idx_front_car_date on public.front_car_log (service_date);

alter table public.front_car_log enable row level security;
drop policy if exists "read front_car_log" on public.front_car_log;
create policy "read front_car_log" on public.front_car_log
  for select to anon, authenticated using (true);
-- INSERT/UPDATE 정책 없음 → service_role(검색 API)만 쓰기
