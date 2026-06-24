// ─────────────────────────────────────────────────────────────
// Teams 자동 업로드 (이메일 릴레이 방식, Power Automate 무료 트리거용)
//   서버에서 PDF 저장 직후 → 지정 메일함으로 PDF 첨부 메일 발송
//   → Power Automate "새 메일 도착 시(무료)" 플로우가 첨부를 Teams 폴더에 저장.
//   제목 형식: "대폐차|{센터}|{운수사}|{지급일}"  (플로우에서 split('|')으로 센터 추출)
//   env 미설정 시 자동 비활성(저장에는 영향 없음).
//     SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS
//     RELAY_MAIL_FROM(보내는 주소), RELAY_MAIL_TO(받는 메일함=플로우가 감시)
// ─────────────────────────────────────────────────────────────
import nodemailer from "nodemailer";

const safeName = (s: string) => s.replace(/[\\/:*?"<>|]/g, "").trim();
// 대수 표기: 1대 이상이면 "(N대)", 아니면 빈 문자열(파일명에서 생략)
const countTag = (count: number) => (count > 0 ? `(${count}대)` : "");

/** 자재 파일명: "자재지급확인서 운수사명 (N대) 날짜.pdf"(태그리스만 접두).
 *  차량번호는 여러 대일 수 있어 운수사명 뒤 대수로 표기. */
export function pdfFileName(operator: string, issuedDate: string, tagless = false, count = 0): string {
  const prefix = tagless ? "(태그리스)" : "";
  const parts = ["자재지급확인서", safeName(operator), countTag(count), issuedDate || ""].filter(Boolean);
  return `${prefix}${parts.join(" ")}.pdf`;
}

/** 체크리스트 파일명: "설치완료체크리스트 운수사명 차량번호 날짜.pdf"(태그리스만 접두).
 *  체크리스트는 단일 차량 → 차량번호 표기 유지. */
export function checklistFileName(operator: string, installDate: string, tagless = false, vehicleNumbers = ""): string {
  const prefix = tagless ? "(태그리스)" : "";
  const parts = ["설치완료체크리스트", safeName(operator), safeName(vehicleNumbers), installDate || ""].filter(Boolean);
  return `${prefix}${parts.join(" ")}.pdf`;
}

/** 설치확인서(다차량 양식) 파일명: "{설치확인서|철수확인서} 운수사명 (N대) 날짜.pdf".
 *  차량번호는 여러 대일 수 있어 운수사명 뒤 대수로 표기. */
export function gongyongFileName(operator: string, installDate: string, docName = "설치확인서", count = 0): string {
  const parts = [docName, safeName(operator), countTag(count), installDate || ""].filter(Boolean);
  return `${parts.join(" ")}.pdf`;
}

/** 저수준: 지정 메일함으로 PDF 첨부 메일 발송(Teams 릴레이). 실패해도 throw하지 않음.
 *  제목 형식 "대폐차|{센터}|..." 를 그대로 쓰면 기존 플로우가 센터별 폴더로 저장. */
export async function sendRelayMail(opts: {
  subject: string;
  text: string;
  fileName: string;
  pdf: Uint8Array; // 첨부 바이트(PDF 또는 JPG)
  contentType?: string; // 기본 application/pdf, 팀즈 JPG 업로드 시 image/jpeg
  action?: "created" | "updated"; // 신규/수정 — 제목 끝에 표기
  replaceFile?: string; // 수정 시 삭제할 이전 파일명(플로우가 그 파일 삭제 후 재업로드)
}): Promise<void> {
  const host = process.env.SMTP_HOST;
  const to = process.env.RELAY_MAIL_TO;
  if (!host || !to) return; // 미설정 → 비활성

  // 제목 끝에 "|{new|update}|{이전파일명}" 추가(기존 split('|')[1]=센터 파싱과 호환).
  //   플로우: [4]="update" 이고 [5]가 있으면 그 파일을 삭제한 뒤 첨부 저장.
  const op = opts.action === "updated" ? "update" : "new";
  const subject = `${opts.subject}|${op}|${opts.replaceFile ?? ""}`;

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true", // 465=true, 587(STARTTLS)=false
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
    });
    await transporter.sendMail({
      from: process.env.RELAY_MAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      text: opts.text,
      attachments: [
        {
          filename: opts.fileName,
          content: Buffer.from(opts.pdf),
          contentType: opts.contentType || "application/pdf",
        },
      ],
    });
  } catch (e) {
    console.error("Teams 릴레이 메일 발송 실패:", e);
  }
}

export type RelayPayload = {
  fileName: string;
  pdf: Uint8Array; // 첨부 바이트(PDF 또는 JPG)
  contentType?: string; // 기본 application/pdf
  recordId: string;
  center: string;
  operator: string;
  officeType: string;
  model: string;
  purpose: string;
  issuedDate: string;
  vehicleNumbers: string;
  vehicleCount: number;
  action: "created" | "updated";
  replaceFile?: string; // 수정 시 삭제할 이전 파일명
};

/** PDF를 메일 첨부로 발송(Teams 릴레이). 실패해도 throw하지 않음(저장 비차단). */
export async function relayPdf(p: RelayPayload): Promise<void> {
  // 제목: 파이프 구분 → 플로우에서 split('|')[1] 로 센터 추출
  const subject = `대폐차|${p.center}|${p.operator}|${p.issuedDate}`;
  const text =
    `대폐차 자재 지급확인서 (${p.action === "updated" ? "수정본" : "신규"})\n` +
    `센터: ${p.center}\n운수사: ${p.operator} ${p.officeType}\n모델: ${p.model}\n` +
    `용도: ${p.purpose}\n지급일: ${p.issuedDate}\n` +
    `차량: ${p.vehicleCount}대 ${p.vehicleNumbers}\nID: ${p.recordId}`;
  await sendRelayMail({
    subject,
    text,
    fileName: p.fileName,
    pdf: p.pdf,
    contentType: p.contentType,
    action: p.action,
    replaceFile: p.replaceFile,
  });
}
