// ─────────────────────────────────────────────────────────────
// 체크리스트 휴지통 비우기: 삭제표시된 기록 영구삭제(파일+행)
//   DELETE /api/checklist/trash?variant=default|regional|gongyong|gosi|incheon
//   ※ 탭(variant)별로만 비운다 — 5개 탭이 이 엔드포인트를 공유하므로
//     variant 필터 없이 지우면 다른 탭의 휴지통까지 영구삭제된다.
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { CAPTURE_BUCKET } from "@/lib/daepyecha/capture";

export const dynamic = "force-dynamic";
const BUCKET = "checklist";

export async function DELETE(req: NextRequest) {
  let sb;
  try {
    sb = getSupabaseAdmin();
  } catch {
    return NextResponse.json({ error: "쓰기 기능 비활성: SUPABASE_SERVICE_ROLE_KEY 없음" }, { status: 503 });
  }

  const variant = req.nextUrl.searchParams.get("variant") || "default";

  const { data: rows, error: selErr } = await sb
    .from("checklist_confirmations")
    .select("id, pdf_path")
    .eq("variant", variant)
    .not("deleted_at", "is", null);
  if (selErr) return NextResponse.json({ error: `조회 실패: ${selErr.message}` }, { status: 500 });
  if (!rows || rows.length === 0) return NextResponse.json({ ok: true, removed: 0 });

  const paths = rows.map((r) => r.pdf_path).filter(Boolean);
  if (paths.length) await sb.storage.from(BUCKET).remove(paths);
  // 공개 캡쳐(수도권/인천)도 정리 — 단건 영구삭제와 동일. 없는 경로는 무시됨.
  await sb.storage.from(CAPTURE_BUCKET).remove(rows.map((r) => `${r.id}.jpg`));

  const { error: delErr } = await sb
    .from("checklist_confirmations")
    .delete()
    .eq("variant", variant)
    .not("deleted_at", "is", null);
  if (delErr) return NextResponse.json({ error: `비우기 실패: ${delErr.message}` }, { status: 500 });
  return NextResponse.json({ ok: true, removed: rows.length });
}
