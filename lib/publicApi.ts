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
