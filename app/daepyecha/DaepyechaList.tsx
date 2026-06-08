"use client";

// ─────────────────────────────────────────────────────────────
// 대폐차 확인서 관리 목록
//   - 검색(운수사/차량번호) + 기간(지급일) + 센터 필터
//   - 체크 선택 → 여러 건 ZIP 다운로드
//   - 수정(편집 모달), 삭제(휴지통), 휴지통 보기/복원/영구삭제/비우기
// ─────────────────────────────────────────────────────────────
import { useCallback, useEffect, useState } from "react";
import { CENTERS } from "@/lib/daepyecha/templates";
import type { ConfirmationRow, Center } from "@/lib/daepyecha/types";
import DaepyechaModal from "./DaepyechaModal";

type ListRow = Omit<ConfirmationRow, "items">;

export default function DaepyechaList() {
  const [rows, setRows] = useState<ListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Center | "">("");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [trashed, setTrashed] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  // modal: null=닫힘, "new"=신규, 그 외=수정할 id
  const [modal, setModal] = useState<null | "new" | string>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    try {
      const p = new URLSearchParams();
      if (filter) p.set("center", filter);
      if (q.trim()) p.set("q", q.trim());
      if (from) p.set("from", from);
      if (to) p.set("to", to);
      if (trashed) p.set("trashed", "1");
      const res = await fetch(`/api/daepyecha?${p.toString()}`);
      const json = await res.json();
      setRows(json.rows ?? []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filter, q, from, to, trashed]);

  useEffect(() => {
    load();
  }, [load]);

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  function toggleAll() {
    setSelected((s) => (s.size === rows.length ? new Set() : new Set(rows.map((r) => r.id))));
  }

  async function downloadSelected() {
    if (selected.size === 0) return;
    setBusy(true);
    try {
      const res = await fetch("/api/daepyecha/download-zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selected] }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "다운로드 실패");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "daepyecha.zip";
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

  async function softDelete(id: string) {
    if (!confirm("이 확인서를 휴지통으로 이동할까요?")) return;
    await act(`/api/daepyecha/${id}`, "DELETE");
  }
  async function restore(id: string) {
    await act(`/api/daepyecha/${id}`, "PATCH");
  }
  async function hardDelete(id: string) {
    if (!confirm("영구 삭제하면 복구할 수 없습니다. 삭제할까요?")) return;
    await act(`/api/daepyecha/${id}?hard=1`, "DELETE");
  }
  async function emptyTrash() {
    if (!confirm("휴지통을 비우면 모두 영구 삭제됩니다. 진행할까요?")) return;
    await act(`/api/daepyecha/trash`, "DELETE");
  }
  async function act(url: string, method: string) {
    setBusy(true);
    try {
      const res = await fetch(url, { method });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "처리 실패");
      }
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "처리 실패");
    } finally {
      setBusy(false);
    }
  }

  const allChecked = rows.length > 0 && selected.size === rows.length;

  return (
    <main className="safe-x safe-top safe-bottom mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col gap-3">
      <header className="flex flex-col items-center pt-1 text-center">
        <h1 className="text-lg font-extrabold text-slate-800">대폐차 자재 지급확인서</h1>
        <p className="mt-1 text-xs text-slate-400">작성·서명 후 PDF로 보관됩니다.</p>
      </header>

      {!trashed && (
        <button
          onClick={() => setModal("new")}
          className="h-12 w-full rounded-xl bg-brand-600 text-base font-bold text-white shadow-sm transition hover:bg-brand-700 active:bg-brand-700"
        >
          + 신규 작성
        </button>
      )}

      {/* 검색 + 기간 */}
      <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-card">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="운수사 · 차량번호 검색"
          className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-brand-500"
        />
        <div className="flex items-center gap-1.5 text-sm">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 px-2 text-sm outline-none focus:border-brand-500"
          />
          <span className="text-slate-400">~</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 px-2 text-sm outline-none focus:border-brand-500"
          />
          {(q || from || to) && (
            <button
              onClick={() => {
                setQ("");
                setFrom("");
                setTo("");
              }}
              className="h-10 shrink-0 rounded-lg px-2 text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {/* 센터 필터 */}
      <div className="flex gap-1.5">
        {(["", ...CENTERS] as const).map((c) => {
          const active = filter === c;
          return (
            <button
              key={c || "전체"}
              onClick={() => setFilter(c)}
              className={`h-9 flex-1 rounded-lg text-sm font-semibold transition ${
                active
                  ? "bg-brand-50 text-brand-700 ring-1 ring-brand-200"
                  : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {c || "전체"}
            </button>
          );
        })}
      </div>

      {/* 도구 줄: 전체선택/다운로드 · 휴지통 토글 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-600">
            <input type="checkbox" checked={allChecked} onChange={toggleAll} className="h-4 w-4" />
            전체
          </label>
          <button
            onClick={downloadSelected}
            disabled={selected.size === 0 || busy}
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
          >
            선택 다운로드{selected.size > 0 ? ` (${selected.size})` : ""}
          </button>
        </div>
        <div className="flex items-center gap-2">
          {trashed && rows.length > 0 && (
            <button
              onClick={emptyTrash}
              disabled={busy}
              className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 ring-1 ring-red-200 disabled:opacity-40"
            >
              휴지통 비우기
            </button>
          )}
          <button
            onClick={() => setTrashed((t) => !t)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ring-1 transition ${
              trashed
                ? "bg-slate-700 text-white ring-slate-700"
                : "bg-white text-slate-500 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {trashed ? "← 목록으로" : "🗑 휴지통"}
          </button>
        </div>
      </div>

      {/* 목록 */}
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
                <input
                  type="checkbox"
                  checked={selected.has(r.id)}
                  onChange={() => toggle(r.id)}
                  className="mt-1 h-4 w-4 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                      {r.center}센터
                    </span>
                    <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700">
                      {r.purpose}
                    </span>
                    <span className="truncate font-bold text-slate-800">
                      {r.operator}
                      {r.office_type ? ` ${r.office_type}` : ""}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {r.model} · {r.vehicle_count}대
                    {r.vehicle_numbers ? ` · ${r.vehicle_numbers}` : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    인수 {r.receiver_name || "-"} / 인계 {r.transferor_name || "-"} · 지급 {r.issued_date}
                  </p>
                  {r.modified_by && r.updated_at !== r.created_at && (
                    <p className="mt-0.5 text-xs text-amber-600">
                      최종수정 {fmtDateTime(r.updated_at)} · {r.modified_by}
                    </p>
                  )}
                </div>
              </div>

              {/* 액션 */}
              <div className="mt-2 flex flex-wrap justify-end gap-1.5 border-t border-slate-100 pt-2">
                <a
                  href={`/api/daepyecha/${r.id}/download`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-100"
                >
                  PDF
                </a>
                {trashed ? (
                  <>
                    <button
                      onClick={() => restore(r.id)}
                      disabled={busy}
                      className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100 disabled:opacity-40"
                    >
                      복원
                    </button>
                    <button
                      onClick={() => hardDelete(r.id)}
                      disabled={busy}
                      className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 ring-1 ring-red-200 hover:bg-red-100 disabled:opacity-40"
                    >
                      영구삭제
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setModal(r.id)}
                      className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => softDelete(r.id)}
                      disabled={busy}
                      className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 ring-1 ring-red-200 hover:bg-red-100 disabled:opacity-40"
                    >
                      삭제
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {modal && (
        <DaepyechaModal
          editId={modal === "new" ? undefined : modal}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
          }}
        />
      )}
    </main>
  );
}

function fmtDateTime(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
