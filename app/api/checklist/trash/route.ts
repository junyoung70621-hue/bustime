// ─────────────────────────────────────────────────────────────
// 체크리스트 휴지통 비우기: 삭제표시된 기록 영구삭제(파일+행)
//   DELETE /api/checklist/trash?variant=default|regional|gongyong|gosi|incheon
//   ※ 탭(variant)별로만 비운다 — 5개 탭이 이 엔드포인트를 공유하므로
//     variant 필터 없이 지우면 다른 탭의 휴지통까지 영구삭제된다.
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { q } from "@/lib/db";
import { removeFiles } from "@/lib/storage";
import { removeCaptures } from "@/lib/daepyecha/capture";

export const dynamic = "force-dynamic";
const BUCKET = "checklist";

export async function DELETE(req: NextRequest) {
  const variant = req.nextUrl.searchParams.get("variant") || "default";

  let rows: { id: string; pdf_path: string }[];
  try {
    rows = await q(
      "select id, pdf_path from checklist_confirmations where variant = $1 and deleted_at is not null",
      [variant],
    );
  } catch (e) {
    return NextResponse.json({ error: `조회 실패: ${e instanceof Error ? e.message : e}` }, { status: 500 });
  }
  if (rows.length === 0) return NextResponse.json({ ok: true, removed: 0 });

  const paths = rows.map((r) => r.pdf_path).filter(Boolean);
  if (paths.length) await removeFiles(BUCKET, paths).catch((e) => console.error("휴지통 파일 삭제 실패:", e));
  // 공개 캡쳐(수도권/인천)도 정리 — 단건 영구삭제와 동일. 없는 경로는 무시됨.
  await removeCaptures(rows.map((r) => r.id));

  try {
    await q("delete from checklist_confirmations where variant = $1 and deleted_at is not null", [variant]);
  } catch (e) {
    return NextResponse.json({ error: `비우기 실패: ${e instanceof Error ? e.message : e}` }, { status: 500 });
  }
  return NextResponse.json({ ok: true, removed: rows.length });
}
