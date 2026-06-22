// ─────────────────────────────────────────────────────────────
// 공공데이터포털 - 서울시 버스위치정보조회 서비스 (서버 전용)
// getBusPosByRtid : 노선ID(busRouteId)로 해당 노선 모든 버스의 실시간 위치 조회
// 문서: https://www.data.go.kr/data/15000332/openapi.do
// ─────────────────────────────────────────────────────────────

// ws.bus.go.kr 는 환경에 따라 443(https) 연결이 막히는 경우가 있어 http 폴백을 둔다.
// (서버 측 호출이므로 http 사용에도 혼합콘텐츠 문제 없음)
const ENDPOINTS = [
  "https://ws.bus.go.kr/api/rest/buspos/getBusPosByRtid",
  "http://ws.bus.go.kr/api/rest/buspos/getBusPosByRtid",
];

/** 공공 API 인증 실패(키 미등록/오류)를 구분하기 위한 에러 */
export class PublicApiAuthError extends Error {}

/** 공공 API 일일 호출 한도 초과(LIMITED NUMBER...EXCEEDS)를 구분하기 위한 에러 */
export class PublicApiQuotaError extends Error {}

/** 실시간 위치 1대분. (필요한 필드만 추림) */
export type BusPosition = {
  vehId: string; // 차량 ID
  plainNo: string; // 차량번호판 (예: "서울70사1234")
  sectOrd: number; // 현재 구간순번 = 현재 정류장 순서
  stopFlag: string; // "1" 정류소 정차중 / "0" 운행중
  dataTm: string; // 위치 측정 시각
  congestion?: string; // 혼잡도 코드(있을 때만)
};

type RawItem = Record<string, string>;

/**
 * 노선ID로 실시간 버스 위치 목록을 가져온다.
 * 키 노출 방지를 위해 반드시 서버 측에서만 호출.
 */
