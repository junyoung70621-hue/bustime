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

  // 파일 바이트를 직접 받아 우리 응답으로 스트리밍한다.
  // (Supabase signed URL 의 download 옵션은 한글 파일명을 %EC… 로 깨뜨림)
  const dl = await admin.storage.from(BUCKET).download(data.pdf_path);
  if (dl.error || !dl.data) return NextResponse.json({ error: "파일 다운로드 실패" }, { status: 500 });

  const buf = await dl.data.arrayBuffer();
  const ascii = filename.replace(/[^\x20-\x7E]/g, "_"); // 구형 브라우저용 폴백
  const encoded = encodeURIComponent(filename);
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`,
      // 수정 후 옛 PDF가 브라우저 캐시로 보이지 않게.
      "Cache-Control": "no-store",
    },
  });
}
