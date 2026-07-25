// ─────────────────────────────────────────────────────────────
// 저장 응답 안전 파싱 (클라이언트 공용)
//   서버가 비-JSON(413/504 등 플랫폼 오류 페이지)을 줄 수 있어
//   res.json() 대신 text로 받고 안전 파싱 — 실패 시 상태코드가 담긴 에러로 변환.
// ─────────────────────────────────────────────────────────────
export async function parseJsonRes<T = { error?: string; id?: string }>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return (text ? JSON.parse(text) : {}) as T;
  } catch {
    throw new Error(`[서버 ${res.status}] 응답이 JSON이 아님: ${text.slice(0, 80) || "(빈 응답)"}`);
  }
}
