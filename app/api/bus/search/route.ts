// ─────────────────────────────────────────────────────────────
// 1. API 라우트 (백엔드 로직)
// GET /api/bus/search?q=1234
//   - q: 차량번호 끝 4자리(1~4자리 숫자)
// 흐름: Supabase에서 후보 차량 조회 → 노선별 실시간 위치 조회 → ETA 계산
// 공공 API 키는 서버에서만 사용하므로 클라이언트에 노출되지 않음.
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { getSupabase, type VehicleRow, type RouteRow, type Station } from "@/lib/supabase";
import { fetchBusPositions, PublicApiAuthError, type BusPosition } from "@/lib/publicApi";
import { calcEta } from "@/lib/eta";
import { classifyRoute } from "@/lib/routeType";

export const dynamic = "force-dynamic"; // 항상 실시간 조회

export type SearchResult = {
  plateNo: string;
  routeName: string;
  garageName: string;
  operator: string;
  currentSeq: number;
  lastSeq: number | null;
  remainingStops: number;
  etaMinutes: number;
  arrived: boolean;
  etaUnknown: boolean; // 종점순번 미수집으로 ETA 계산 불가
  atStop: boolean; // 현재 정류소 정차 중 여부
  dataTm: string;
  live: boolean; // 실시간 위치 매칭 성공 여부
  busTypeLabel: string | null; // 노선유형 라벨(마을/간선/지선/…). 분류 불가 시 null
  isVillage: boolean; // 마을버스 여부
  // 마을버스 회차지 확인용. 마을버스이고 정류장 데이터가 있을 때만 채워짐(그 외 null).
  stations: Station[] | null; // 정류장 목록(순번 오름차순)
};

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();

  if (!/^\d{1,4}$/.test(q)) {
    return NextResponse.json(
      { error: "차량번호 끝 1~4자리 숫자를 입력하세요." },
      { status: 400 },
    );
  }

  // 1) Supabase에서 끝자리가 일치하는 차량 후보 조회
  const supabase = getSupabase();
  const { data: vehicles, error } = await supabase
    .from("vehicles")
    .select("plate_no, vehicle_id, route_id, route_name, garage_name, operator")
    .ilike("plate_no", `%${q}`)
    .limit(50)
    .returns<VehicleRow[]>();

  if (error) {
    return NextResponse.json({ error: `DB 조회 실패: ${error.message}` }, { status: 500 });
  }
  if (!vehicles || vehicles.length === 0) {
    return NextResponse.json({ results: [] as SearchResult[] });
  }

  // 2) 노선ID 중복 제거 (미배정 차량은 제외)
  const routeIds = [...new Set(vehicles.map((v) => v.route_id).filter((r): r is string => !!r))];

  // 2-1) 해당 노선들의 종점순번(last_seq) + 노선유형(route_type) + 정류장목록(stations) 조회 → Map
  const lastSeqByRoute = new Map<string, number | null>();
  const routeTypeByRoute = new Map<string, string | null>();
  const stationsByRoute = new Map<string, Station[] | null>();
  if (routeIds.length > 0) {
    const { data: routeRows } = await supabase
      .from("routes")
      .select("route_id, last_seq, route_type, stations")
      .in("route_id", routeIds)
      .returns<RouteRow[]>();
    for (const r of routeRows ?? []) {
      lastSeqByRoute.set(r.route_id, r.last_seq);
      routeTypeByRoute.set(r.route_id, r.route_type);
      stationsByRoute.set(r.route_id, r.stations);
    }
  }
  const positionsByRoute = new Map<string, BusPosition[]>();
  let authError: PublicApiAuthError | null = null;

  await Promise.all(
    routeIds.map(async (rid) => {
      try {
        positionsByRoute.set(rid, await fetchBusPositions(rid));
      } catch (e) {
        if (e instanceof PublicApiAuthError) authError = e;
        else console.error(`route ${rid} 위치 조회 실패`, e);
        positionsByRoute.set(rid, []);
      }
    }),
  );

  // 키 미등록/인증 실패여도 결과는 막지 않고, 차량/노선 정보는 보여준다.
  // (실시간 위치/ETA만 비활성 → 상단 배너로 안내)
  const notice = authError
    ? "실시간 위치 서버 인증 대기 중입니다(공공 API 키 동기화 전). 차량·노선 정보만 표시되며 ETA는 키 활성화 후 자동 표시됩니다."
    : null;

  // 3) 각 후보 차량을 실시간 위치와 매칭 → ETA 계산
  const results: SearchResult[] = vehicles.map((v) => {
    const positions = v.route_id ? positionsByRoute.get(v.route_id) ?? [] : [];
    const pos =
      positions.find((p) => p.vehId === v.vehicle_id) ??
      positions.find((p) => p.plainNo?.endsWith(q));

    const lastSeq = v.route_id ? lastSeqByRoute.get(v.route_id) ?? null : null;
    const currentSeq = pos?.sectOrd ?? 0;
    const eta = calcEta(currentSeq, lastSeq);

    const routeType = v.route_id ? routeTypeByRoute.get(v.route_id) ?? null : null;
    const typeInfo = classifyRoute(routeType, v.route_name);
    const isVillage = typeInfo?.kind === "village";
    // 정류장 목록은 마을버스일 때만 내려줌(다른 유형은 payload 절약 위해 생략).
    const stations = isVillage && v.route_id ? stationsByRoute.get(v.route_id) ?? null : null;

    return {
      plateNo: v.plate_no,
      routeName: v.route_name,
      garageName: v.garage_name,
      operator: v.operator,
      currentSeq,
      lastSeq,
      remainingStops: eta.remainingStops,
      etaMinutes: eta.etaMinutes,
      arrived: eta.arrived,
      etaUnknown: eta.unknown,
      atStop: pos?.stopFlag === "1",
      dataTm: pos?.dataTm ?? "",
      live: Boolean(pos),
      busTypeLabel: typeInfo?.label ?? null,
      isVillage,
      stations,
    };
  });

  // 실시간 매칭된 차량을 위로, 그 안에서 ETA 짧은 순 정렬
  results.sort((a, b) => {
    if (a.live !== b.live) return a.live ? -1 : 1;
    return a.etaMinutes - b.etaMinutes;
  });

  return NextResponse.json({ results, notice });
}
