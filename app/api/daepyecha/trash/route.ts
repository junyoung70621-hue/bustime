// ─────────────────────────────────────────────────────────────
// 휴지통 비우기: 삭제 표시(deleted_at IS NOT NULL)된 기록 영구삭제
//   DELETE /api/daepyecha/trash?variant=default|regional
//   → 서버 PDF 파일 + DB 행 모두 제거
//   ※ 탭(variant)별로만 비운다 — 수도권/지역 탭이 이 엔드포인트를 공유.
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { q } from "@/lib/db";
import { removeFiles } from "@/lib/storage";

export const dynamic = "force-dynamic";

const BUCKET = "daepyecha";

export async function DELETE(req: NextRequest) {
  const variant = req.nextUrl.searchParams.get("variant") || "default";

  let rows: { id: string; pdf_path: string }[];
  try {
    rows = await q(
      "select id, pdf_path from daepyecha_confirmations where variant = $1 and deleted_at is not null",
      [variant],
    );
  } catch (e) {
    return NextResponse.json({ error: `조회 실패: ${e instanceof Error ? e.message : e}` }, { status: 500 });
  }
  if (rows.length === 0) return NextResponse.json({ ok: true, removed: 0 });

  const paths = rows.map((r) => r.pdf_path).filter(Boolean);
  if (paths.length) await removeFiles(BUCKET, paths).catch((e) => console.error("휴지통 파일 삭제 실패:", e));

  try {
    await q("delete from daepyecha_confirmations where variant = $1 and deleted_at is not null", [variant]);
  } catch (e) {
    return NextResponse.json({ error: `비우기 실패: ${e instanceof Error ? e.message : e}` }, { status: 500 });
  }
  return NextResponse.json({ ok: true, removed: rows.length });
}
