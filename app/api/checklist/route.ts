// ─────────────────────────────────────────────────────────────
// 설치 완료 체크리스트 API (공개 — 로그인 불필요)
//   GET  : 목록(센터/검색/기간/휴지통 필터)
//   POST : 저장(multipart { pdf, meta }) → 서버 파일 저장 + insert
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { q, q1, jsonb, likeContains } from "@/lib/db";
import { putFile, removeFiles } from "@/lib/storage";
import { CENTER_CODE } from "@/lib/daepyecha/templates";
import { REGION_CODE } from "@/lib/checklist-regional/templates";
import { sendRelayMail, checklistFileName, gongyongFileName } from "@/lib/daepyecha/teams";
import { uploadCapturePublic } from "@/lib/daepyecha/capture";
import { relayUploadedPhotos, normalizePhotoRefs } from "@/lib/daepyecha/photoRelay";

export const dynamic = "force-dynamic";
const BUCKET = "checklist";

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const center = sp.get("center");
  const search = (sp.get("q") ?? "").trim();
  const from = sp.get("from");
  const to = sp.get("to");
  const trashed = sp.get("trashed") === "1";
  // 기본 체크리스트 = 'default', 지역 체크리스트 = 'regional'
  const variant = sp.get("variant") || "default";

  const params: unknown[] = [variant];
  const where = ["variant = $1", trashed ? "deleted_at is not null" : "deleted_at is null"];
  const add = (sql: string, v: unknown) => {
    params.push(v);
    where.push(sql.replaceAll("$?", () => `$${params.length}`));
  };
  if (center) add("center = $?", center);
  if (sp.get("tagless") === "1") where.push("data->>'tagless' = 'true'");
  if (search) add("(operator ilike $? or vehicle_numbers ilike $?)", likeContains(search));
  if (from) add("install_date >= $?", from);
  if (to) add("install_date <= $?", to);

  try {
    const rows = await q(
      `select id, center, operator, model, install_date, vehicle_numbers, installer_name, operator_signer_name,
              pdf_path, created_at, updated_at, modified_by, deleted_at
         from checklist_confirmations
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
  for (const k of ["center", "model", "operator"]) {
    if (!meta[k]) return NextResponse.json({ error: `필수값 누락: ${k}` }, { status: 400 });
  }

  const id = crypto.randomUUID();
  // 인천(B820)은 수도권 센터/지역 어디에도 없어 폴더 코드를 별도 지정(etc/ 폴백 방지).
  const codeMap = { ...CENTER_CODE, ...REGION_CODE, 인천: "incheon" } as Record<string, string>;
  const code = codeMap[String(meta.center)] ?? "etc";
  const path = `${code}/${id}.pdf`;
  const bytes = new Uint8Array(await pdf.arrayBuffer());

  try {
    await putFile(BUCKET, path, bytes);
  } catch (e) {
    return NextResponse.json({ error: `PDF 업로드 실패: ${msg(e)}` }, { status: 500 });
  }

  // 팀즈 업로드 메타/파일명 — DB에 보관해 수정 시 이전 파일 삭제에 사용.
  const center = String(meta.center ?? "");
  const operator = String(meta.operator ?? "");
  const installDate = String(meta.install_date ?? "");
  const tagless = Boolean(meta.tagless);
  const variant = String(meta.variant ?? "default");
  const isConfirmDoc = variant === "gongyong" || variant === "gosi"; // 설치확인서 계열(공용/포항/고속시외)
  const docLabel = String(meta.doc_label || "설치확인서"); // 설치확인서/철수확인서/고속시외 설치확인서
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

  try {
    await q1(
      `insert into checklist_confirmations
         (id, center, operator, model, install_date, vehicle_numbers, installer_name, operator_signer_name,
          data, pdf_path, teams_file, variant)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12)`,
      [
        id,
        meta.center,
        meta.operator,
        meta.model,
        meta.install_date || null,
        meta.vehicle_numbers ?? "",
        meta.installer_name ?? "",
        meta.operator_signer_name ?? "",
        jsonb(meta.data ?? {}),
        path,
        relayName,
        ["regional", "gongyong", "gosi", "incheon"].includes(String(meta.variant)) ? meta.variant : "default",
      ],
    );
  } catch (e) {
    await removeFiles(BUCKET, [path]);
    return NextResponse.json({ error: `저장 실패: ${msg(e)}` }, { status: 500 });
  }

  // DB 저장 완료 → 사용자에겐 바로 응답하고, Teams 릴레이(캡처·메일·증빙사진)는 응답 후 백그라운드로.
  //   릴레이 함수들은 실패해도 throw하지 않고, 사진 임시본은 릴레이 성공 시에만 삭제(기존과 동일).
  waitUntil(
    (async () => {
      const t0 = Date.now();
      // 수도권/인천 체크리스트는 캡쳐(JPG)를 공개 버킷에 올려 Teams 스레드 인라인 이미지용 공개 URL 확보(실패해도 비차단).
      const inlineThread = variant === "default" || variant === "incheon";
      const captureUrl = hasJpg && inlineThread ? await uploadCapturePublic(id, relayBytes) : "";

      // Teams 자동 업로드(이메일 릴레이). 제목 "대폐차|센터|..." → 기존 플로우가 센터별 폴더로 저장.
      // 수도권/인천 체크리스트는 본문 첫 줄에 스레드 게시용 캡션을 넣어 플로우가 그대로 채널 메시지로 사용.
      //   둘째 줄 "IMG:<공개URL>" → 플로우 B가 추출해 <img>로 인라인 게시.
      const caption = inlineThread ? `${operator}_${vehNo}_대폐차_${installDate} 설치완료\n` : "";
      await sendRelayMail({
        subject: `대폐차|${center}|${operator}|${installDate}`,
        text:
          caption +
          (captureUrl ? `IMG:${captureUrl}\n` : "") +
          `${docName}\n` +
          `센터: ${center}\n운수사: ${operator}\n모델: ${String(meta.model ?? "")}\n` +
          `설치일: ${installDate}\n차량: ${String(meta.vehicle_numbers ?? "")}\n` +
          `설치자: ${String(meta.installer_name ?? "")}\nID: ${id}`,
        fileName: relayName,
        pdf: relayBytes,
        contentType: hasJpg ? "image/jpeg" : "application/pdf",
        action: "created",
      });


      // 증빙사진 릴레이(수도권·인천) — 클라이언트가 /api/checklist/photos 로 올린 임시본을 읽어
      // 별도 메일/제목으로 사진/수도권/센터/운수사/차량번호 폴더에 저장 후 임시본 삭제.
      // 인천도 수도권 트리의 "인천" 센터 폴더로 동일하게 보관된다.
      if (variant === "default" || variant === "incheon") {
        await relayUploadedPhotos(normalizePhotoRefs(meta.photos_upload), {
          center,
          operator,
          vehicleNo: vehNo,
          installDate,
        });
      }
      console.log(`[checklist POST] 릴레이 완료 ${Date.now() - t0}ms id=${id}`);
    })().catch((e) => console.error("[checklist POST] 릴레이 오류:", e)),
  );

  return NextResponse.json({ id });
}
