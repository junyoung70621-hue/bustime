// ─────────────────────────────────────────────────────────────
// 증빙사진 1장 업로드 (수도권·인천 체크리스트) — 로그인 필요(middleware)
//   POST multipart { batchId, idx, label, file } → 서버 임시본 checklist/_photos/<batchId>/<idx>.jpg
//   응답 { path, filename } 을 meta.photos_upload 에 실어 저장하면, 서버가 Teams로 릴레이한 뒤 삭제한다.
//   (예전엔 Vercel 4.5MB 제한 때문에 Supabase로 직접 올렸지만 자체 서버는 제한이 없음)
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { putFile } from "@/lib/storage";
import { PHOTO_BUCKET, photoTempPath } from "@/lib/daepyecha/photo-upload";

export const dynamic = "force-dynamic";

const MAX_BYTES = 15 * 1024 * 1024; // 장당 15MB

const bad = (error: string) => NextResponse.json({ error }, { status: 400 });

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return bad("form-data 파싱 실패");
  }

  const batchId = String(form.get("batchId") ?? "");
  const idx = Number(form.get("idx"));
  const label = String(form.get("label") ?? "").trim() || `사진${idx}`;
  const file = form.get("file");

  // batchId는 UUID 형태만(임의 경로 주입 차단), 사진은 idx 0~7(최대 8장).
  if (!/^[0-9a-f-]{8,}$/i.test(batchId)) return bad("batchId 형식 오류");
  if (!Number.isInteger(idx) || idx < 0 || idx > 7) return bad("idx 범위 오류");
  if (!(file instanceof File)) return bad("사진 파일 없음");
  if (file.size > MAX_BYTES) return bad("사진이 너무 큽니다(장당 15MB 이하)");

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!(bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)) return bad("JPEG 사진만 올릴 수 있습니다");

  const path = photoTempPath(batchId, idx);
  try {
    await putFile(PHOTO_BUCKET, path, bytes, { overwrite: true });
  } catch (e) {
    return NextResponse.json({ error: `사진 저장 실패: ${e instanceof Error ? e.message : e}` }, { status: 500 });
  }
  return NextResponse.json({ path, filename: `${label}.jpg` });
}
