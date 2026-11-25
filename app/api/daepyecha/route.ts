// ─────────────────────────────────────────────────────────────
// 대폐차 자재 지급확인서 API (공개 — 로그인 불필요)
//   GET           : 목록 조회 (?center= 필터)
//   POST          : 저장. multipart form-data { pdf: File, meta: JSON }
//                   → 서버 파일 저장(/app/data/files/daepyecha) + DB insert.
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { q, q1, jsonb, likeContains } from "@/lib/db";
import { putFile, removeFiles } from "@/lib/storage";
import { CENTER_CODE } from "@/lib/daepyecha/templates";
import { REGION_CODE } from "@/lib/checklist-regional/templates";
import { relayPdf, pdfFileName } from "@/lib/daepyecha/teams";

export const dynamic = "force-dynamic";

const BUCKET = "daepyecha";

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

// 목록 조회 (검색/기간/휴지통 필터)
//   ?center= 센터 / ?q= 운수사·차량번호 검색 / ?from=&to= 지급일 기간 / ?trashed=1 휴지통
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const center = sp.get("center");
  const search = (sp.get("q") ?? "").trim();
  const from = sp.get("from");
  const to = sp.get("to");
  const trashed = sp.get("trashed") === "1";
  // 수도권 = 'default', 대전·세종 = 'regional'
  const variant = sp.get("variant") || "default";

  const params: unknown[] = [variant];
  const where = ["variant = $1", trashed ? "deleted_at is not null" : "deleted_at is null"];
  const add = (sql: string, v: unknown) => {
    params.push(v);
    where.push(sql.replaceAll("$?", () => `$${params.length}`));
  };
  if (center) add("center = $?", center);
  if (search) add("(operator ilike $? or vehicle_numbers ilike $?)", likeContains(search));
  if (from) add("issued_date >= $?", from);
  if (to) add("issued_date <= $?", to);

  try {
    const rows = await q(
      `select id, center, operator, office_type, model, purpose, tagless, vehicle_count, vehicle_numbers,
              receiver_name, transferor_name, issued_date, pdf_path, created_at, updated_at, modified_by, deleted_at
         from daepyecha_confirmations
        where ${where.join(" and ")}
        order by created_at desc
        limit 500`,
      params,
    );
    return NextResponse.json({ rows });
  } catch (e) {
    return NextResponse.json({ error: `조회 실패: ${msg(e)}` }, { status: 500 });
  }
}

// 저장
export async function POST(req: NextRequest) {
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

  try {
    await putFile(BUCKET, path, bytes);
  } catch (e) {
    return NextResponse.json({ error: `PDF 업로드 실패: ${msg(e)}` }, { status: 500 });
  }

  // 팀즈 업로드 파일명(수도권은 jpg) — DB에 보관해 수정 시 이전 파일 삭제에 사용.
  const jpgFile = form.get("jpg");
  const hasJpg = jpgFile instanceof File;
  const relayBytes = hasJpg ? new Uint8Array(await jpgFile.arrayBuffer()) : bytes;
  const baseName = pdfFileName(String(meta.operator ?? ""), String(meta.issued_date ?? ""), Boolean(meta.tagless), String(meta.vehicle_numbers ?? ""), Number(meta.vehicle_count ?? 0));
  const relayName = hasJpg ? baseName.replace(/\.pdf$/i, ".jpg") : baseName;

  let saved: { id: string } | null;
  try {
    saved = await q1<{ id: string }>(
      `insert into daepyecha_confirmations
         (id, center, operator, office_type, model, purpose, tagless, vehicle_count, vehicle_numbers, items, etc,
          receiver_name, transferor_name, receiver_sig, transferor_sig, issued_date, pdf_path, teams_file, variant)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       returning id`,
      [
        id,
        meta.center,
        meta.operator,
        meta.office_type ?? "",
        meta.model,
        meta.purpose ?? "대폐차",
        meta.tagless ?? false,
        meta.vehicle_count ?? 0,
        meta.vehicle_numbers ?? "",
        jsonb(meta.items ?? []),
        meta.etc ?? "",
        meta.receiver_name ?? "",
        meta.transferor_name ?? "",
        meta.receiver_sig ?? null,
        meta.transferor_sig ?? null,
        meta.issued_date,
        path,
        relayName,
        meta.variant === "regional" ? "regional" : "default",
      ],
    );
  } catch (e) {
    await removeFiles(BUCKET, [path]); // 롤백
    return NextResponse.json({ error: `저장 실패: ${msg(e)}` }, { status: 500 });
  }

  // Teams 자동 업로드(이메일 릴레이). 실패해도 저장은 성공 처리.
  await relayPdf({
    fileName: relayName,
    pdf: relayBytes,
    contentType: hasJpg ? "image/jpeg" : "application/pdf",
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

  return NextResponse.json({ id: saved?.id ?? id });
}
