// ─────────────────────────────────────────────────────────────
// 대폐차 확인서 단건 API
//   GET    : 단건 전체 조회(items 포함) — 수정 화면 로딩용
//   PUT    : 수정(새 PDF + meta + modified_by 필수) → updated_at 갱신
//   DELETE : 휴지통 이동(soft). ?hard=1 이면 영구삭제(스토리지 파일 포함)
//   PATCH  : 휴지통에서 복원(deleted_at=null)
// 쓰기는 service_role 키로만 처리(서버 전용).
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
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
        { error: "쓰기 기능 비활성: 서버에 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다." },
        { status: 503 },
      ),
    };
  }
}

// 단건 전체 조회(수정 화면용)
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("daepyecha_confirmations")
    .select("*")
    .eq("id", params.id)
    .single();
  if (error || !data) return NextResponse.json({ error: "기록 없음" }, { status: 404 });
  return NextResponse.json({ row: data });
}

// 수정 (PDF 재생성 + 메타 갱신, 수정자명 필수)
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

  // 기존 pdf_path 확인
  const { data: cur, error: curErr } = await sb!
    .from("daepyecha_confirmations")
    .select("pdf_path")
    .eq("id", params.id)
    .single();
  if (curErr || !cur) return NextResponse.json({ error: "기록 없음" }, { status: 404 });

  // PDF 교체(같은 경로 upsert)
  const bytes = new Uint8Array(await pdf.arrayBuffer());
  const up = await sb!.storage
    .from(BUCKET)
    .upload(cur.pdf_path, bytes, { contentType: "application/pdf", upsert: true });
  if (up.error) {
    return NextResponse.json({ error: `PDF 업로드 실패: ${up.error.message}` }, { status: 500 });
  }

  const { error } = await sb!
    .from("daepyecha_confirmations")
    .update({
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
      modified_by: String(meta.modified_by).trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: `수정 실패: ${error.message}` }, { status: 500 });

  // Teams 자동 업로드(수정본, 이메일 릴레이). 실패해도 저장은 성공 처리.
  await relayPdf({
    fileName: pdfFileName(String(meta.operator ?? ""), String(meta.issued_date ?? ""), Boolean(meta.tagless)),
    pdf: bytes,
    recordId: params.id,
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
    action: "updated",
  });

  return NextResponse.json({ id: params.id });
}

// 삭제: 기본은 휴지통 이동(soft), ?hard=1 이면 영구삭제
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { sb, err } = adminClient();
  if (err) return err;
  const hard = req.nextUrl.searchParams.get("hard") === "1";

  if (!hard) {
    const { error } = await sb!
      .from("daepyecha_confirmations")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", params.id);
    if (error) return NextResponse.json({ error: `삭제 실패: ${error.message}` }, { status: 500 });
    return NextResponse.json({ ok: true, trashed: true });
  }

  // 영구삭제: 스토리지 파일 → DB 행
  const { data: cur } = await sb!
    .from("daepyecha_confirmations")
    .select("pdf_path")
    .eq("id", params.id)
    .single();
  if (cur?.pdf_path) await sb!.storage.from(BUCKET).remove([cur.pdf_path]);
  const { error } = await sb!.from("daepyecha_confirmations").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: `영구삭제 실패: ${error.message}` }, { status: 500 });
  return NextResponse.json({ ok: true, deleted: true });
}

// 복원: 휴지통 → 정상
export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  const { sb, err } = adminClient();
  if (err) return err;
  const { error } = await sb!
    .from("daepyecha_confirmations")
    .update({ deleted_at: null })
    .eq("id", params.id);
  if (error) return NextResponse.json({ error: `복원 실패: ${error.message}` }, { status: 500 });
  return NextResponse.json({ ok: true, restored: true });
}
