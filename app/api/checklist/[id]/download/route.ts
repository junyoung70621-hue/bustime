// ─────────────────────────────────────────────────────────────
// 체크리스트 PDF 다운로드: 60초 signed URL 리다이렉트 (파일명 "운수사 설치일.pdf")
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
const BUCKET = "checklist";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("checklist_confirmations")
    .select("pdf_path, operator, install_date")
    .eq("id", params.id)
    .single();
  if (error || !data) return NextResponse.json({ error: "기록 없음" }, { status: 404 });

  let admin;
  try {
    admin = getSupabaseAdmin();
  } catch {
    return NextResponse.json({ error: "다운로드 비활성: SERVICE_ROLE_KEY 없음" }, { status: 503 });
  }
  const safe = (s: string) => s.replace(/[\\/:*?"<>|]/g, "").trim();
  const filename = `${safe(data.operator || "체크리스트")} 설치완료체크리스트_${data.install_date || ""}`.trim() + ".pdf";
  const signed = await admin.storage.from(BUCKET).createSignedUrl(data.pdf_path, 60, { download: filename });
  if (signed.error || !signed.data) return NextResponse.json({ error: "서명 URL 생성 실패" }, { status: 500 });
  return NextResponse.redirect(signed.data.signedUrl);
}
