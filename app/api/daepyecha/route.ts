// ─────────────────────────────────────────────────────────────
// 대폐차 자재 지급확인서 API (공개 — 로그인 불필요)
//   GET           : 목록 조회 (?center= 필터). anon RLS read.
//   POST          : 저장. multipart form-data { pdf: File, meta: JSON }
//                   → 비공개 버킷 업로드(service_role) + DB insert.
// 쓰기는 service_role 키로만 처리(서버 전용, 키 비노출).
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { CENTER_CODE } from "@/lib/daepyecha/templates";
import { REGION_CODE } from "@/lib/checklist-regional/templates";
import { relayPdf, pdfFileName } from "@/lib/daepyecha/teams";

export const dynamic = "force-dynamic";

const BUCKET = "daepyecha";

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

// 목록 조회 (검색/기간/휴지통 필터)
//   ?center= 센터 / ?q= 운수사·차량번호 검색 / ?from=&to= 지급일 기간 / ?trashed=1 휴지통
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const center = sp.get("center");
  const q = (sp.get("q") ?? "").trim();
  const from = sp.get("from");
  const to = sp.get("to");
  const trashed = sp.get("trashed") === "1";
  // 수도권 = 'default', 대전·세종 = 'regional'
  const variant = sp.get("variant") || "default";

  const sb = getSupabase();
  let query = sb
    .from("daepyecha_confirmations")
    .select(
      "id, center, operator, office_type, model, purpose, tagless, vehicle_count, vehicle_numbers, receiver_name, transferor_name, issued_date, pdf_path, created_at, updated_at, modified_by, deleted_at",
    )
    .eq("variant", variant)
    .order("created_at", { ascending: false })
    .limit(500);

  // 휴지통/정상 구분
  query = trashed ? query.not("deleted_at", "is", null) : query.is("deleted_at", null);

  if (center) query = query.eq("center", center);
  if (q) query = query.or(`operator.ilike.%${q}%,vehicle_numbers.ilike.%${q}%`);
  if (from) query = query.gte("issued_date", from);
  if (to) query = query.lte("issued_date", to);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: `조회 실패: ${error.message}` }, { status: 500 });
  return NextResponse.json({ rows: data ?? [] });
}

// 저장
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
  for (const k of ["center", "operator", "model", "issued_date"]) {
    if (!meta[k]) return NextResponse.json({ error: `필수값 누락: ${k}` }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const codeMap = { ...CENTER_CODE, ...REGION_CODE } as Record<string, string>;
  const code = codeMap[String(meta.center)] ?? "etc";
  const path = `${code}/${id}.pdf`; // Storage 키는 ASCII만 허용
  const bytes = new Uint8Array(await pdf.arrayBuffer());

  const up = await sb!.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: "application/pdf", upsert: false });
  if (up.error) {
    return NextResponse.json({ error: `PDF 업로드 실패: ${up.error.message}` }, { status: 500 });
  }

  const { data, error } = await sb!
    .from("daepyecha_confirmations")
    .insert({
      id,
      center: meta.center,
      operator: meta.operator,
      office_type: meta.office_type ?? "",
      model: meta.model,
      purpose: meta.purpose ?? "대폐차",
      tagless: meta.tagless ?? false,
      vehicle_count: meta.vehicle_count ?? 0,
      vehicle_numbers: meta.vehicle_numbers ?? "",
      items: meta.items ?? [],
      etc: meta.etc ?? "",
      receiver_name: meta.receiver_name ?? "",
      transferor_name: meta.transferor_name ?? "",
      receiver_sig: meta.receiver_sig ?? null,
      transferor_sig: meta.transferor_sig ?? null,
      issued_date: meta.issued_date,
      pdf_path: path,
      variant: meta.variant === "regional" ? "regional" : "default",
    })
    .select("id")
    .single();

  if (error) {
    await sb!.storage.from(BUCKET).remove([path]); // 롤백
    return NextResponse.json({ error: `저장 실패: ${error.message}` }, { status: 500 });
  }

  // Teams 자동 업로드(이메일 릴레이). 실패해도 저장은 성공 처리.
  await relayPdf({
    fileName: pdfFileName(String(meta.operator ?? ""), String(meta.issued_date ?? ""), Boolean(meta.tagless)),
    pdf: bytes,
    recordId: id,
    center: String(meta.center ?? ""),
    operator: String(meta.operator ?? ""),
    officeType: String(meta.office_type ?? ""),
    model: String(meta.model ?? ""),
    purpose: meta.tagless
      ? `${String(meta.purpose ?? "대폐차")}(태그리스)`
      : String(meta.purpose ?? "대폐차"),
    issuedDate: String(meta.issued_date ?? ""),
    vehicleNumbers: String(meta.vehicle_numbers ?? ""),
    vehicleCount: Number(meta.vehicle_count ?? 0),
    action: "created",
  });

  return NextResponse.json({ id: data.id });
}
