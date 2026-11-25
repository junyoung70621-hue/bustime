// ─────────────────────────────────────────────────────────────
// 관리자 차량 CRUD API (비밀번호 인증 필수)
//   GET    ?q=...  : 차량번호/노선ID/노선명 부분검색
//   POST           : 차량 추가
//   PATCH          : 차량 수정 (plate_no 기준)
//   DELETE ?plate= : 차량 삭제
// 읽기 포함 모든 작업 인증 확인.
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { q, likeContains } from "@/lib/db";

export const dynamic = "force-dynamic";

// 컬럼명은 이 고정 목록에서만 SQL 에 들어간다(사용자 입력 키는 화이트리스트 통과분만).
const EDITABLE = ["vehicle_id", "route_id", "route_name", "garage_name", "operator"] as const;

async function guard() {
  if (!(await isAuthed())) return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  return null;
}

const fail = (e: unknown) =>
  NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });

// 검색
export async function GET(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;

  const search = (req.nextUrl.searchParams.get("q") ?? "").trim();
  try {
    const rows = await q(
      `select plate_no, vehicle_id, route_id, route_name, garage_name, operator
         from vehicles
        ${search ? "where plate_no ilike $1 or route_id ilike $1 or route_name ilike $1 or garage_name ilike $1" : ""}
        order by plate_no
        limit 200`,
      search ? [likeContains(search)] : [],
    );
    return NextResponse.json({ rows });
  } catch (e) {
    return fail(e);
  }
}

// 추가
export async function POST(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const plate_no = String(body?.plate_no ?? "").trim();
  if (!plate_no) return NextResponse.json({ error: "차량번호(plate_no)는 필수입니다." }, { status: 400 });

  const values = [plate_no, ...EDITABLE.map((k) => String(body?.[k] ?? "").trim())];
  try {
    await q(
      `insert into vehicles (plate_no, ${EDITABLE.join(", ")}) values (${values.map((_, i) => `$${i + 1}`).join(", ")})`,
      values,
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}

// 수정
export async function PATCH(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const plate_no = String(body?.plate_no ?? "").trim();
  if (!plate_no) return NextResponse.json({ error: "plate_no 누락" }, { status: 400 });

  const cols: string[] = [];
  const values: (string | null)[] = [];
  for (const k of EDITABLE) {
    if (k in body) {
      values.push(body[k] === "" ? (k === "route_id" ? null : "") : String(body[k]).trim());
      cols.push(`${k} = $${values.length}`);
    }
  }
  if (cols.length === 0) return NextResponse.json({ error: "수정할 필드가 없습니다." }, { status: 400 });

  values.push(plate_no);
  try {
    await q(`update vehicles set ${cols.join(", ")} where plate_no = $${values.length}`, values);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}

// 삭제
export async function DELETE(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;

  const plate_no = (req.nextUrl.searchParams.get("plate") ?? "").trim();
  if (!plate_no) return NextResponse.json({ error: "plate 누락" }, { status: 400 });

  try {
    await q("delete from vehicles where plate_no = $1", [plate_no]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
