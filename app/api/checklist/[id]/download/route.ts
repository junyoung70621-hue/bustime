// ─────────────────────────────────────────────────────────────
// 체크리스트 PDF 다운로드: 서버 파일을 한글 파일명으로 응답 (파일명 "운수사 설치일.pdf")
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { q1, isUuid } from "@/lib/db";
import { getFile } from "@/lib/storage";

export const dynamic = "force-dynamic";
const BUCKET = "checklist";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const data = isUuid(params.id)
    ? await q1<{ pdf_path: string; operator: string; install_date: string | null; variant: string; teams_file: string | null }>(
        "select pdf_path, operator, install_date, variant, teams_file from checklist_confirmations where id = $1",
        [params.id],
      ).catch(() => null)
    : null;
  if (!data) return NextResponse.json({ error: "기록 없음" }, { status: 404 });

  const safe = (s: string) => s.replace(/[\\/:*?"<>|]/g, "").trim();
  // 공용/고시 탭은 설치확인서 계열 문서 — 팀즈 파일명 첫 단어(설치확인서/철수확인서 등)를 라벨로 사용.
  const isConfirmDoc = data.variant === "gongyong" || data.variant === "gosi";
  const label = isConfirmDoc ? (data.teams_file || "").split(" ")[0] || "설치확인서" : "설치완료체크리스트";
  const filename = `${safe(data.operator || "체크리스트")} ${label}_${data.install_date || ""}`.trim() + ".pdf";

  const buf = await getFile(BUCKET, data.pdf_path).catch(() => null);
  if (!buf) return NextResponse.json({ error: "파일 다운로드 실패" }, { status: 500 });

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
