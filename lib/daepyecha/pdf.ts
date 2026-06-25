// ─────────────────────────────────────────────────────────────
// ConfirmationForm DOM 노드 → A4 PDF / JPG Blob (클라이언트 전용)
//   html2canvas-pro 로 래스터화 → jsPDF A4 1페이지. 폰트 로드 후 캡처.
//   보관본은 PDF, 팀즈 업로드용으로 같은 캡처에서 JPG도 생성(수도권).
// ─────────────────────────────────────────────────────────────
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

// 폼 노드를 캔버스로 래스터화(한글 웹폰트 로드 완료 후 캡처)
async function rasterize(node: HTMLElement): Promise<HTMLCanvasElement> {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* noop */
    }
  }

  // 모바일 화면 폭이 794px보다 좁아도 폼이 찌그러지지 않도록
  // 캡처 폭/창 폭을 폼 실제 폭(794px)으로 고정한다.
  const targetW = node.scrollWidth || 794;
  const targetH = node.scrollHeight || 1123;

  // iOS Safari는 캔버스 한 변/총 픽셀 한계가 있어, scale:2로 키운 캔버스가 이를 넘으면
  // toDataURL()이 빈 문자열을 반환하고 jsPDF가 atob하다 "The string did not match
  // the expected pattern"으로 실패한다(아이폰에서만 PDF 저장 실패).
  // → 결과 캔버스가 한계 안에 들도록 scale을 동적으로 낮춘다(최대 2).
  const MAX_SIDE = 4096; // 변 길이 한계(보수적)
  const MAX_AREA = 16_000_000; // 총 픽셀 한계(~16.7M)
  const scale = Math.min(
    2,
    MAX_SIDE / targetW,
    MAX_SIDE / targetH,
    Math.sqrt(MAX_AREA / (targetW * targetH)),
  );

  return html2canvas(node, {
    scale,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
    width: targetW,
    height: targetH,
    windowWidth: targetW,
    windowHeight: targetH,
  });
}

// 캔버스 → A4 1페이지 PDF Blob
function canvasToPdf(canvas: HTMLCanvasElement): Blob {
  const img = canvas.toDataURL("image/jpeg", 0.8);
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

// 캔버스 → JPG Blob
function canvasToJpg(canvas: HTMLCanvasElement, quality = 0.9): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("JPG 변환 실패"))),
      "image/jpeg",
      quality,
    );
  });
}

export async function generatePdfBlob(node: HTMLElement): Promise<Blob> {
  return canvasToPdf(await rasterize(node));
}

/** PDF(보관용)와 JPG(팀즈 업로드용)를 한 번의 캡처로 동시 생성 */
export async function generatePdfAndJpg(node: HTMLElement): Promise<{ pdf: Blob; jpg: Blob }> {
  const canvas = await rasterize(node);
  return { pdf: canvasToPdf(canvas), jpg: await canvasToJpg(canvas) };
}
