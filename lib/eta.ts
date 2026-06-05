// ─────────────────────────────────────────────────────────────
// 2. 도착 시간(ETA) 계산 로직
// 정류장당 평균 소요 시간을 상수로 곱하는 가벼운 방식.
// 추후 시간대/혼잡도 보정이 필요하면 이 파일만 손보면 됩니다.
// ─────────────────────────────────────────────────────────────

/** 정류장 1개 구간 통과에 걸리는 평균 시간(분). 차고지 인근 일반도로 기준 경험값. */
export const AVG_MIN_PER_STOP = 1.5;

export type EtaResult = {
  remainingStops: number; // 종점까지 남은 정류장 수
  etaMinutes: number; // 예상 소요 시간(분, 반올림)
  arrived: boolean; // 사실상 종점 도착(남은 정류장 0 이하)
  unknown: boolean; // 종점순번 미수집 등으로 계산 불가
};

/**
 * 현재 구간순번(sectOrd)과 종점 구간순번(lastSeq)으로 ETA를 계산한다.
 * @param currentSeq 실시간 API의 현재 구간순번 (sectOrd)
 * @param lastSeq    노선 종점의 구간순번. null/0 이면 계산 불가(unknown)
 * @param avgMinPerStop 정류장당 평균 소요 시간(분). 기본값 AVG_MIN_PER_STOP
 */
export function calcEta(
  currentSeq: number,
  lastSeq: number | null,
  avgMinPerStop: number = AVG_MIN_PER_STOP,
): EtaResult {
  if (!lastSeq || lastSeq <= 0) {
    return { remainingStops: 0, etaMinutes: 0, arrived: false, unknown: true };
  }
  const remainingStops = Math.max(lastSeq - currentSeq, 0);
  const etaMinutes = Math.round(remainingStops * avgMinPerStop);
  return {
    remainingStops,
    etaMinutes,
    arrived: remainingStops <= 0,
    unknown: false,
  };
}

/** 분 단위를 "약 12분" / "곧 도착" 같은 사람이 읽는 문자열로 변환 */
export function formatEta(eta: EtaResult): string {
  if (eta.arrived) return "종점 도착(대기)";
  if (eta.etaMinutes <= 2) return "곧 도착";
  return `약 ${eta.etaMinutes}분`;
}
