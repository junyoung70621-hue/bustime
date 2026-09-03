// ─────────────────────────────────────────────────────────────
// 단말기 화면 사진 → IH 번호 자동 인식 (Gemini 비전)
//   인천 체크리스트 자동입력 단계에서 촬영한 4종 화면을 종류(kind)별 프롬프트로
//   읽어 JSON으로 반환. 실패해도 수기 입력으로 진행 가능(비차단 UX).
//   필요 env: GEMINI_API_KEY
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const PROMPTS: Record<string, string> = {
  // 버전조회 — IH 번호(1): 통합 단말기/AFC/BMS/표출 장치/HMI
  version:
    '버스 단말기 "버전조회" 화면 사진이다. IH 번호 목록에서 각 항목의 9자리 내외 숫자를 읽어라. ' +
    '보통 통합 단말기는 1780, AFC는 1782, BMS는 1766, 표출 장치는 1781, HMI는 1784로 시작한다. ' +
    'JSON만 출력: {"unified":"통합 단말기 숫자","afc":"AFC 숫자","bms":"BMS 숫자","pyochul":"표출 장치 숫자","hmi":"HMI 숫자"} 안 보이는 항목은 빈 문자열.',
  // 버전조회 — IH 번호(2): 승차/하차1/하차2 단말기
  door:
    '버스 단말기 "버전조회" 화면 사진이다. IH 번호 목록에서 승차 단말기/하차1 단말기/하차2 단말기의 숫자(보통 1715로 시작)를 읽어라. ' +
    'JSON만 출력: {"seungcha":"승차 단말기 숫자","hacha1":"하차1 단말기 숫자","hacha2":"하차2 단말기 숫자"} 안 보이는 항목은 빈 문자열.',
  // 버전조회 — IH 번호(3): 승차/하차1/하차2 CPU(모듈)
  module:
    '버스 단말기 "버전조회" 화면 사진이다. IH 번호 목록에서 승차 CPU/하차1 CPU/하차2 CPU의 숫자(보통 1786으로 시작)를 읽어라. ' +
    'JSON만 출력: {"seungcha":"승차 CPU 숫자","hacha1":"하차1 CPU 숫자","hacha2":"하차2 CPU 숫자"} 안 보이는 항목은 빈 문자열.',
  // 정보조회 — LTE 정보: 시리얼 넘버
  lte:
    '버스 단말기 "정보조회(LTE 정보)" 화면 사진이다. "시리얼 넘버" 항목 옆의 숫자를 읽어라. ' +
    'JSON만 출력: {"serial":"시리얼 넘버 숫자"} 안 보이면 빈 문자열.',
};

export async function POST(req: NextRequest) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: "GEMINI_API_KEY 미설정 — 수기로 입력해주세요." }, { status: 500 });

  const form = await req.formData();
  const kind = String(form.get("kind") ?? "");
  const image = form.get("image");
  const prompt = PROMPTS[kind];
  if (!prompt || !(image instanceof File)) {
    return NextResponse.json({ error: "잘못된 요청(kind/image)" }, { status: 400 });
  }

  const b64 = Buffer.from(await image.arrayBuffer()).toString("base64");
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inline_data: { mime_type: image.type || "image/jpeg", data: b64 } },
                { text: prompt },
              ],
            },
          ],
          generationConfig: { responseMimeType: "application/json", temperature: 0 },
        }),
      },
    );
    const json = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: `인식 API 오류(${res.status}): ${json?.error?.message ?? ""}` }, { status: 502 });
    }
    const text: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    let values: Record<string, string>;
    try {
      values = JSON.parse(text.replace(/^```(?:json)?|```$/g, "").trim());
    } catch {
      return NextResponse.json({ error: "인식 결과 해석 실패 — 다시 촬영해주세요." }, { status: 502 });
    }
    // 숫자만 남기고 정리(오인식된 공백/기호 제거). 값이 하나도 없으면 실패로 안내.
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(values)) out[k] = String(v ?? "").replace(/[^0-9]/g, "");
    if (!Object.values(out).some(Boolean)) {
      return NextResponse.json({ error: "번호를 찾지 못했어요 — 화면이 잘 보이게 다시 촬영해주세요." }, { status: 422 });
    }
    return NextResponse.json({ values: out });
  } catch (e) {
    return NextResponse.json({ error: `인식 실패: ${e instanceof Error ? e.message : String(e)}` }, { status: 502 });
  }
}
