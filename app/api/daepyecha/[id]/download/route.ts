// ─────────────────────────────────────────────────────────────
// 대폐차 확인서 PDF 다운로드 (공개)
//   GET /api/daepyecha/[id]/download
//   → DB에서 pdf_path 조회 → service_role 로 60초 signed URL 발급 → 리다이렉트
//   (버킷은 비공개라 직접 URL 노출 안 함)
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const BUCKET = "daepyecha";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("daepyecha_confirmations")
    .select("pdf_path")
    .eq("id", params.id)
    .single();
  if (error || !data) return NextResponse.json({ error: "기록 없음" }, { status: 404 });

  let admin;
  try {
    admin = getSupabaseAdmin();
  } catch {
    return NextResponse.json({ error: "다운로드 비활성: SERVICE_ROLE_KEY 없음" }, { status: 503 });
  }
  const signed = await admin.storage.from(BUCKET).createSignedUrl(data.pdf_path, 60);
  if (signed.error || !signed.data) {
    return NextResponse.json({ error: "서명 URL 생성 실패" }, { status: 500 });
  }
  return NextResponse.redirect(signed.data.signedUrl);
}
