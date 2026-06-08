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

// 목록 조회
export async function GET(req: NextRequest) {
  const center = req.nextUrl.searchParams.get("center");
  const sb = getSupabase();
  let query = sb
    .from("daepyecha_confirmations")
    .select(
      "id, center, operator, model, purpose, vehicle_count, vehicle_numbers, receiver_name, transferor_name, issued_date, pdf_path, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(500);
  if (center) query = query.eq("center", center);
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
  const code = (CENTER_CODE as Record<string, string>)[String(meta.center)] ?? "etc";
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
      model: meta.model,
      purpose: meta.purpose ?? "대폐차",
      vehicle_count: meta.vehicle_count ?? 0,
      vehicle_numbers: meta.vehicle_numbers ?? "",
      items: meta.items ?? [],
      receiver_name: meta.receiver_name ?? "",
      transferor_name: meta.transferor_name ?? "",
      issued_date: meta.issued_date,
      pdf_path: path,
    })
    .select("id")
    .single();

  if (error) {
    await sb!.storage.from(BUCKET).remove([path]); // 롤백
    return NextResponse.json({ error: `저장 실패: ${error.message}` }, { status: 500 });
  }
  return NextResponse.json({ id: data.id });
}
