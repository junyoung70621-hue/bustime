// ─────────────────────────────────────────────────────────────
// 체크리스트 여러 건 ZIP 다운로드  POST { ids: string[] }
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { q, isUuid } from "@/lib/db";
import { getFile } from "@/lib/storage";

export const dynamic = "force-dynamic";
const BUCKET = "checklist";
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

  let rows: { id: string; operator: string; install_date: string | null; pdf_path: string; variant: string; teams_file: string | null }[];
  try {
    rows = await q(
      "select id, operator, install_date, pdf_path, variant, teams_file from checklist_confirmations where id = any($1::uuid[])",
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
    // 공용/고시 탭은 설치확인서 계열 문서 — 팀즈 파일명 첫 단어(설치확인서/철수확인서 등)를 라벨로 사용.
    const isConfirmDoc = r.variant === "gongyong" || r.variant === "gosi";
    const label = isConfirmDoc ? (r.teams_file || "").split(" ")[0] || "설치확인서" : "설치완료체크리스트";
    const base = `${safe(r.operator || "체크리스트")} ${label}_${r.install_date || ""}`.trim();
    let name = `${base}.pdf`;
    let n = 2;
    while (used.has(name)) name = `${base} (${n++}).pdf`;
    used.add(name);
    zip.file(name, buf);
  }

  const out = await zip.generateAsync({ type: "arraybuffer" });
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(out, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="checklist_${stamp}.zip"`,
    },
  });
}