export async function fetchBusPositions(busRouteId: string): Promise<BusPosition[]> {
  const serviceKey = process.env.PUBLIC_DATA_API_KEY;
  if (!serviceKey) throw new Error("PUBLIC_DATA_API_KEY 환경변수가 없습니다.");

  // serviceKey 는 '디코딩' 키를 .env 에 넣고 여기서 인코딩되게 둡니다.
  const params = new URLSearchParams({
    serviceKey,
    busRouteId,
    resultType: "json",
  });
  const qs = params.toString();

  // https/http 동시 요청 → 먼저 성공 응답하는 쪽 채택 (느린 전송 대기 없음)
  const TIMEOUT_MS = 6000;
  const fetchOne = async (base: string) => {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${base}?${qs}`, { cache: "no-store", signal: ac.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  };

  let json: any | null = null;
  try {
    json = await Promise.any(ENDPOINTS.map(fetchOne));
  } catch (e) {
    const lastErr = e instanceof AggregateError ? e.errors[e.errors.length - 1] : e;
    throw new Error(`공공 API 연결 실패(route ${busRouteId}): ${String(lastErr)}`);
  }

  // 정상 헤더 코드는 "0".
  const headerCd = String(json?.msgHeader?.headerCd ?? "");
  const headerMsg: string = json?.msgHeader?.headerMsg ?? "";
  if (headerCd && headerCd !== "0") {
    // 일일 호출 한도 초과(메시지에 LIMITED NUMBER/EXCEEDS, 인증모듈 코드 22).
    // 메시지에 '인증'이 함께 들어와 아래 인증분기와 겹치므로 한도 초과를 먼저 판별.
    if (/LIMITED NUMBER|EXCEEDS|초과|트래픽|\(22\)/i.test(headerMsg)) {
      throw new PublicApiQuotaError(headerMsg || "공공 API 호출 한도 초과");
    }
    // 인증/키 미등록 계열은 별도 에러로 올려 UI에서 명확히 안내
    if (headerCd === "7" || /인증|KEY|REGISTERED/i.test(headerMsg)) {
      throw new PublicApiAuthError(headerMsg || "공공 API 인증 실패");
    }
    console.warn("공공 API 응답 경고:", headerMsg, `(route ${busRouteId})`);
    return [];
  }

  // itemList 는 결과가 1건이면 객체, 여러 건이면 배열로 올 수 있어 정규화.
  const rawList = json?.msgBody?.itemList;
  const items: RawItem[] = Array.isArray(rawList) ? rawList : rawList ? [rawList] : [];

  return items.map((it) => ({
    vehId: it.vehId,
    plainNo: it.plainNo,
    sectOrd: Number(it.sectOrd ?? 0),
    stopFlag: it.stopFlag ?? "0",
    dataTm: it.dataTm ?? "",
    congestion: it.congetion ?? it.congestion, // API 철자 'congetion' 대응
  }));
}

// ─────────────────────────────────────────────────────────────
// 버스도착정보조회 서비스 - 특정 정류소 도착예정정보(getArrInfoByRoute)
//   stId(정류소ID)·busRouteId·ord(순번)로, 그 정류소에 접근 중인
//   1·2번째 버스의 실제 예측 도착시간(초)을 얻는다.
//   종점 정류소를 기준으로 호출하면 '종점 도착예정'을 실측 기반으로 계산 가능.
//   문서: https://www.data.go.kr/data/15000314/openapi.do
// ─────────────────────────────────────────────────────────────
const ARRIVE_ENDPOINTS = [
  "https://ws.bus.go.kr/api/rest/arrive/getArrInfoByRoute",
  "http://ws.bus.go.kr/api/rest/arrive/getArrInfoByRoute",
];

/** 특정 정류소로 접근 중인 버스 1대의 도착예정 정보(필요한 필드만). */
export type ArrivalBus = {
  vehId: string; // 차량 ID (실시간 위치의 vehId와 매칭)
  plainNo: string; // 차량번호판(보조 매칭용)
  traTimeSec: number; // 예측 도착 소요시간(초). 음수/0 = 곧 도착·정보없음
  arrmsg: string; // 도착정보 메시지(예: "3분23초후[2번째 전]")
};

/**
 * 종점 등 특정 정류소(stId, ord)에 접근 중인 1·2번째 버스의 도착예정정보를 가져온다.
 * 위치조회와 달리 교통상황이 반영된 실측 예측값이라, ETA 정확도가 크게 향상된다.
 * 한 정류소엔 접근차량을 최대 2대까지만 알려주므로, 종점에서 먼 차량은 매칭되지 않을 수 있다.
 * 실패 시 빈 배열을 돌려 호출부가 기존 추정식으로 폴백하게 한다.
 */
export async function fetchArrivalInfo(
  busRouteId: string,
  stId: string,
  ord: number,
): Promise<ArrivalBus[]> {
  const serviceKey = process.env.PUBLIC_DATA_API_KEY;
  if (!serviceKey) throw new Error("PUBLIC_DATA_API_KEY 환경변수가 없습니다.");

  const qs = new URLSearchParams({
    serviceKey,
    stId,
    busRouteId,
    ord: String(ord),
    resultType: "json",
  }).toString();

  const TIMEOUT_MS = 6000;
  const fetchOne = async (base: string) => {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${base}?${qs}`, { cache: "no-store", signal: ac.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  };

  let json: any | null = null;
  try {
    json = await Promise.any(ARRIVE_ENDPOINTS.map(fetchOne));
  } catch (e) {
    const lastErr = e instanceof AggregateError ? e.errors[e.errors.length - 1] : e;
    throw new Error(`도착정보 API 연결 실패(route ${busRouteId}): ${String(lastErr)}`);
  }

  const headerCd = String(json?.msgHeader?.headerCd ?? "");
  const headerMsg: string = json?.msgHeader?.headerMsg ?? "";
  if (headerCd && headerCd !== "0") {
    // 위치조회와 동일하게 한도초과/인증오류는 별도 에러로 올려 상위에서 안내·폴백.
    if (/LIMITED NUMBER|EXCEEDS|초과|트래픽|\(22\)/i.test(headerMsg)) {
      throw new PublicApiQuotaError(headerMsg || "공공 API 호출 한도 초과");
    }
    if (headerCd === "7" || /인증|KEY|REGISTERED/i.test(headerMsg)) {
      throw new PublicApiAuthError(headerMsg || "공공 API 인증 실패");
    }
    // 그 외(해당 정류소 도착정보 없음 등)는 조용히 빈 배열.
    return [];
  }

  // itemList 는 정류소 1건 → 객체(배열로 올 수도 있어 첫 건 사용).
  const raw = json?.msgBody?.itemList;
  const item: RawItem | undefined = Array.isArray(raw) ? raw[0] : raw ?? undefined;
  if (!item) return [];

  const out: ArrivalBus[] = [];
  for (const n of [1, 2] as const) {
    const vehId = item[`vehId${n}`];
    if (!vehId || vehId === "0") continue; // 접근 차량 없음
    out.push({
      vehId: String(vehId),
      plainNo: String(item[`plainNo${n}`] ?? ""),
      traTimeSec: Number(item[`traTime${n}`] ?? -1),
      arrmsg: String(item[`arrmsg${n}`] ?? ""),
    });
  }
  return out;
}
