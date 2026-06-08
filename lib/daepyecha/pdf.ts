// ─────────────────────────────────────────────────────────────
// ConfirmationForm DOM 노드 → A4 PDF Blob (클라이언트 전용)
//   html2canvas-pro 로 래스터화 → jsPDF A4 1페이지. 폰트 로드 후 캡처.
// ─────────────────────────────────────────────────────────────
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

export async function generatePdfBlob(node: HTMLElement): Promise<Blob> {
  // 한글 등 웹폰트 로드 완료 후 캡처(글자 깨짐 방지)
  if (typeof document !== "undefined" && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* noop */
    }
  }

  const canvas = await html2canvas(node, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
  });

  const img = canvas.toDataURL("image/jpeg", 0.92);
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  const pageW = 210;
  const pageH = 297;
  const margin = 8;
  const usableW = pageW - margin * 2;

  let w = usableW;
  let h = (canvas.height * w) / canvas.width;

  // 한 페이지를 넘으면 높이에 맞춰 축소(1장에 수용)
  const usableH = pageH - margin * 2;
  if (h > usableH) {
    h = usableH;
    w = (canvas.width * h) / canvas.height;
  }

  const x = (pageW - w) / 2;
  pdf.addImage(img, "JPEG", x, margin, w, h);
  return pdf.output("blob");
}
