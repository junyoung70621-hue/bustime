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

/** 파일명에 못 쓰는 문자 제거 후 "자재지급확인서 운수사명 날짜.pdf" 생성(태그리스만 접두) */
export function pdfFileName(operator: string, issuedDate: string, tagless = false): string {
  const prefix = tagless ? "(태그리스)" : "";
  const parts = ["자재지급확인서", safeName(operator), issuedDate || ""].filter(Boolean);
  return `${prefix}${parts.join(" ")}.pdf`;
}

/** 체크리스트 파일명: "설치완료체크리스트 운수사명 날짜.pdf"(태그리스만 접두) */
export function checklistFileName(operator: string, installDate: string, tagless = false): string {
  const prefix = tagless ? "(태그리스)" : "";
  const parts = ["설치완료체크리스트", safeName(operator), installDate || ""].filter(Boolean);
  return `${prefix}${parts.join(" ")}.pdf`;
}

/** 저수준: 지정 메일함으로 PDF 첨부 메일 발송(Teams 릴레이). 실패해도 throw하지 않음.
 *  제목 형식 "대폐차|{센터}|..." 를 그대로 쓰면 기존 플로우가 센터별 폴더로 저장. */
export async function sendRelayMail(opts: {
  subject: string;
  text: string;
  fileName: string;
  pdf: Uint8Array;
}): Promise<void> {
  const host = process.env.SMTP_HOST;
  const to = process.env.RELAY_MAIL_TO;
  if (!host || !to) return; // 미설정 → 비활성

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
      subject: opts.subject,
      text: opts.text,
      attachments: [
        { filename: opts.fileName, content: Buffer.from(opts.pdf), contentType: "application/pdf" },
      ],
    });
  } catch (e) {
    console.error("Teams 릴레이 메일 발송 실패:", e);
  }
}

export type RelayPayload = {
  fileName: string;
  pdf: Uint8Array;
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
  await sendRelayMail({ subject, text, fileName: p.fileName, pdf: p.pdf });
}
