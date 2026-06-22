// ─────────────────────────────────────────────────────────────
// 4. Supabase 연동 (서버 전용 클라이언트)
// 정적 차량/노선 데이터를 읽기 위한 클라이언트.
// 서버(Route Handler)에서만 import 하세요.
// ─────────────────────────────────────────────────────────────
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

/**
 * Supabase 클라이언트(지연 초기화).
 * 모듈 로드 시점이 아니라 첫 호출(런타임) 때 생성하므로,
 * 빌드 단계에서 env가 없어도 빌드가 실패하지 않는다.
 */
export function getSupabase(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase 환경변수 누락: NEXT_PUBLIC_SUPABASE_URL / (SUPABASE_SERVICE_ROLE_KEY | NEXT_PUBLIC_SUPABASE_ANON_KEY)",
    );
  }
  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}

/** Supabase `vehicles` 테이블 한 행의 타입 */
export type VehicleRow = {
  plate_no: string; // 차량번호 (예: "서울75사8915") = 공공 API plainNo
  vehicle_id: string; // 차량ID (보조 매칭용)
  route_id: string | null; // 표준노선ID = busRouteId (미배정이면 null)
  route_name: string; // 노선명
  garage_name: string; // 영업소/차고지
  operator: string; // 교통사업자명
};

/** 노선의 정류장 1개(순번+이름) */
export type Station = { seq: number; nm: string };

/** Supabase `routes` 테이블 한 행의 타입 */
export type RouteRow = {
  route_id: string; // 표준노선ID
  route_name: string;
  last_seq: number | null; // 종점 구간순번. null = 아직 미수집
  last_st_id: string | null; // 종점 정류소 고유ID(stId). 도착정보 API 호출용. null = 미수집
  route_type: string | null; // 노선유형 코드(1공항/2마을/3간선…). null = 미수집
  stations: Station[] | null; // 정류장 목록(순번 오름차순). null = 미수집
};
