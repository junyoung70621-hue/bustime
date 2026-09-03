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
import { sendRelayMail, sendIncheonTeamsMessage, checklistFileName, gongyongFileName } from "@/lib/daepyecha/teams";
import { uploadCapturePublic, CAPTURE_BUCKET } from "@/lib/daepyecha/capture";
import { relayUploadedPhotos, normalizePhotoRefs } from "@/lib/daepyecha/photoRelay";

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
    .select("pdf_path, teams_file")
    .eq("id", params.id)
    .single();
  if (curErr || !cur) return NextResponse.json({ error: "기록 없음" }, { status: 404 });

  const bytes = new Uint8Array(await pdf.arrayBuffer());
  // 같은 경로 덮어쓰기(upsert)는 스토리지/CDN 캐시가 옛 PDF를 계속 제공해 수정이 반영 안 됨.
  // → 매 수정마다 새 경로로 올리고 옛 파일을 지운다(캐시 충돌 원천 차단).
  const dir = cur.pdf_path.split("/").slice(0, -1).join("/");
  const newPath = `${dir ? `${dir}/` : ""}${params.id}-${crypto.randomUUID().slice(0, 8)}.pdf`;
  const up = await sb!.storage.from(BUCKET).upload(newPath, bytes, { contentType: "application/pdf", upsert: false });
  if (up.error) return NextResponse.json({ error: `PDF 업로드 실패: ${up.error.message}` }, { status: 500 });

  // 팀즈 업로드 메타/파일명 — 갱신 후 DB에 보관.
  const center = String(meta.center ?? "");
  const operator = String(meta.operator ?? "");
  const installDate = String(meta.install_date ?? "");
  const tagless = Boolean(meta.tagless);
  const variant = String(meta.variant ?? "default");
  const isConfirmDoc = variant === "gongyong" || variant === "gosi";
  const docLabel = String(meta.doc_label || "설치확인서");
  const docName = isConfirmDoc ? docLabel : `설치완료 체크리스트${variant === "regional" ? "(지역)" : tagless ? "(태그리스)" : ""}`;
  // 수도권 체크리스트 모달은 jpg도 함께 전송 → 팀즈에는 JPG로 업로드(보관본은 PDF 유지).
  const jpgFile = form.get("jpg");
  const hasJpg = jpgFile instanceof File;
  const relayBytes = hasJpg ? new Uint8Array(await jpgFile.arrayBuffer()) : bytes;
  const vehNo = String(meta.vehicle_numbers ?? "");
  // 설치확인서는 차량 여러 대일 수 있어 대수로 표기, 체크리스트(단일)는 차량번호 유지
  const vehCount = vehNo.split(",").map((s) => s.trim()).filter(Boolean).length;
  const baseName = isConfirmDoc ? gongyongFileName(operator, installDate, docLabel, vehCount) : checklistFileName(operator, installDate, tagless, vehNo);
  const relayName = hasJpg ? baseName.replace(/\.pdf$/i, ".jpg") : baseName;

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
      pdf_path: newPath,
      teams_file: relayName,
      modified_by: String(meta.modified_by).trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id);
  if (error) {
    // DB 갱신 실패 시 새로 올린 파일은 고아 → 정리하고 옛 파일/경로 유지.
    await sb!.storage.from(BUCKET).remove([newPath]);
    return NextResponse.json({ error: `수정 실패: ${error.message}` }, { status: 500 });
  }
  // 갱신 성공 → 옛 PDF 삭제(실패해도 비차단).
  if (cur.pdf_path && cur.pdf_path !== newPath) await sb!.storage.from(BUCKET).remove([cur.pdf_path]);

  // 수도권/인천 캡쳐(JPG) 공개 URL 갱신(같은 id로 덮어써 최신 캡쳐 유지, 실패해도 비차단).
  const inlineThread = variant === "default" || variant === "incheon";
  const captureUrl = hasJpg && inlineThread ? await uploadCapturePublic(sb!, params.id, relayBytes) : "";

  // Teams 자동 업로드(이메일 릴레이) — 수정본.
  // replaceFile = 이전 파일명 → 플로우가 그 파일 삭제 후 새 파일 업로드.
  //   수도권/인천은 캡션(첫 줄)+IMG 줄을 넣어 스레드 게시/인라인 이미지가 신규와 동일하게 동작.
  const caption = inlineThread ? `${operator}_${vehNo}_대폐차_${installDate} 설치완료\n` : "";
  await sendRelayMail({
    subject: `대폐차|${center}|${operator}|${installDate}`,
    text:
      caption +
      (captureUrl ? `IMG:${captureUrl}\n` : "") +
      `${docName} (수정본)\n` +
      `센터: ${center}\n운수사: ${operator}\n모델: ${String(meta.model ?? "")}\n` +
      `설치일: ${installDate}\n차량: ${String(meta.vehicle_numbers ?? "")}\n` +
      `설치자: ${String(meta.installer_name ?? "")}\nID: ${params.id}`,
    fileName: relayName,
    pdf: relayBytes,
    contentType: hasJpg ? "image/jpeg" : "application/pdf",
    action: "updated",
    replaceFile: cur.teams_file ?? undefined,
  });

  // 인천 체크리스트는 Power Automate 웹훅으로 팀즈 채널 메시지도 게시(수정본, 실패해도 비차단).
  if (variant === "incheon") {
    await sendIncheonTeamsMessage({
      operator,
      model: String(meta.model ?? ""),
      installDate,
      vehicleNo: vehNo,
      installer: String(meta.installer_name ?? ""),
      action: "updated",
      imageUrl: captureUrl || undefined,
    });
  }

  // 증빙사진 재첨부(수도권·인천) — 수정 시 사진을 다시 올린 경우에만 동작.
  if (variant === "default" || variant === "incheon") {
    await relayUploadedPhotos(sb!, normalizePhotoRefs(meta.photos_upload), {
      center,
      operator,
      vehicleNo: vehNo,
      installDate,
    });
  }

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
  // 공개 캡쳐(있으면)도 정리 — 고아 파일 방지. 없는 경로는 무시됨.
  await sb!.storage.from(CAPTURE_BUCKET).remove([`${params.id}.jpg`]);
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
