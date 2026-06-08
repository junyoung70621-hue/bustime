// ─────────────────────────────────────────────────────────────
// 노선유형(routeType) → 사람이 읽는 라벨 + 시내/마을 분류
// 서울 TOPIS routeType 코드:
//   1/14 공항 · 2 마을 · 3 간선 · 4 지선 · 5 순환 · 6 광역 · 7 인천 · 8 경기 · 15 심야
// routeType 은 노선정보조회(getStaionByRoute) 응답에서 수집해 routes.route_type 에 저장.
// ─────────────────────────────────────────────────────────────

export type RouteKind = "village" | "city"; // 마을 / 시내
export type RouteTypeInfo = { label: string; kind: RouteKind };

const MAP: Record<string, RouteTypeInfo> = {
  "1": { label: "공항", kind: "city" },
  "14": { label: "공항", kind: "city" },
  "2": { label: "마을", kind: "village" },
  "3": { label: "간선", kind: "city" },
  "4": { label: "지선", kind: "city" },
  "5": { label: "순환", kind: "city" },
  "6": { label: "광역", kind: "city" },
  "7": { label: "인천", kind: "city" },
  "8": { label: "경기", kind: "city" },
  "15": { label: "심야", kind: "city" },
};

/**
 * 노선유형 분류. route_type(공공 API 수집값)이 있으면 그걸 우선 사용(정확),
 * 없으면 노선명 패턴으로 마을/시내를 잠정 추정한다.
 * @param routeType routes.route_type (없으면 null)
 * @param routeName 노선명(추정 fallback용)
 */
export function classifyRoute(
  routeType: string | null | undefined,
  routeName: string | null | undefined,
): RouteTypeInfo | null {
  if (routeType && MAP[routeType]) return MAP[routeType];

  // route_type 미수집 → 노선명 패턴 추정(잠정).
  // 서울 마을버스는 모두 '지역명(한글)+숫자' 형식(예: 영등포09, 마포07).
  // 단, 영문 A가 섞인 맞춤형(동작A01)·새벽/심야/출근 노선은 시내버스이므로 제외.
  const name = routeName ?? "";
  if (!name) return null;
  const koreanStart = /^[가-힣]/.test(name);
  const hasUpperAlpha = /[A-Z]/.test(name);
  const special = /^(한강|새벽|심야|서울)/.test(name) || /(출근|퇴근)/.test(name);
  if (koreanStart && !hasUpperAlpha && !special) return { label: "마을", kind: "village" };
  return { label: "시내", kind: "city" };
}
