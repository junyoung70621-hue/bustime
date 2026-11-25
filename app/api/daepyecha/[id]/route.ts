// ─────────────────────────────────────────────────────────────
// 대폐차 확인서 단건 API
//   GET    : 단건 전체 조회(items 포함) — 수정 화면 로딩용
//   PUT    : 수정(새 PDF + meta + modified_by 필수) → updated_at 갱신
//   DELETE : 휴지통 이동(soft). ?hard=1 이면 영구삭제(서버 파일 포함)
//   PATCH  : 휴지통에서 복원(deleted_at=null)
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { q, q1, jsonb, isUuid } from "@/lib/db";
import { putFile, removeFiles } from "@/lib/storage";
import { relayPdf, pdfFileName } from "@/lib/daepyecha/teams";

export const dynamic = "force-dynamic";

const BUCKET = "daepyecha";

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));
const notFound = () => NextResponse.json({ error: "기록 없음" }, { status: 404 });
const badId = () => NextResponse.json({ error: "잘못된 id" }, { status: 400 });

// 단건 전체 조회(수정 화면용)
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!isUuid(params.id)) return notFound();
  const row = await q1("select * from daepyecha_confirmations where id = $1", [params.id]).catch(() => null);
  if (!row) return notFound();
  return NextResponse.json({ row });
}

// 수정 (PDF 재생성 + 메타 갱신, 수정자명 필수)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isUuid(params.id)) return notFound();

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

  // 기존 pdf_path + 이전 팀즈 파일명 확인
  const cur = await q1<{ pdf_path: string; teams_file: string | null }>(
    "select pdf_path, teams_file from daepyecha_confirmations where id = $1",
    [params.id],
  ).catch(() => null);
  if (!cur) return notFound();

  const bytes = new Uint8Array(await pdf.arrayBuffer());
  // 같은 경로 덮어쓰기(upsert)는 스토리지/CDN 캐시가 옛 PDF를 계속 제공해 수정이 반영 안 됨.
  // → 매 수정마다 새 경로로 올리고 옛 파일을 지운다(캐시 충돌 원천 차단).
  const dir = cur.pdf_path.split("/").slice(0, -1).join("/");
  const newPath = `${dir ? `${dir}/` : ""}${params.id}-${crypto.randomUUID().slice(0, 8)}.pdf`;
  try {
    await putFile(BUCKET, newPath, bytes);
  } catch (e) {
    return NextResponse.json({ error: `PDF 업로드 실패: ${msg(e)}` }, { status: 500 });
  }

  // 새 팀즈 파일명(수도권은 jpg) — 갱신 후 DB에 보관.
  const jpgFile = form.get("jpg");
  const hasJpg = jpgFile instanceof File;
  const relayBytes = hasJpg ? new Uint8Array(await jpgFile.arrayBuffer()) : bytes;
  const baseName = pdfFileName(String(meta.operator ?? ""), String(meta.issued_date ?? ""), Boolean(meta.tagless), String(meta.vehicle_numbers ?? ""), Number(meta.vehicle_count ?? 0));
  const relayName = hasJpg ? baseName.replace(/\.pdf$/i, ".jpg") : baseName;

  try {
    await q(
      `update daepyecha_confirmations set
         center=$2, operator=$3, office_type=$4, model=$5, purpose=$6, tagless=$7, vehicle_count=$8,
         vehicle_numbers=$9, items=$10::jsonb, etc=$11, receiver_name=$12, transferor_name=$13,
         receiver_sig=$14, transferor_sig=$15, issued_date=$16, pdf_path=$17, teams_file=$18,
         modified_by=$19, updated_at=now()
       where id=$1`,
      [
        params.id,
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
        newPath,
        relayName,
        String(meta.modified_by).trim(),
      ],
    );
  } catch (e) {
    // DB 갱신 실패 시 새로 올린 파일은 고아 → 정리하고 옛 파일/경로 유지.
    await removeFiles(BUCKET, [newPath]);
    return NextResponse.json({ error: `수정 실패: ${msg(e)}` }, { status: 500 });
  }
  // 갱신 성공 → 옛 PDF 삭제(실패해도 비차단).
  if (cur.pdf_path && cur.pdf_path !== newPath) await removeFiles(BUCKET, [cur.pdf_path]).catch(() => {});

  // Teams 자동 업로드(수정본, 이메일 릴레이). 실패해도 저장은 성공 처리.
  // replaceFile = 이전 파일명 → 플로우가 그 파일 삭제 후 새 파일 업로드.
  await relayPdf({
    fileName: relayName,
    pdf: relayBytes,
    contentType: hasJpg ? "image/jpeg" : "application/pdf",
    replaceFile: cur.teams_file ?? undefined,
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
  if (!isUuid(params.id)) return badId();
  const hard = req.nextUrl.searchParams.get("hard") === "1";

  try {
    if (!hard) {
      await q("update daepyecha_confirmations set deleted_at = now() where id = $1", [params.id]);
      return NextResponse.json({ ok: true, trashed: true });
    }
    // 영구삭제: 파일 → DB 행
    const cur = await q1<{ pdf_path: string }>("select pdf_path from daepyecha_confirmations where id = $1", [params.id]);
    if (cur?.pdf_path) await removeFiles(BUCKET, [cur.pdf_path]);
    await q("delete from daepyecha_confirmations where id = $1", [params.id]);
    return NextResponse.json({ ok: true, deleted: true });
  } catch (e) {
    return NextResponse.json({ error: `${hard ? "영구삭제" : "삭제"} 실패: ${msg(e)}` }, { status: 500 });
  }
}

// 복원: 휴지통 → 정상
export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!isUuid(params.id)) return badId();
  try {
    await q("update daepyecha_confirmations set deleted_at = null where id = $1", [params.id]);
    return NextResponse.json({ ok: true, restored: true });
  } catch (e) {
    return NextResponse.json({ error: `복원 실패: ${msg(e)}` }, { status: 500 });
  }
}
