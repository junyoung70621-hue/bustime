-- ─────────────────────────────────────────────────────────────
-- 회사 서버 Postgres 초기 스키마 (db 컨테이너 최초 기동 시 1회 실행)
--   supabase/schema.sql 에서 Supabase 전용 구문(RLS·정책·anon/authenticated 역할)만 뺀 것.
--   컬럼은 Supabase와 동일해야 pg_dump 데이터 이전이 그대로 들어간다.
-- ─────────────────────────────────────────────────────────────

create extension if not exists pg_trgm;

create table if not exists public.routes (
  route_id   text primary key,         -- 표준노선ID = 공공 API busRouteId
  route_name text not null default '',
  last_seq   int,                      -- 종점 구간순번(정류장 수). NULL = 미수집
  last_st_id text,                     -- 종점 정류소 고유ID(stId). NULL = 미수집
  route_type text,                     -- 노선유형 코드. NULL = 미수집
  stations   jsonb                     -- 정류장 목록 [{seq,nm}]. NULL = 미수집
);

create table if not exists public.vehicles (
  plate_no    text primary key,         -- 차량번호 (= 공공 API plainNo)
  vehicle_id  text not null default '', -- 차량ID (보조 매칭용)
  route_id    text,                     -- 표준노선ID (routes.route_id)
  route_name  text not null default '', -- 노선명
  garage_name text not null default '', -- 영업소/차고지
  operator    text not null default ''  -- 교통사업자명
);
create index if not exists idx_vehicles_route on public.vehicles (route_id);
create index if not exists idx_vehicles_plate_trgm
  on public.vehicles using gin (plate_no gin_trgm_ops);

create table if not exists public.daepyecha_confirmations (
  id              uuid primary key default gen_random_uuid(),
  center          text not null,
  operator        text not null default '',
  office_type     text not null default '',
  model           text not null,
  purpose         text not null default '대폐차',
  tagless         boolean not null default false,
  vehicle_count   int  not null default 0,
  vehicle_numbers text not null default '',
  items           jsonb not null default '[]'::jsonb, -- [{name,bigo,qty,newReused?}]
  etc             text not null default '',
  receiver_name   text not null default '',
  transferor_name text not null default '',
  receiver_sig    text,
  transferor_sig  text,
  issued_date     date not null,
  pdf_path        text not null,             -- 파일 경로(/app/data/files/daepyecha/<pdf_path>)
  variant         text not null default 'default',
  teams_file      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  modified_by     text not null default '',
  deleted_at      timestamptz
);
create index if not exists idx_dpc_center  on public.daepyecha_confirmations (center);
create index if not exists idx_dpc_created on public.daepyecha_confirmations (created_at desc);
create index if not exists idx_dpc_issued  on public.daepyecha_confirmations (issued_date desc);
create index if not exists idx_dpc_deleted on public.daepyecha_confirmations (deleted_at);
create index if not exists idx_dpc_variant on public.daepyecha_confirmations (variant);

create table if not exists public.checklist_confirmations (
  id                   uuid primary key default gen_random_uuid(),
  center               text not null,
  operator             text not null default '',
  model                text not null,
  install_date         date,
  vehicle_numbers      text not null default '',
  installer_name       text not null default '',
  operator_signer_name text not null default '',
  data                 jsonb not null default '{}'::jsonb, -- 폼 전체 스냅샷(서명 제외)
  pdf_path             text not null,                      -- /app/data/files/checklist/<pdf_path>
  variant              text not null default 'default',
  teams_file           text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  modified_by          text not null default '',
  deleted_at           timestamptz
);
create index if not exists idx_ck_center  on public.checklist_confirmations (center);
create index if not exists idx_ck_created on public.checklist_confirmations (created_at desc);
create index if not exists idx_ck_install on public.checklist_confirmations (install_date desc);
create index if not exists idx_ck_deleted on public.checklist_confirmations (deleted_at);
create index if not exists idx_ck_variant on public.checklist_confirmations (variant);

create table if not exists public.front_car_log (
  service_date date not null,                    -- KST 운행일
  vehicle_id   text not null,                    -- 뒤차 차량ID (= 공공 API vehId)
  front_tail   text not null,                    -- 앞차 번호 끝 4자리
  front_gap    int  not null default 0,          -- 앞차까지 구간 수
  sect_ord     int  not null default 0,          -- 기록 시점 구간순번
  recorded_at  timestamptz not null default now(),
  primary key (service_date, vehicle_id)
);
create index if not exists idx_front_car_date on public.front_car_log (service_date);
