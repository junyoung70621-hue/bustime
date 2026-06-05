// ─────────────────────────────────────────────────────────────
// 외부 cron(cron-job.org 등)용 키 동기화 감지 엔드포인트
//   - 아직 미동기화 → 200 (정상 → cron 알림 없음)
//   - 동기화 완료    → 503 (비정상 → cron이 "실패" 메일 발송 = 풀림 신호!)
//   - 일시 연결오류  → 200 (오탐 방지)
// ※ 키가 풀려 503이 뜨기 시작하면, 알림 받은 뒤 cron 작업을 중지하세요(반복 메일 방지).
// ─────────────────────────────────────────────────────────────
import { NextResponse } from "next/server";
import { fetchBusPositions, PublicApiAuthError } from "@/lib/publicApi";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 인증 통과(성공) = 키 동기화됨. 빈 목록이어도 인증은 통과한 것.
    await fetchBusPositions("100100118");
    return new NextResponse(
      "KEY SYNCED ✅ 공공 API 키가 동기화되었습니다.\n" +
        "1) https://bustime-beta.vercel.app 에서 위치가 자동 표시됩니다(새로고침).\n" +
        "2) ETA 완성: 로컬에서 'node scripts/fill-last-seq.mjs' 1회 실행.\n" +
        "※ 이 알림을 받았으면 cron 작업을 중지하세요.",
      { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } },
    );
  } catch (e) {
    if (e instanceof PublicApiAuthError) {
      // 아직 미동기화 (정상 대기 상태)
      return NextResponse.json({ synced: false, status: "pending" }, { status: 200 });
    }
    // 일시적 연결 오류 등 → 오탐 방지 위해 200
    return NextResponse.json({ synced: false, status: "transient_error", detail: String(e) }, { status: 200 });
  }
}
