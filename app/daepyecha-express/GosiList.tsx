"use client";

// ─────────────────────────────────────────────────────────────
// 고속/시외 증·대폐차 설치확인서 관리 목록
//   백엔드는 /api/checklist 공유(variant=gosi). 검색 + 기간 + 휴지통.
// ─────────────────────────────────────────────────────────────
import { useCallback, useEffect, useState } from "react";
import type { GosiRow } from "@/lib/gosi/types";
import GosiModal from "./GosiModal";

type ListRow = Omit<GosiRow, "data">;

export default function GosiList() {
  const [rows, setRows] = useState<ListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [trashed, setTrashed] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<null | "new" | string>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    try {
      const p = new URLSearchParams();
      p.set("variant", "gosi");
      if (q.trim()) p.set("q", q.trim());
      if (from) p.set("from", from);
      if (to) p.set("to", to);
      if (trashed) p.set("trashed", "1");
      const res = await fetch(`/api/checklist?${p.toString()}`);
      const json = await res.json();
      setRows(json.rows ?? []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [q, from, to, trashed]);

  useEffect(() => {
    load();
  }, [load]);

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }
  const allChecked = rows.length > 0 && selected.size === rows.length;
  function toggleAll() {
    setSelected((s) => (s.size === rows.length ? new Set() : new Set(rows.map((r) => r.id))));
  }

  async function downloadSelected() {
    if (selected.size === 0) return;
    setBusy(true);
    try {
      const res = await fetch("/api/checklist/download-zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selected] }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "다운로드 실패");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "gosi.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e instanceof Error ? e.message : "다운로드 실패");
    } finally {
      setBusy(false);
    }
  }

  async function act(url: string, method: string, confirmMsg?: string) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setBusy(true);
    try {
      const res = await fetch(url, { method });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "처리 실패");
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "처리 실패");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <header className="flex flex-col items-center pt-1 text-center">
        <h1 className="text-lg font-extrabold text-slate-800">증·대폐차 설치확인서 (고속/시외)</h1>
        <p className="mt-1 text-xs text-slate-400">작성·서명 후 PDF로 보관됩니다.</p>
      </header>

      {!trashed && (
        <button onClick={() => setModal("new")} className="h-12 w-full rounded-xl bg-brand-600 text-base font-bold text-white shadow-sm hover:bg-brand-700">
          + 신규 작성
        </button>
      )}

      <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-card">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="운수사 · 차량번호 검색" className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-brand-500" />
        <div className="flex items-center gap-1.5 text-sm">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 px-2 text-sm outline-none focus:border-brand-500" />
          <span className="text-slate-400">~</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 px-2 text-sm outline-none focus:border-brand-500" />
          {(q || from || to) && (
            <button onClick={() => { setQ(""); setFrom(""); setTo(""); }} className="h-10 shrink-0 rounded-lg px-2 text-xs font-semibold text-slate-400 hover:text-slate-600">초기화</button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-600">
            <input type="checkbox" checked={allChecked} onChange={toggleAll} className="h-4 w-4" />전체
          </label>
          <button onClick={downloadSelected} disabled={selected.size === 0 || busy} className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40">
            선택 다운로드{selected.size > 0 ? ` (${selected.size})` : ""}
          </button>
        </div>
        <div className="flex items-center gap-2">
          {trashed && rows.length > 0 && (
            <button onClick={() => act("/api/checklist/trash", "DELETE", "휴지통을 비우면 모두 영구 삭제됩니다. 진행할까요?")} disabled={busy} className="rounded-lg border border-red-200 px-2 py-1.5 text-xs font-bold text-red-600">비우기</button>
          )}
          <button onClick={() => setTrashed((t) => !t)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ring-1 ${trashed ? "bg-slate-800 text-white ring-slate-800" : "bg-white text-slate-500 ring-slate-200"}`}>
            {trashed ? "← 목록" : "🗑 휴지통"}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-400">불러오는 중…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-400 shadow-card">
          {trashed ? "휴지통이 비어 있습니다." : "저장된 확인서가 없습니다."}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => (
            <li key={r.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-card">
              <div className="flex items-start gap-2">
                <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} className="mt-1 h-4 w-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5">
                    <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700">고속/시외</span>
                    <span className="truncate font-bold text-slate-800">{r.operator}</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{r.vehicle_numbers ? `${r.vehicle_numbers} · ` : ""}설치일 {r.install_date || "-"}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    고속사 {r.operator_signer_name || "-"}
                    {r.modified_by ? ` · 수정 ${r.modified_by}(${(r.updated_at || "").slice(0, 10)})` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <a href={`/api/checklist/${r.id}/download`} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700 ring-1 ring-brand-200">PDF</a>
                  {trashed ? (
                    <>
                      <button onClick={() => act(`/api/checklist/${r.id}`, "PATCH")} disabled={busy} className="rounded-lg px-2.5 py-1 text-xs font-bold text-emerald-600">복원</button>
                      <button onClick={() => act(`/api/checklist/${r.id}?hard=1`, "DELETE", "영구 삭제하면 복구할 수 없습니다. 삭제할까요?")} disabled={busy} className="rounded-lg px-2.5 py-1 text-xs font-bold text-red-600">영구삭제</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setModal(r.id)} className="rounded-lg px-2.5 py-1 text-xs font-bold text-slate-500">수정</button>
                      <button onClick={() => act(`/api/checklist/${r.id}`, "DELETE", "이 확인서를 휴지통으로 이동할까요?")} disabled={busy} className="rounded-lg px-2.5 py-1 text-xs font-bold text-red-500">삭제</button>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {modal && (
        <GosiModal editId={modal === "new" ? undefined : modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />
      )}
    </div>
  );
}
