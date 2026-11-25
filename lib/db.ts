// ─────────────────────────────────────────────────────────────
// 회사 서버 Postgres 연결 (서버 전용 — Route Handler·스크립트에서만 import)
//   DATABASE_URL(docker-compose 가 주입)로 첫 쿼리 때 연결 풀 생성.
//   모든 값은 $1 파라미터로만 넘긴다(문자열 조합 금지).
//   ※ 이 파일은 테스트가 Node로 직접 import 하므로 "@/..." import 금지.
// ─────────────────────────────────────────────────────────────
import pg from "pg";

// date → "YYYY-MM-DD" 그대로(Date로 바꾸면 파일명·화면에 "Tue Nov 25…"가 찍힘),
// timestamptz/timestamp → ISO 문자열(기존 Supabase 응답과 같은 문자열 타입 유지).
pg.types.setTypeParser(1082, (v: string) => v);
pg.types.setTypeParser(1184, (v: string) => new Date(v).toISOString());
pg.types.setTypeParser(1114, (v: string) => new Date(v).toISOString());

let _pool: pg.Pool | null = null;

function pool(): pg.Pool {
  if (_pool) return _pool;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL 환경변수가 없습니다.");
  _pool = new pg.Pool({ connectionString: url, max: 10 });
  // DB 재시작 등으로 유휴 연결이 끊기면 풀이 'error' 이벤트를 낸다. 리스너가 없으면
  // Node 프로세스 전체가 죽으므로 로그만 남긴다(다음 쿼리는 새 연결로 자동 진행).
  _pool.on("error", (e) => console.error("DB 유휴 연결 오류(무시):", e.message));
  return _pool;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

/** 쿼리 실행 → 행 배열 */
export async function q<T = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  const r = await pool().query(text, params);
  return r.rows as T[];
}

/** 쿼리 실행 → 첫 행(없으면 null) */
export async function q1<T = Row>(text: string, params: unknown[] = []): Promise<T | null> {
  return (await q<T>(text, params))[0] ?? null;
}

/** jsonb 컬럼 파라미터. pg는 JS 배열을 Postgres 배열로 바꿔버리므로 반드시 문자열로 넘기고 SQL에서 $n::jsonb */
export function jsonb(v: unknown): string {
  return JSON.stringify(v ?? null);
}

/** ILIKE 부분일치 패턴. 검색어 안의 \ % _ 는 문자 그대로 찾도록 이스케이프. */
export function likeContains(s: string): string {
  return `%${s.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** URL 의 id 가 uuid 형식인지(아니면 Postgres가 예외 → 500 대신 404/400 으로 처리) */
export function isUuid(s: string): boolean {
  return UUID_RE.test(s);
}

/** `vehicles` 테이블 한 행의 타입 */
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

/** `routes` 테이블 한 행의 타입 */
export type RouteRow = {
  route_id: string; // 표준노선ID
  route_name: string;
  last_seq: number | null; // 종점 구간순번. null = 아직 미수집
  last_st_id: string | null; // 종점 정류소 고유ID(stId). 도착정보 API 호출용. null = 미수집
  route_type: string | null; // 노선유형 코드(1공항/2마을/3간선…). null = 미수집
  stations: Station[] | null; // 정류장 목록(순번 오름차순). null = 미수집
};
