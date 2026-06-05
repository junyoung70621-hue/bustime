"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Vehicle = {
  plate_no: string;
  vehicle_id: string;
  route_id: string | null;
  route_name: string;
  garage_name: string;
  operator: string;
};

const EMPTY_NEW: Vehicle = {
  plate_no: "",
  vehicle_id: "",
  route_id: "",
  route_name: "",
  garage_name: "",
  operator: "",
};

export default function AdminPanel() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // 처리중인 plate_no
  const [adding, setAdding] = useState(false);
  const [newRow, setNewRow] = useState<Vehicle>(EMPTY_NEW);

  function flash(m: string) {
    setMsg(m);
    setTimeout(() => setMsg(null), 2500);
  }

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/vehicles?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setRows((json.rows as Vehicle[]).map((r) => ({ ...r, route_id: r.route_id ?? "" })));
    } catch (err) {
      flash(err instanceof Error ? err.message : "조회 실패");
    } finally {
      setLoading(false);
    }
  }

  function edit(plate: string, field: keyof Vehicle, value: string) {
    setRows((prev) => prev.map((r) => (r.plate_no === plate ? { ...r, [field]: value } : r)));
  }

  async function save(row: Vehicle) {
    setBusy(row.plate_no);
    try {
      const res = await fetch("/api/admin/vehicles", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(row),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      flash(`저장됨: ${row.plate_no}`);
    } catch (err) {
      flash(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setBusy(null);
    }
  }

  async function remove(plate: string) {
    if (!confirm(`${plate} 차량을 삭제할까요?`)) return;
    setBusy(plate);
    try {
      const res = await fetch(`/api/admin/vehicles?plate=${encodeURIComponent(plate)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setRows((prev) => prev.filter((r) => r.plate_no !== plate));
      flash(`삭제됨: ${plate}`);
    } catch (err) {
      flash(err instanceof Error ? err.message : "삭제 실패");
    } finally {
      setBusy(null);
    }
  }

  async function create() {
    if (!newRow.plate_no.trim()) {
      flash("차량번호는 필수입니다.");
      return;
    }
    setBusy("__new__");
    try {
      const res = await fetch("/api/admin/vehicles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(newRow),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      flash(`추가됨: ${newRow.plate_no}`);
      setRows((prev) => [{ ...newRow }, ...prev]);
      setNewRow(EMPTY_NEW);
      setAdding(false);
    } catch (err) {
      flash(err instanceof Error ? err.message : "추가 실패");
    } finally {
      setBusy(null);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  return (
    <main className="safe-x safe-top safe-bottom mx-auto flex min-h-[100dvh] max-w-3xl flex-col gap-4">
      {/* 헤더 */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/atec-logo.png" alt="ATEC" width={3481} height={315} className="h-6 w-auto" />
          <span className="text-sm font-bold text-slate-500">관리자</span>
        </div>
        <div className="flex gap-2">
          <a
            href="/"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            검색화면
          </a>
          <button
            onClick={logout}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            로그아웃
          </button>
        </div>
      </header>

      {/* 검색 + 추가 */}
      <div className="flex gap-2">
        <form onSubmit={search} className="flex flex-1 gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="차량번호 / 노선ID / 노선명 / 영업소 검색"
            className="h-11 flex-1 rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <button
            type="submit"
            disabled={loading}
            className="h-11 shrink-0 rounded-xl bg-brand-600 px-5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? "…" : "검색"}
          </button>
        </form>
        <button
          onClick={() => setAdding((v) => !v)}
          className="h-11 shrink-0 rounded-xl border border-brand-600 px-4 text-sm font-bold text-brand-600 hover:bg-brand-50"
        >
          + 추가
        </button>
      </div>

      {msg && (
        <div className="rounded-lg border border-brand-100 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700">
          {msg}
        </div>
      )}

      {/* 신규 추가 카드 */}
      {adding && (
        <div className="rounded-2xl border-2 border-dashed border-brand-200 bg-white p-4 shadow-card">
          <p className="mb-2 text-sm font-bold text-slate-700">신규 차량 추가</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Field label="차량번호 *" value={newRow.plate_no} onChange={(v) => setNewRow({ ...newRow, plate_no: v })} />
            <Field label="차량ID" value={newRow.vehicle_id} onChange={(v) => setNewRow({ ...newRow, vehicle_id: v })} />
            <Field label="노선ID" value={newRow.route_id ?? ""} onChange={(v) => setNewRow({ ...newRow, route_id: v })} />
            <Field label="노선명" value={newRow.route_name} onChange={(v) => setNewRow({ ...newRow, route_name: v })} />
            <Field label="영업소" value={newRow.garage_name} onChange={(v) => setNewRow({ ...newRow, garage_name: v })} />
            <Field label="운수사" value={newRow.operator} onChange={(v) => setNewRow({ ...newRow, operator: v })} />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={create}
              disabled={busy === "__new__"}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              추가
            </button>
            <button
              onClick={() => {
                setAdding(false);
                setNewRow(EMPTY_NEW);
              }}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 결과 카드 목록 */}
      <p className="text-xs text-slate-400">{rows.length > 0 ? `${rows.length}건` : ""}</p>
      <div className="flex flex-col gap-3">
        {rows.map((r) => (
          <div key={r.plate_no} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-base font-extrabold text-slate-900">{r.plate_no}</span>
              <span className="text-xs text-slate-400">(차량번호는 변경 불가)</span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Field label="차량ID" value={r.vehicle_id} onChange={(v) => edit(r.plate_no, "vehicle_id", v)} />
              <Field label="노선ID" value={r.route_id ?? ""} onChange={(v) => edit(r.plate_no, "route_id", v)} />
              <Field label="노선명" value={r.route_name} onChange={(v) => edit(r.plate_no, "route_name", v)} />
              <Field label="영업소" value={r.garage_name} onChange={(v) => edit(r.plate_no, "garage_name", v)} />
              <Field label="운수사" value={r.operator} onChange={(v) => edit(r.plate_no, "operator", v)} />
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => save(r)}
                disabled={busy === r.plate_no}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                저장
              </button>
              <button
                onClick={() => remove(r.plate_no)}
                disabled={busy === r.plate_no}
                className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>

      {!loading && rows.length === 0 && (
        <p className="py-10 text-center text-sm text-slate-400">검색어를 입력하고 검색하세요.</p>
      )}
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-0.5 block text-xs font-medium text-slate-400">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
    </label>
  );
}
