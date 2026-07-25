// ─────────────────────────────────────────────────────────────
// 1. API 라우트 (백엔드 로직)
// GET /api/bus/search?q=1234
//   - q: 차량번호 끝 4자리(1~4자리 숫자)
// 흐름: Supabase에서 후보 차량 조회 → 노선별 실시간 위치 조회 → ETA 계산
// 공공 API 키는 서버에서만 사용하므로 클라이언트에 노출되지 않음.
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { getSupabase, type VehicleRow, type RouteRow, type Station } from "@/lib/supabase";
import {
  fetchBusPositions,
  fetchArrivalInfo,
  PublicApiAuthError,
  PublicApiQuotaError,
  type BusPosition,
  type ArrivalBus,
} from "@/lib/publicApi";
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
  // ETA 산출 출처. "live"=종점 도착정보 API 실측 예측(교통상황 반영), "estimate"=정류장 수×평균 추정.
  etaSource: "live" | "estimate";
  arrMsg: string | null; // 도착정보 API 원문 메시지(live일 때만, 예: "3분23초후[2번째 전]")
  atStop: boolean; // 현재 정류소 정차 중 여부
  dataTm: string;
  live: boolean; // 실시간 위치 매칭 성공 여부
  busTypeLabel: string | null; // 노선유형 라벨(마을/간선/지선/…). 분류 불가 시 null
  isVillage: boolean; // 마을버스 여부
  // 마을버스 회차지 확인용. 마을버스이고 정류장 데이터가 있을 때만 채워짐(그 외 null).
  stations: Station[] | null; // 정류장 목록(순번 오름차순)
  // 같은 노선에서 현재 운행 중인 모든 차량(정류장 리스트에 위치 표시용). 마을버스일 때만 채움.
  routeVehicles: RouteVehicle[] | null;
  // 같은 노선에서 내 바로 앞에 가는 차(앞차)의 번호 끝 4자리. 없으면 null.
  // GPS/LTE 장애로 내 위치가 안 잡힐 땐, 신호 있을 때 오늘 기록해 둔 마지막 앞차를 보여준다.
  frontTail: string | null;
  frontGap: number; // 앞차까지 구간(정거장) 수. 0 = 미상
  frontLive: boolean; // true=지금 실시간 앞차 / false=오늘 기록된 마지막 앞차
  frontAt: string | null; // 기록 앞차일 때 기록 시각(KST "HH:MM"). 실시간이면 null
  frontEtaMinutes: number | null; // 앞차의 종점 도착 예정(분). 앞차가 실시간에 안 잡히면 null
};

// 정류장 리스트에 띄울 차량 1대(노선 내 다른 차량 포함).
export type RouteVehicle = {
  tail: string; // 차량번호 끝 4자리
  sectOrd: number; // 현재 구간순번(= 현재 정류장 순서)
  stopFlag: string; // "1" 정류소 정차중 / "0" 운행중
  sel: boolean; // 검색으로 선택된 그 차량인지
};

// 같은 노선에서 sectOrd 바로 앞(다음으로 큰 구간순번) 차량 = 앞차. 없으면(선두) null.
function frontCarOf(positions: BusPosition[], sectOrd: number): BusPosition | null {
  let front: BusPosition | null = null;
  for (const p of positions) {
    if (p.sectOrd > sectOrd && (!front || p.sectOrd < front.sectOrd)) front = p;
  }
  return front;
}

// 차량 1대를 실시간 위치와 매칭(차량ID 우선, 없으면 끝자리 번호판).
function matchPosition(positions: BusPosition[], v: VehicleRow, q: string): BusPosition | undefined {
  return (
    positions.find((p) => p.vehId === v.vehicle_id) ??
    positions.find((p) => p.plainNo?.endsWith(q))
  );
}

