// ─────────────────────────────────────────────────────────────
// 체크리스트 단건 API
//   GET    : 단건 전체(data 포함) — 수정 화면 로딩
//   PUT    : 수정(새 PDF + meta + modified_by 필수) → updated_at 갱신
//   DELETE : 휴지통(soft). ?hard=1 영구삭제(파일 포함)
//   PATCH  : 복원
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { sendRelayMail, checklistFileName } from "@/lib/daepyecha/teams";

export const dynamic = "force-dynamic";
const BUCKET = "checklist";

function adminClient() {
  try {
    return { sb: getSupabaseAdmin(), err: null as NextResponse | null };
  } catch {
    return {
      sb: null,
      err: NextResponse.json({ error: "쓰기 기능 비활성: SUPABASE_SERVICE_ROLE_KEY 없음" }, { status: 503 }),
    };
  }
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const sb = getSupabase();
  const { data, error } = await sb.from("checklist_confirmations").select("*").eq("id", params.id).single();
  if (error || !data) return NextResponse.json({ error: "기록 없음" }, { status: 404 });
  return NextResponse.json({ row: data });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { sb, err } = adminClient();
  if (err) return err;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "form-data 파싱 실패" }, { status: 400 });
  }
  const pdf = form.get("pdf");
  const metaRaw = form.get("meta");
  if (!(pdf instanceof File) || typeof metaRaw !== "string") {
    return NextResponse.json({ error: "pdf 또는 meta 누락" }, { status: 400 });
  }
  let meta: Record<string, unknown>;
  try {
    meta = JSON.parse(metaRaw);
  } catch {
    return NextResponse.json({ error: "meta JSON 오류" }, { status: 400 });
  }
  if (!String(meta.modified_by ?? "").trim()) {
    return NextResponse.json({ error: "수정자명을 입력하세요." }, { status: 400 });
  }

  const { data: cur, error: curErr } = await sb!
    .from("checklist_confirmations")
    .select("pdf_path")
    .eq("id", params.id)
    .single();
  if (curErr || !cur) return NextResponse.json({ error: "기록 없음" }, { status: 404 });

  const bytes = new Uint8Array(await pdf.arrayBuffer());
  const up = await sb!.storage.from(BUCKET).upload(cur.pdf_path, bytes, { contentType: "application/pdf", upsert: true });
  if (up.error) return NextResponse.json({ error: `PDF 업로드 실패: ${up.error.message}` }, { status: 500 });

  const { error } = await sb!
    .from("checklist_confirmations")
    .update({
      center: meta.center,
      operator: meta.operator,
      model: meta.model,
      install_date: meta.install_date || null,
      vehicle_numbers: meta.vehicle_numbers ?? "",
      installer_name: meta.installer_name ?? "",
      operator_signer_name: meta.operator_signer_name ?? "",
      data: meta.data ?? {},
      modified_by: String(meta.modified_by).trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id);
  if (error) return NextResponse.json({ error: `수정 실패: ${error.message}` }, { status: 500 });

  // Teams 자동 업로드(이메일 릴레이) — 수정본.
  const center = String(meta.center ?? "");
  const operator = String(meta.operator ?? "");
  const installDate = String(meta.install_date ?? "");
  const tagless = Boolean(meta.tagless);
  const regional = meta.variant === "regional";
  await sendRelayMail({
    subject: `대폐차|${center}|${operator}|${installDate}`,
    text:
      `설치완료 체크리스트${regional ? "(지역)" : tagless ? "(태그리스)" : ""} (수정본)\n` +
      `센터: ${center}\n운수사: ${operator}\n모델: ${String(meta.model ?? "")}\n` +
      `설치일: ${installDate}\n차량: ${String(meta.vehicle_numbers ?? "")}\n` +
      `설치자: ${String(meta.installer_name ?? "")}\nID: ${params.id}`,
    fileName: checklistFileName(operator, installDate, tagless),
    pdf: bytes,
  });

  return NextResponse.json({ id: params.id });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { sb, err } = adminClient();
  if (err) return err;
  const hard = req.nextUrl.searchParams.get("hard") === "1";

  if (!hard) {
    const { error } = await sb!
      .from("checklist_confirmations")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", params.id);
    if (error) return NextResponse.json({ error: `삭제 실패: ${error.message}` }, { status: 500 });
    return NextResponse.json({ ok: true, trashed: true });
  }

  const { data: cur } = await sb!.from("checklist_confirmations").select("pdf_path").eq("id", params.id).single();
  if (cur?.pdf_path) await sb!.storage.from(BUCKET).remove([cur.pdf_path]);
  const { error } = await sb!.from("checklist_confirmations").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: `영구삭제 실패: ${error.message}` }, { status: 500 });
  return NextResponse.json({ ok: true, deleted: true });
}

export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  const { sb, err } = adminClient();
  if (err) return err;
  const { error } = await sb!.from("checklist_confirmations").update({ deleted_at: null }).eq("id", params.id);
  if (error) return NextResponse.json({ error: `복원 실패: ${error.message}` }, { status: 500 });
  return NextResponse.json({ ok: true, restored: true });
}
