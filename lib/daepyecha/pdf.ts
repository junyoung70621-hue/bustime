// ─────────────────────────────────────────────────────────────
// ConfirmationForm DOM 노드 → A4 PDF / JPG Blob (클라이언트 전용)
//   html2canvas-pro 로 래스터화 → jsPDF A4 1페이지. 폰트 로드 후 캡처.
//   보관본은 PDF, 팀즈 업로드용으로 같은 캡처에서 JPG도 생성(수도권).
// ─────────────────────────────────────────────────────────────
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

// 이 상수가 화면에 새 값으로 보이면 pdf.ts 청크도 최신(아이폰 캐시 점검용).
export const PDF_BUILD = "pdf-diag-2";

// 폼 노드를 주어진 scale로 캔버스 래스터화(한글 웹폰트 로드 완료 후 캡처)
async function rasterizeAt(node: HTMLElement, scale: number): Promise<HTMLCanvasElement> {
  // 모바일 화면 폭이 좁아도 폼이 찌그러지지 않도록 캡처 폭/창 폭을 폼 실제 폭으로 고정.
  const targetW = node.scrollWidth || 794;
  const targetH = node.scrollHeight || 1123;
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

// 캔버스 → JPEG data URL. iOS Safari에서 캔버스가 한계를 넘으면 toDataURL이
// "data:," 같은 빈 문자열을 돌려준다 → 유효성 검사로 걸러낸다(유효하면 URL, 아니면 null).
function jpegDataUrl(canvas: HTMLCanvasElement, quality: number): string | null {
  let url = "";
  try {
    url = canvas.toDataURL("image/jpeg", quality);
  } catch {
    return null;
  }
  // 정상 JPEG data URL은 "data:image/jpeg;base64,...." 형태에 충분한 길이를 가진다.
  return url.startsWith("data:image/jpeg") && url.length > 1024 ? url : null;
}

// 폼 노드 → 유효한 캔버스 + JPEG data URL.
//   iOS Safari의 캔버스 한 변/총 픽셀 한계는 기기 메모리에 따라 달라 정적 상한으로는
//   못 맞춘다. scale을 동적으로 낮춰가며 toDataURL이 실제로 성공할 때까지 재시도한다.
//   실패 시 jsPDF가 atob 단계에서 "The string did not match the expected pattern"으로 죽음.
async function rasterizeValid(
  node: HTMLElement,
  quality: number,
): Promise<{ canvas: HTMLCanvasElement; dataUrl: string }> {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* noop */
    }
  }

  const targetW = node.scrollWidth || 794;
  const targetH = node.scrollHeight || 1123;

  // 한계 안에 들도록 1차 scale 산정(보수적). 그래도 빈 결과면 0.75배씩 낮춰 재시도.
  const MAX_SIDE = 4096; // 변 길이 한계
  const MAX_AREA = 10_000_000; // 총 픽셀 한계(메모리 여유 고려해 보수적으로 시작)
  let scale = Math.min(
    2,
    MAX_SIDE / targetW,
    MAX_SIDE / targetH,
    Math.sqrt(MAX_AREA / (targetW * targetH)),
  );

  for (let attempt = 0; attempt < 6; attempt++) {
    let canvas: HTMLCanvasElement;
    try {
      canvas = await rasterizeAt(node, scale);
    } catch (e) {
      // html2canvas 단계에서 throw(아이폰: 이미지/CSS 파싱 한계 등). 어느 단계인지 노출.
      throw new Error(`[캡처] ${e instanceof Error ? e.message : String(e)}`);
    }
    const dataUrl = jpegDataUrl(canvas, quality);
    if (dataUrl) return { canvas, dataUrl };
    scale *= 0.75; // 더 작은 캔버스로 재시도(기기 실제 한계에 적응)
  }
  throw new Error("[인코딩] PDF 이미지 생성 실패 — 내용이 너무 길어 캔버스 한계를 넘었습니다.");
}

// data URL → Blob (toBlob이 한계 초과로 null을 돌려줄 때 우회용)
function dataUrlToBlob(dataUrl: string): Blob {
  const [head, b64] = dataUrl.split(",");
  const mime = head.match(/data:([^;]+);/)?.[1] ?? "image/jpeg";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

// 검증된 JPEG data URL → A4 1페이지 PDF Blob
function makePdf(dataUrl: string, canvas: HTMLCanvasElement): Blob {
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
  try {
    pdf.addImage(dataUrl, "JPEG", x, margin, w, h);
    return pdf.output("blob");
  } catch (e) {
    throw new Error(`[PDF생성] ${e instanceof Error ? e.message : String(e)}`);
  }
}

export async function generatePdfBlob(node: HTMLElement): Promise<Blob> {
  const { canvas, dataUrl } = await rasterizeValid(node, 0.8);
  return makePdf(dataUrl, canvas);
}

/** PDF(보관용)와 JPG(팀즈 업로드용)를 한 번의 캡처로 동시 생성 */
export async function generatePdfAndJpg(node: HTMLElement): Promise<{ pdf: Blob; jpg: Blob }> {
  // 캔버스 유효성을 보장하는 0.8 품질 data URL을 기준으로 캡처(검증 통과 캔버스 확보).
  const { canvas, dataUrl } = await rasterizeValid(node, 0.8);
  const pdf = makePdf(dataUrl, canvas);
  // 팀즈용 JPG는 같은 캡처를 재사용한다. 이 dataUrl은 위 makePdf(jsPDF)에서 이미
  // 디코드에 성공한 검증본이라 atob도 안전. (iOS에서 0.9로 재인코딩하면 검증을 통과
  // 하면서도 atob가 거부하는 문자열이 나와 "did not match the expected pattern" 발생.)
  let jpg: Blob;
  try {
    jpg = dataUrlToBlob(dataUrl);
  } catch (e) {
    throw new Error(`[JPG변환] ${e instanceof Error ? e.message : String(e)}`);
  }
  return { pdf, jpg };
}
