// ─────────────────────────────────────────────────────────────
// 선택 확인서 여러 건 ZIP 다운로드
//   POST /api/daepyecha/download-zip  body: { ids: string[] }
//   → 각 PDF를 서버 파일에서 읽어 "운수사명 날짜.pdf"로 ZIP 묶어 반환
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { q, isUuid } from "@/lib/db";
import { getFile } from "@/lib/storage";

export const dynamic = "force-dynamic";

const BUCKET = "daepyecha";

const safe = (s: string) => s.replace(/[\\/:*?"<>|]/g, "").trim();

export async function POST(req: NextRequest) {
  let body: { ids?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "본문 JSON 오류" }, { status: 400 });
  }
  const ids = Array.isArray(body.ids) ? body.ids.filter((x): x is string => typeof x === "string" && isUuid(x)) : [];
  if (ids.length === 0) return NextResponse.json({ error: "선택된 항목이 없습니다." }, { status: 400 });

  let rows: { id: string; operator: string; issued_date: string; pdf_path: string; tagless: boolean }[];
  try {
    rows = await q(
      "select id, operator, issued_date, pdf_path, tagless from daepyecha_confirmations where id = any($1::uuid[])",
      [ids],
    );
  } catch (e) {
    return NextResponse.json({ error: `조회 실패: ${e instanceof Error ? e.message : e}` }, { status: 500 });
  }
  if (rows.length === 0) return NextResponse.json({ error: "기록 없음" }, { status: 404 });

  const zip = new JSZip();
  const used = new Set<string>();
  for (const r of rows) {
    const buf = await getFile(BUCKET, r.pdf_path).catch(() => null);
    if (!buf) continue;
    const px = r.tagless ? "(태그리스)" : "";
    let name = `${px}${safe(r.operator || "확인서")} 자재지급확인서_${r.issued_date || ""}`.trim() + ".pdf";
    // 동일 파일명 충돌 방지
    let n = 2;
    while (used.has(name)) name = `${px}${safe(r.operator || "확인서")} 자재지급확인서_${r.issued_date || ""} (${n++}).pdf`;
    used.add(name);
    zip.file(name, buf);
  }

  const out = await zip.generateAsync({ type: "arraybuffer" });
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(out, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="daepyecha_${stamp}.zip"`,
    },
  });
}
