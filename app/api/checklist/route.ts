// ─────────────────────────────────────────────────────────────
// 설치 완료 체크리스트 API (공개 — 로그인 불필요)
//   GET  : 목록(센터/검색/기간/휴지통 필터)
//   POST : 저장(multipart { pdf, meta }) → 비공개 버킷 업로드 + insert
// 쓰기는 service_role 키로만(서버 전용).
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { CENTER_CODE } from "@/lib/daepyecha/templates";
import { REGION_CODE } from "@/lib/checklist-regional/templates";
import { sendRelayMail, checklistFileName, gongyongFileName } from "@/lib/daepyecha/teams";

export const dynamic = "force-dynamic";
const BUCKET = "checklist";

function adminClient() {
  try {
    return { sb: getSupabaseAdmin(), err: null as NextResponse | null };
  } catch {
    return {
      sb: null,
      err: NextResponse.json(
        { error: "저장 기능 비활성: 서버에 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다." },
        { status: 503 },
      ),
    };
  }
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const center = sp.get("center");
  const q = (sp.get("q") ?? "").trim();
  const from = sp.get("from");
  const to = sp.get("to");
  const trashed = sp.get("trashed") === "1";
  // 기본 체크리스트 = 'default', 지역 체크리스트 = 'regional'
  const variant = sp.get("variant") || "default";

  const sb = getSupabase();
  let query = sb
    .from("checklist_confirmations")
    .select(
      "id, center, operator, model, install_date, vehicle_numbers, installer_name, operator_signer_name, pdf_path, created_at, updated_at, modified_by, deleted_at",
    )
    .eq("variant", variant)
    .order("created_at", { ascending: false })
    .limit(500);

  query = trashed ? query.not("deleted_at", "is", null) : query.is("deleted_at", null);
  if (center) query = query.eq("center", center);
  if (q) query = query.or(`operator.ilike.%${q}%,vehicle_numbers.ilike.%${q}%`);
  if (from) query = query.gte("install_date", from);
  if (to) query = query.lte("install_date", to);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: `조회 실패: ${error.message}` }, { status: 500 });
  return NextResponse.json({ rows: data ?? [] });
}

export async function POST(req: NextRequest) {
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
  for (const k of ["center", "model", "operator"]) {
    if (!meta[k]) return NextResponse.json({ error: `필수값 누락: ${k}` }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const codeMap = { ...CENTER_CODE, ...REGION_CODE } as Record<string, string>;
  const code = codeMap[String(meta.center)] ?? "etc";
  const path = `${code}/${id}.pdf`;
  const bytes = new Uint8Array(await pdf.arrayBuffer());

  const up = await sb!.storage.from(BUCKET).upload(path, bytes, { contentType: "application/pdf", upsert: false });
  if (up.error) return NextResponse.json({ error: `PDF 업로드 실패: ${up.error.message}` }, { status: 500 });

  const { data, error } = await sb!
    .from("checklist_confirmations")
    .insert({
      id,
      center: meta.center,
      operator: meta.operator,
      model: meta.model,
      install_date: meta.install_date || null,
      vehicle_numbers: meta.vehicle_numbers ?? "",
      installer_name: meta.installer_name ?? "",
      operator_signer_name: meta.operator_signer_name ?? "",
      data: meta.data ?? {},
      pdf_path: path,
      variant: meta.variant === "regional" || meta.variant === "gongyong" ? meta.variant : "default",
    })
    .select("id")
    .single();

  if (error) {
    await sb!.storage.from(BUCKET).remove([path]);
    return NextResponse.json({ error: `저장 실패: ${error.message}` }, { status: 500 });
  }

  // Teams 자동 업로드(이메일 릴레이). 제목 "대폐차|센터|..." → 기존 플로우가 센터별 폴더로 저장.
  const center = String(meta.center ?? "");
  const operator = String(meta.operator ?? "");
  const installDate = String(meta.install_date ?? "");
  const tagless = Boolean(meta.tagless);
  const gongyong = meta.variant === "gongyong";
  const regional = meta.variant === "regional";
  const docName = gongyong ? "설치확인서" : `설치완료 체크리스트${regional ? "(지역)" : tagless ? "(태그리스)" : ""}`;
  await sendRelayMail({
    subject: `대폐차|${center}|${operator}|${installDate}`,
    text:
      `${docName}\n` +
      `센터: ${center}\n운수사: ${operator}\n모델: ${String(meta.model ?? "")}\n` +
      `설치일: ${installDate}\n차량: ${String(meta.vehicle_numbers ?? "")}\n` +
      `설치자: ${String(meta.installer_name ?? "")}\nID: ${id}`,
    fileName: gongyong ? gongyongFileName(operator, installDate) : checklistFileName(operator, installDate, tagless),
    pdf: bytes,
  });

  return NextResponse.json({ id: data.id });
}
