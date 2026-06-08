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
  model           text not null,             -- B620/B700/B710/B800
  purpose         text not null default '대폐차',
  vehicle_count   int  not null default 0,
  vehicle_numbers text not null default '',
  items           jsonb not null default '[]'::jsonb, -- [{name,bigo,qty,newReused?}]
  receiver_name   text not null default '',  -- 인수자(운수회사) 정자명
  transferor_name text not null default '',  -- 인계자(자사) 정자명
  issued_date     date not null,
  pdf_path        text not null,             -- Storage 내 경로
  created_at      timestamptz not null default now()
);
create index if not exists idx_dpc_center  on public.daepyecha_confirmations (center);
create index if not exists idx_dpc_created on public.daepyecha_confirmations (created_at desc);

alter table public.daepyecha_confirmations enable row level security;
drop policy if exists "read dpc" on public.daepyecha_confirmations;
create policy "read dpc" on public.daepyecha_confirmations
  for select to anon, authenticated using (true);
-- INSERT/UPDATE/DELETE 정책 없음 → service_role(키 서버전용)만 쓰기 가능
