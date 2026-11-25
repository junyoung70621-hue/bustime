// ─────────────────────────────────────────────────────────────
// 대폐차 확인서 PDF 다운로드 (공개)
//   GET /api/daepyecha/[id]/download
//   → DB에서 pdf_path 조회 → 서버 파일을 읽어 한글 파일명으로 응답
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { q1, isUuid } from "@/lib/db";
import { getFile } from "@/lib/storage";

export const dynamic = "force-dynamic";

const BUCKET = "daepyecha";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const data = isUuid(params.id)
    ? await q1<{ pdf_path: string; operator: string; issued_date: string; tagless: boolean }>(
        "select pdf_path, operator, issued_date, tagless from daepyecha_confirmations where id = $1",
        [params.id],
      ).catch(() => null)
    : null;
  if (!data) return NextResponse.json({ error: "기록 없음" }, { status: 404 });
  // 저장 파일명: "(태그리스)운수사명 자재지급확인서_날짜.pdf" (파일명 사용 불가 문자만 정리)
  const safe = (s: string) => s.replace(/[\\/:*?"<>|]/g, "").trim();
  const prefix = data.tagless ? "(태그리스)" : "";
  const filename = `${prefix}${safe(data.operator || "확인서")} 자재지급확인서_${data.issued_date || ""}`.trim() + ".pdf";

  const buf = await getFile(BUCKET, data.pdf_path).catch(() => null);
  if (!buf) {
    return NextResponse.json({ error: "파일 다운로드 실패" }, { status: 500 });
  }
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