// 종점 도착정보 목록에서 해당 차량(vehId 우선, 없으면 번호판 끝자리)의 실측 예측 도착(분)을 찾는다.
// 종점에서 먼 차량은 도착정보 목록(접근 1·2번째)에 없어 null → 호출부가 추정식으로 폴백.
function liveEtaMinutes(
  arrivals: ArrivalBus[],
  vehId: string | undefined,
  tail: string,
): { minutes: number; arrmsg: string } | null {
  const a =
    (vehId ? arrivals.find((x) => x.vehId === vehId) : undefined) ??
    (tail ? arrivals.find((x) => x.plainNo.endsWith(tail)) : undefined);
  if (!a || a.traTimeSec < 0) return null;
  return { minutes: Math.max(0, Math.round(a.traTimeSec / 60)), arrmsg: a.arrmsg };
}

// ISO 시각 → 한국시간(KST) "HH:MM".
function fmtKstHm(iso: string): string {
  const k = new Date(new Date(iso).getTime() + 9 * 3600 * 1000);
  const hh = String(k.getUTCHours()).padStart(2, "0");
  const mm = String(k.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

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

  // 2-1) 해당 노선들의 종점순번(last_seq) + 종점정류소ID(last_st_id) + 노선유형 + 정류장목록 조회 → Map
  const lastSeqByRoute = new Map<string, number | null>();
  const lastStIdByRoute = new Map<string, string | null>();
  const routeTypeByRoute = new Map<string, string | null>();
  const stationsByRoute = new Map<string, Station[] | null>();
  if (routeIds.length > 0) {
    const { data: routeRows } = await supabase
      .from("routes")
      .select("route_id, last_seq, last_st_id, route_type, stations")
      .in("route_id", routeIds)
      .returns<RouteRow[]>();
    for (const r of routeRows ?? []) {
      lastSeqByRoute.set(r.route_id, r.last_seq);
      lastStIdByRoute.set(r.route_id, r.last_st_id);
      routeTypeByRoute.set(r.route_id, r.route_type);
      stationsByRoute.set(r.route_id, r.stations);
    }
  }
  const positionsByRoute = new Map<string, BusPosition[]>();
  // 노선별 종점 도착예정정보(실측 ETA). 종점정류소ID·순번이 있는 노선만 채워진다.
  const arrivalsByRoute = new Map<string, ArrivalBus[]>();
  let authError: PublicApiAuthError | null = null;
  let quotaError: PublicApiQuotaError | null = null;

  await Promise.all(
    routeIds.map(async (rid) => {
      // (a) 실시간 위치 — 현재 구간순번/앞차/마을버스 표시에 필수.
      const posTask = (async () => {
        try {
          positionsByRoute.set(rid, await fetchBusPositions(rid));
        } catch (e) {
          if (e instanceof PublicApiQuotaError) quotaError = e;
          else if (e instanceof PublicApiAuthError) authError = e;
          else console.error(`route ${rid} 위치 조회 실패`, e);
          positionsByRoute.set(rid, []);
        }
      })();
      // (b) 종점 도착예정정보 — 실측 ETA용. 실패해도 추정식으로 폴백하므로 조용히 무시.
      const lastStId = lastStIdByRoute.get(rid);
      const lastSeq = lastSeqByRoute.get(rid);
      const arrTask = (async () => {
        if (!lastStId || !lastSeq) return;
        try {
          arrivalsByRoute.set(rid, await fetchArrivalInfo(rid, lastStId, lastSeq));
        } catch (e) {
          if (e instanceof PublicApiQuotaError) quotaError = e;
          else if (e instanceof PublicApiAuthError) authError = e;
          arrivalsByRoute.set(rid, []);
        }
      })();
      await Promise.all([posTask, arrTask]);
    }),
  );

  // 한도 초과/키 미등록이어도 결과는 막지 않고, 차량/노선 정보는 보여준다.
  // (실시간 위치/ETA만 비활성 → 상단 배너로 정확한 원인 안내)
  const notice = quotaError
    ? "오늘 실시간 위치 조회 한도를 초과했습니다. 매일 자정(KST) 이후 자동 복구되며, 그때까지 ETA·실시간 위치가 표시되지 않을 수 있습니다."
    : authError
      ? "실시간 위치 서버 인증 대기 중입니다(공공 API 키 동기화 전). 차량·노선 정보만 표시되며 ETA는 키 활성화 후 자동 표시됩니다."
      : null;

  // 2-2) 앞차 기록: 조회된 노선의 모든 실시간 차량에 대해 "바로 앞차"를 그날(KST)자로 upsert.
  //   GPS/LTE 신호가 잡힐 때 기록해 두고, 끊겼을 때(아래 2-3) 마지막 기록을 보여주기 위함.
  const serviceDate = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  const nowIso = new Date().toISOString();
  const frontRecords = [];
  for (const positions of positionsByRoute.values()) {
    for (const p of positions) {
      if (!p.vehId || p.sectOrd <= 0) continue;
      const front = frontCarOf(positions, p.sectOrd);
      if (!front) continue; // 선두 차량은 앞차 없음
      frontRecords.push({
        service_date: serviceDate,
        vehicle_id: p.vehId,
        front_tail: (front.plainNo ?? "").slice(-4),
        front_gap: front.sectOrd - p.sectOrd,
        sect_ord: p.sectOrd,
        recorded_at: nowIso,
      });
    }
  }
  if (frontRecords.length > 0) {
    const { error: upErr } = await supabase
      .from("front_car_log")
      .upsert(frontRecords, { onConflict: "service_date,vehicle_id" });
    if (upErr) console.error("front_car_log upsert 실패:", upErr.message);
  }

  // 2-3) 실시간 신호가 없는 후보 차량은 오늘 기록된 마지막 앞차를 조회(있으면 그걸로 표시).
  const offlineIds = vehicles
    .filter((v) => {
      const positions = v.route_id ? positionsByRoute.get(v.route_id) ?? [] : [];
      return v.vehicle_id && !matchPosition(positions, v, q);
    })
    .map((v) => v.vehicle_id);
  const histByVehicle = new Map<
    string,
    { front_tail: string; front_gap: number; recorded_at: string }
  >();
  if (offlineIds.length > 0) {
    const { data: hist } = await supabase
      .from("front_car_log")
      .select("vehicle_id, front_tail, front_gap, recorded_at")
      .eq("service_date", serviceDate)
      .in("vehicle_id", offlineIds);
    for (const h of hist ?? []) histByVehicle.set(h.vehicle_id, h);
  }

  // 3) 각 후보 차량을 실시간 위치와 매칭 → ETA 계산
  const results: SearchResult[] = vehicles.map((v) => {
    const positions = v.route_id ? positionsByRoute.get(v.route_id) ?? [] : [];
    const pos = matchPosition(positions, v, q);

    const lastSeq = v.route_id ? lastSeqByRoute.get(v.route_id) ?? null : null;
    const currentSeq = pos?.sectOrd ?? 0;
    const eta = calcEta(currentSeq, lastSeq);
    const arrivals = v.route_id ? arrivalsByRoute.get(v.route_id) ?? [] : [];

    // ETA: 종점 도착정보 API에 내 차량이 잡히면 실측 예측(분)을 우선 사용, 아니면 추정식.
    let etaMinutes = eta.etaMinutes;
    let arrived = eta.arrived;
    let etaSource: "live" | "estimate" = "estimate";
    let arrMsg: string | null = null;
    if (pos) {
      const live = liveEtaMinutes(arrivals, pos.vehId, q);
      if (live) {
        etaMinutes = live.minutes;
        etaSource = "live";
        arrMsg = live.arrmsg;
        arrived = false; // 도착정보 목록에 잡힘 = 아직 종점 접근 중
      }
    }

    const routeType = v.route_id ? routeTypeByRoute.get(v.route_id) ?? null : null;
    const typeInfo = classifyRoute(routeType, v.route_name);
    const isVillage = typeInfo?.kind === "village";
    // 정류장 목록은 마을버스일 때만 내려줌(다른 유형은 payload 절약 위해 생략).
    const stations = isVillage && v.route_id ? stationsByRoute.get(v.route_id) ?? null : null;

    // 같은 노선의 모든 차량 위치(마을버스만). 위치신호 있는 차량(sectOrd>0)만, 끝 4자리로.
    const routeVehicles: RouteVehicle[] | null =
      isVillage && v.route_id
        ? positions
            .filter((p) => p.sectOrd > 0)
            .map((p) => ({
              tail: (p.plainNo ?? "").slice(-4),
              sectOrd: p.sectOrd,
              stopFlag: p.stopFlag,
              sel: Boolean(pos) && p.vehId === pos!.vehId,
            }))
        : null;

    // 앞차: 실시간 위치가 있으면 지금 앞차, 없으면 오늘 기록된 마지막 앞차.
    let frontTail: string | null = null;
    let frontGap = 0;
    let frontLive = false;
    let frontAt: string | null = null;
    // 앞차의 종점 도착 예정(분). 앞차의 '현재' 실시간 위치를 찾아 계산. 못 찾으면 null.
    let frontEtaMinutes: number | null = null;
    if (pos) {
      const front = frontCarOf(positions, pos.sectOrd);
      if (front) {
        frontTail = (front.plainNo ?? "").slice(-4);
        frontGap = front.sectOrd - pos.sectOrd;
        frontLive = true;
        // 앞차도 종점 도착정보에 잡히면 실측 예측 우선, 아니면 추정식.
        const fLive = liveEtaMinutes(arrivals, front.vehId, frontTail);
        if (fLive) frontEtaMinutes = fLive.minutes;
        else {
          const fe = calcEta(front.sectOrd, lastSeq);
          if (!fe.unknown) frontEtaMinutes = fe.etaMinutes;
        }
      }
    } else if (v.vehicle_id) {
      const h = histByVehicle.get(v.vehicle_id);
      if (h) {
        frontTail = h.front_tail;
        frontGap = h.front_gap;
        frontAt = fmtKstHm(h.recorded_at);
        // 신호없는 내 차: 아침에 기록된 앞차(끝4자리)를 현재 실시간 위치에서 찾아 ETA 계산.
        const frontPos = positions.find((p) => (p.plainNo ?? "").endsWith(h.front_tail));
        if (frontPos) {
          const fLive = liveEtaMinutes(arrivals, frontPos.vehId, h.front_tail);
          if (fLive) frontEtaMinutes = fLive.minutes;
          else {
            const fe = calcEta(frontPos.sectOrd, lastSeq);
            if (!fe.unknown) frontEtaMinutes = fe.etaMinutes;
          }
        }
      }
    }

    return {
      plateNo: v.plate_no,
      routeName: v.route_name,
      garageName: v.garage_name,
      operator: v.operator,
      currentSeq,
      lastSeq,
      remainingStops: eta.remainingStops,
      etaMinutes,
      arrived,
      etaUnknown: eta.unknown,
      etaSource,
      arrMsg,
      atStop: pos?.stopFlag === "1",
      dataTm: pos?.dataTm ?? "",
      live: Boolean(pos),
      busTypeLabel: typeInfo?.label ?? null,
      isVillage,
      stations,
      routeVehicles,
      frontTail,
      frontGap,
      frontLive,
      frontAt,
      frontEtaMinutes,
    };
  });

  // 실시간 매칭된 차량을 위로, 그 안에서 ETA 짧은 순 정렬.
  // ETA 미상(etaUnknown)은 0분이 아니라 '알 수 없음' → 맨 뒤로 보낸다.
  const sortKey = (r: (typeof results)[number]) => (r.etaUnknown ? Infinity : r.etaMinutes);
  results.sort((a, b) => {
    if (a.live !== b.live) return a.live ? -1 : 1;
    return sortKey(a) - sortKey(b);
  });

  return NextResponse.json({ results, notice });
}
