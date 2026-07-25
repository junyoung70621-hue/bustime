// ─────────────────────────────────────────────────────────────
// 관리자 차량 CRUD API (비밀번호 인증 필수)
//   GET    ?q=...  : 차량번호/노선ID/노선명 부분검색
//   POST           : 차량 추가
//   PATCH          : 차량 수정 (plate_no 기준)
//   DELETE ?plate= : 차량 삭제
// 쓰기는 service_role 로 처리(서버 전용). 읽기 포함 모든 작업 인증 확인.
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { getSupabase, orIlike } from "@/lib/supabase";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const EDITABLE = ["vehicle_id", "route_id", "route_name", "garage_name", "operator"] as const;

function guard() {
  if (!isAuthed()) return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  return null;
}

// service_role 클라이언트 안전 획득 (미설정 시 명확한 503)
function adminClient() {
  try {
    return { sb: getSupabaseAdmin(), err: null as NextResponse | null };
  } catch (e) {
    return {
      sb: null,
      err: NextResponse.json(
        { error: "수정 기능 비활성: 서버에 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다." },
        { status: 503 },
      ),
    };
  }
}

// 검색
export async function GET(req: NextRequest) {
  const denied = guard();
  if (denied) return denied;

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  const sb = getSupabase(); // 읽기는 anon(RLS)로 충분
  let query = sb
    .from("vehicles")
    .select("plate_no, vehicle_id, route_id, route_name, garage_name, operator")
    .order("plate_no")
    .limit(200);

  if (q) {
    const p = orIlike(q);
    query = query.or(
      `plate_no.ilike.${p},route_id.ilike.${p},route_name.ilike.${p},garage_name.ilike.${p}`,
    );
  }
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data ?? [] });
}

// 추가
export async function POST(req: NextRequest) {
  const denied = guard();
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const plate_no = String(body?.plate_no ?? "").trim();
  if (!plate_no) return NextResponse.json({ error: "차량번호(plate_no)는 필수입니다." }, { status: 400 });

  const row: Record<string, string> = { plate_no };
  for (const k of EDITABLE) row[k] = String(body?.[k] ?? "").trim();

  const { sb, err } = adminClient();
  if (err) return err;
  const { error } = await sb!.from("vehicles").insert(row);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// 수정
export async function PATCH(req: NextRequest) {
  const denied = guard();
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const plate_no = String(body?.plate_no ?? "").trim();
  if (!plate_no) return NextResponse.json({ error: "plate_no 누락" }, { status: 400 });

  const patch: Record<string, string | null> = {};
  for (const k of EDITABLE) {
    if (k in body) patch[k] = body[k] === "" ? (k === "route_id" ? null : "") : String(body[k]).trim();
  }
  if (Object.keys(patch).length === 0)
    return NextResponse.json({ error: "수정할 필드가 없습니다." }, { status: 400 });

  const { sb, err } = adminClient();
  if (err) return err;
  const { error } = await sb!.from("vehicles").update(patch).eq("plate_no", plate_no);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// 삭제
export async function DELETE(req: NextRequest) {
  const denied = guard();
  if (denied) return denied;

  const plate_no = (req.nextUrl.searchParams.get("plate") ?? "").trim();
  if (!plate_no) return NextResponse.json({ error: "plate 누락" }, { status: 400 });

  const { sb, err } = adminClient();
  if (err) return err;
  const { error } = await sb!.from("vehicles").delete().eq("plate_no", plate_no);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
