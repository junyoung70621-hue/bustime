// ─────────────────────────────────────────────────────────────
// 증빙사진 직접 업로드용 서명 URL 발급 (수도권 체크리스트)
//   사진을 함수 본문(~4.5MB)으로 보내면 용량 초과(413)로 막힌다.
//   → 클라이언트가 Storage에 직접 업로드하도록 서명 업로드 URL을 발급한다.
//   사진은 임시본(_photos/<batchId>/)으로 올라가고, 저장 시 서버가 Teams로
//   릴레이한 뒤 삭제한다(보관본은 Teams 전용 — DB 미보관).
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { PHOTO_BUCKET, photoTempPath } from "@/lib/daepyecha/photo-upload";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let sb;
  try {
    sb = getSupabaseAdmin();
  } catch {
    return NextResponse.json({ error: "저장 기능 비활성: SUPABASE_SERVICE_ROLE_KEY 없음" }, { status: 503 });
  }

  let body: { batchId?: string; items?: { idx: number; label: string }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON 오류" }, { status: 400 });
  }

  const batchId = String(body.batchId ?? "");
  const items = Array.isArray(body.items) ? body.items : [];
  // batchId는 UUID 형태만 허용(임의 경로 주입 차단), 사진은 1~8장.
  if (!/^[0-9a-f-]{8,}$/i.test(batchId) || items.length === 0 || items.length > 8) {
    return NextResponse.json({ error: "batchId/items 누락 또는 범위 초과" }, { status: 400 });
  }

  const urls: { idx: number; label: string; path: string; token: string; filename: string }[] = [];
  for (const it of items) {
    const idx = Number(it.idx);
    if (!Number.isInteger(idx) || idx < 0 || idx > 7) {
      return NextResponse.json({ error: "idx 범위 오류" }, { status: 400 });
    }
    const path = photoTempPath(batchId, idx);
    const { data, error } = await sb.storage.from(PHOTO_BUCKET).createSignedUploadUrl(path, { upsert: true });
    if (error || !data) {
      return NextResponse.json({ error: `서명 URL 실패: ${error?.message ?? "unknown"}` }, { status: 500 });
    }
    urls.push({ idx, label: String(it.label ?? `사진${idx}`), path, token: data.token, filename: `${String(it.label ?? `사진${idx}`)}.jpg` });
  }

  return NextResponse.json({ urls });
}
