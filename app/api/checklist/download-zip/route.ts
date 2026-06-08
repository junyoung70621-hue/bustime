// ─────────────────────────────────────────────────────────────
// 체크리스트 여러 건 ZIP 다운로드  POST { ids: string[] }
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
const BUCKET = "checklist";
const safe = (s: string) => s.replace(/[\\/:*?"<>|]/g, "").trim();

export async function POST(req: NextRequest) {
  let sb;
  try {
    sb = getSupabaseAdmin();
  } catch {
    return NextResponse.json({ error: "다운로드 비활성: SUPABASE_SERVICE_ROLE_KEY 없음" }, { status: 503 });
  }

  let body: { ids?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "본문 JSON 오류" }, { status: 400 });
  }
  const ids = Array.isArray(body.ids) ? body.ids.filter((x): x is string => typeof x === "string") : [];
  if (ids.length === 0) return NextResponse.json({ error: "선택된 항목이 없습니다." }, { status: 400 });

  const { data: rows, error } = await sb
    .from("checklist_confirmations")
    .select("id, operator, install_date, pdf_path")
    .in("id", ids);
  if (error) return NextResponse.json({ error: `조회 실패: ${error.message}` }, { status: 500 });
  if (!rows || rows.length === 0) return NextResponse.json({ error: "기록 없음" }, { status: 404 });

  const zip = new JSZip();
  const used = new Set<string>();
  for (const r of rows) {
    const dl = await sb.storage.from(BUCKET).download(r.pdf_path);
    if (dl.error || !dl.data) continue;
    const buf = new Uint8Array(await dl.data.arrayBuffer());
    let name = `${safe(r.operator || "체크리스트")} 설치완료체크리스트_${r.install_date || ""}`.trim() + ".pdf";
    let n = 2;
    while (used.has(name)) name = `${safe(r.operator || "체크리스트")} 설치완료체크리스트_${r.install_date || ""} (${n++}).pdf`;
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
