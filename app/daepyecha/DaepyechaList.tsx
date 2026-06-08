"use client";

// ─────────────────────────────────────────────────────────────
// 대폐차 확인서 관리 목록 (별도 관리)
//   - 센터(강남/강서/강북/강동) 필터
//   - "신규 작성" → DaepyechaModal
//   - 각 기록 PDF 다운로드(서명 URL)
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
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = filter ? `?center=${encodeURIComponent(filter)}` : "";
      const res = await fetch(`/api/daepyecha${qs}`);
      const json = await res.json();
      setRows(json.rows ?? []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="safe-x safe-top safe-bottom mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col gap-4">
      <header className="flex flex-col items-center pt-1 text-center">
        <h1 className="text-lg font-extrabold text-slate-800">대폐차 자재 지급확인서</h1>
        <p className="mt-1 text-xs text-slate-400">작성·서명 후 PDF로 보관됩니다.</p>
      </header>

      <button
        onClick={() => setModalOpen(true)}
        className="h-12 w-full rounded-xl bg-brand-600 text-base font-bold text-white shadow-sm transition hover:bg-brand-700 active:bg-brand-700"
      >
        + 신규 작성
      </button>

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

      {/* 목록 */}
      {loading ? (
        <p className="py-10 text-center text-sm text-slate-400">불러오는 중…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-400 shadow-card">
          저장된 확인서가 없습니다.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-card"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                      {r.center}
                    </span>
                    <span className="truncate font-bold text-slate-800">{r.operator}</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {r.model} · {r.vehicle_count}대
                    {r.vehicle_numbers ? ` · ${r.vehicle_numbers}` : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    인수 {r.receiver_name || "-"} / 인계 {r.transferor_name || "-"} · {r.issued_date}
                  </p>
                </div>
                <a
                  href={`/api/daepyecha/${r.id}/download`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-lg bg-brand-50 px-3 py-2 text-xs font-bold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-100"
                >
                  PDF
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}

      {modalOpen && (
        <DaepyechaModal
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            load();
          }}
        />
      )}
    </main>
  );
}
