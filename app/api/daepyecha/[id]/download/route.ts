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
    .select("pdf_path, operator, issued_date, tagless")
    .eq("id", params.id)
    .single();
  if (error || !data) return NextResponse.json({ error: "기록 없음" }, { status: 404 });

  let admin;
  try {
    admin = getSupabaseAdmin();
  } catch {
    return NextResponse.json({ error: "다운로드 비활성: SERVICE_ROLE_KEY 없음" }, { status: 503 });
  }
  // 저장 파일명: "(태그리스)운수사명 자재지급확인서_날짜.pdf" (파일명 사용 불가 문자만 정리)
  const safe = (s: string) => s.replace(/[\\/:*?"<>|]/g, "").trim();
  const prefix = data.tagless ? "(태그리스)" : "";
  const filename = `${prefix}${safe(data.operator || "확인서")} 자재지급확인서_${data.issued_date || ""}`.trim() + ".pdf";

  // 파일 바이트를 직접 받아 우리 응답으로 스트리밍한다.
  // (Supabase signed URL 의 download 옵션은 한글 파일명을 %EC… 로 깨뜨림)
  const dl = await admin.storage.from(BUCKET).download(data.pdf_path);
  if (dl.error || !dl.data) {
    return NextResponse.json({ error: "파일 다운로드 실패" }, { status: 500 });
  }

  const buf = await dl.data.arrayBuffer();
  const ascii = filename.replace(/[^\x20-\x7E]/g, "_"); // 구형 브라우저용 폴백
  const encoded = encodeURIComponent(filename);
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`,
    },
  });
}
