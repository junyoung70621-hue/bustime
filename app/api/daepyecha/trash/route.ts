// ─────────────────────────────────────────────────────────────
// 휴지통 비우기: 삭제 표시(deleted_at IS NOT NULL)된 기록 영구삭제
//   DELETE /api/daepyecha/trash?variant=default|regional
//   → 스토리지 PDF 파일 + DB 행 모두 제거
//   ※ 탭(variant)별로만 비운다 — 수도권/지역 탭이 이 엔드포인트를 공유.
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const BUCKET = "daepyecha";

export async function DELETE(req: NextRequest) {
  let sb;
  try {
    sb = getSupabaseAdmin();
  } catch {
    return NextResponse.json(
      { error: "쓰기 기능 비활성: SUPABASE_SERVICE_ROLE_KEY 없음" },
      { status: 503 },
    );
  }

  const variant = req.nextUrl.searchParams.get("variant") || "default";

  const { data: rows, error: selErr } = await sb
    .from("daepyecha_confirmations")
    .select("id, pdf_path")
    .eq("variant", variant)
    .not("deleted_at", "is", null);
  if (selErr) return NextResponse.json({ error: `조회 실패: ${selErr.message}` }, { status: 500 });
  if (!rows || rows.length === 0) return NextResponse.json({ ok: true, removed: 0 });

  const paths = rows.map((r) => r.pdf_path).filter(Boolean);
  if (paths.length) await sb.storage.from(BUCKET).remove(paths);

  const { error: delErr } = await sb
    .from("daepyecha_confirmations")
    .delete()
    .eq("variant", variant)
    .not("deleted_at", "is", null);
  if (delErr) return NextResponse.json({ error: `비우기 실패: ${delErr.message}` }, { status: 500 });

  return NextResponse.json({ ok: true, removed: rows.length });
}
