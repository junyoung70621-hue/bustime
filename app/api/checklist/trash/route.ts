// ─────────────────────────────────────────────────────────────
// 체크리스트 휴지통 비우기: 삭제표시된 기록 영구삭제(파일+행)
//   DELETE /api/checklist/trash
// ─────────────────────────────────────────────────────────────
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
const BUCKET = "checklist";

export async function DELETE() {
  let sb;
  try {
    sb = getSupabaseAdmin();
  } catch {
    return NextResponse.json({ error: "쓰기 기능 비활성: SUPABASE_SERVICE_ROLE_KEY 없음" }, { status: 503 });
  }

  const { data: rows, error: selErr } = await sb
    .from("checklist_confirmations")
    .select("id, pdf_path")
    .not("deleted_at", "is", null);
  if (selErr) return NextResponse.json({ error: `조회 실패: ${selErr.message}` }, { status: 500 });
  if (!rows || rows.length === 0) return NextResponse.json({ ok: true, removed: 0 });

  const paths = rows.map((r) => r.pdf_path).filter(Boolean);
  if (paths.length) await sb.storage.from(BUCKET).remove(paths);

  const { error: delErr } = await sb.from("checklist_confirmations").delete().not("deleted_at", "is", null);
  if (delErr) return NextResponse.json({ error: `비우기 실패: ${delErr.message}` }, { status: 500 });
  return NextResponse.json({ ok: true, removed: rows.length });
}
