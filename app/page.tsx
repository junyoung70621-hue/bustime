"use client";

// ─────────────────────────────────────────────────────────────
// 3. 메인 UI 및 컴포넌트 (프론트엔드)
//   - 차량번호 4자리 검색창
//   - 후보 차량 리스트 (여러 대일 때 선택)
//   - 선택 시 남은 정류장 수 + ETA 대시보드
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import type { SearchResult } from "./api/bus/search/route";

export default function Home() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{1,4}$/.test(q)) {
      setError("차량번호 끝 1~4자리 숫자를 입력하세요.");
      return;
    }
    setLoading(true);
    setError(null);
    setNotice(null);
    setSelected(null);
    setResults([]);
    try {
      const res = await fetch(`/api/bus/search?q=${q}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "조회 실패");
      const list: SearchResult[] = json.results ?? [];
      setResults(list);
      setNotice(json.notice ?? null);
      setSearched(true);
      if (list.length === 1) setSelected(list[0]); // 1대면 바로 표시
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">🚍 종점 도착 대시보드</h1>
        <p className="mt-1 text-sm text-slate-400">
          차량번호 끝 4자리로 종점(차고지) 도착 예정 시간을 확인하세요.
        </p>
      </header>

      {/* 검색창 */}
      <form onSubmit={onSearch} className="flex gap-2">
        <input
          inputMode="numeric"
          maxLength={4}
          value={q}
          onChange={(e) => setQ(e.target.value.replace(/\D/g, ""))}
          placeholder="예: 1234"
          className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-lg tracking-widest outline-none focus:border-sky-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white transition hover:bg-sky-500 disabled:opacity-50"
        >
          {loading ? "조회중…" : "조회"}
        </button>
      </form>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {notice && (
        <div className="rounded-lg border border-amber-800 bg-amber-950/40 px-4 py-3 text-sm text-amber-300">
          ⏳ {notice}
        </div>
      )}

      {/* 후보 리스트 (2대 이상일 때 선택 UI) */}
      {results.length > 1 && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-slate-400">
            매칭된 차량 {results.length}대 — 선택하세요
          </h2>
          <ul className="flex flex-col gap-2">
            {results.map((r) => (
              <li key={r.plateNo}>
                <button
                  onClick={() => setSelected(r)}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                    selected?.plateNo === r.plateNo
                      ? "border-sky-500 bg-sky-950/40"
                      : "border-slate-700 bg-slate-900 hover:border-slate-500"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate">
                      <span className="font-semibold">{r.plateNo}</span>
                      <span className="ml-2 text-sm text-slate-400">{r.routeName}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500">
                      {r.garageName}
                    </span>
                  </span>
                  <span className="shrink-0 pl-3 text-sm text-slate-300">
                    {r.live ? `${r.etaMinutes}분` : "신호없음"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 선택된 차량 대시보드 */}
      {selected && <EtaCard r={selected} />}

      {searched && !loading && results.length === 0 && !error && (
        <div className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-6 text-center text-slate-400">
          매칭되는 차량이 없습니다. 끝자리를 다시 확인하세요.
        </div>
      )}
    </main>
  );
}

// ── ETA 대시보드 카드 ──────────────────────────────────────────
function EtaCard({ r }: { r: SearchResult }) {
  if (!r.live) {
    return (
      <section className="rounded-2xl border border-amber-800 bg-amber-950/30 p-6">
        <p className="text-lg font-semibold text-amber-200">{r.plateNo}</p>
        <p className="mt-1 text-sm text-amber-200/90">
          {r.garageName}
          {r.operator && r.operator !== r.garageName && (
            <span className="text-amber-300/60"> · {r.operator}</span>
          )}
        </p>
        <p className="mt-2 text-sm text-amber-300/80">
          실시간 위치 신호가 없습니다. (미운행 / 차고지 대기 / 단말기 점검 가능성)
        </p>
        <p className="mt-1 text-xs text-amber-400/60">노선: {r.routeName}</p>
      </section>
    );
  }

  const etaLabel = r.etaUnknown
    ? "—"
    : r.arrived
      ? "종점 도착(대기)"
      : r.etaMinutes <= 2
        ? "곧 도착"
        : `약 ${r.etaMinutes}분`;

  return (
    <section className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900 to-slate-950 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xl font-bold">{r.plateNo}</p>
          <p className="text-sm text-slate-300">{r.garageName}</p>
          <p className="text-xs text-slate-500">
            {r.routeName}
            {r.operator && r.operator !== r.garageName && <> · {r.operator}</>}
          </p>
        </div>
        {r.atStop && (
          <span className="rounded-full bg-emerald-900/60 px-3 py-1 text-xs text-emerald-300">
            정류소 정차중
          </span>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <Stat
          label="남은 정류장"
          value={r.etaUnknown ? "—" : `${r.remainingStops}개`}
        />
        <Stat label="예상 도착(ETA)" value={etaLabel} highlight />
      </div>

      {r.etaUnknown && (
        <p className="mt-3 text-xs text-amber-400/80">
          ⚠ 이 노선의 종점 정류장 정보가 아직 수집되지 않아 ETA를 계산할 수 없습니다.
          현재 위치(구간 {r.currentSeq})는 실시간으로 확인됩니다.
        </p>
      )}

      <div className="mt-4 text-xs text-slate-500">
        현재 {r.currentSeq} 구간
        {r.lastSeq ? <> / 종점 {r.lastSeq} 구간</> : null}
        {r.dataTm && <> · 측정 {r.dataTm}</>}
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl bg-slate-900/80 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold ${
          highlight ? "text-sky-400" : "text-slate-100"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
