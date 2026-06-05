"use client";

// ─────────────────────────────────────────────────────────────
// 메인 UI — ATEC 모빌리티 브랜드(라이트/크림슨) 테마
//   - 차량번호 4자리 검색
//   - 후보 차량 리스트 (여러 대일 때 선택)
//   - 남은 정류장 수 + ETA 대시보드
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
      if (list.length === 1) setSelected(list[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="safe-x safe-top safe-bottom mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col gap-5">
      {/* 헤더 / 브랜딩 */}
      <header className="text-center">
        <div className="flex flex-wrap items-baseline justify-center gap-x-2.5 gap-y-0">
          <span className="text-[2rem] font-extrabold leading-tight tracking-tight text-brand-600 sm:text-4xl">
            ATEC
          </span>
          <span className="text-xl font-bold text-slate-400 sm:text-2xl">에이텍모빌리티</span>
        </div>
        <p className="mt-1.5 text-sm font-semibold tracking-wide text-slate-400">
          종점 도착 대시보드
        </p>
      </header>

      {/* 검색 카드 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <label htmlFor="plate" className="block text-sm font-bold text-slate-700">
          차량번호 끝 4자리
        </label>
        <form onSubmit={onSearch} className="mt-2.5 flex gap-2">
          <input
            id="plate"
            inputMode="numeric"
            maxLength={4}
            value={q}
            onChange={(e) => setQ(e.target.value.replace(/\D/g, ""))}
            placeholder="예: 1234"
            className="h-14 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-xl tracking-[0.3em] text-slate-800 outline-none transition placeholder:tracking-normal placeholder:text-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <button
            type="submit"
            disabled={loading}
            className="h-14 shrink-0 rounded-xl bg-brand-600 px-7 text-base font-bold text-white shadow-sm transition active:bg-brand-700 hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? "조회중…" : "조회"}
          </button>
        </form>
      </section>

      {/* 알림: 인증 대기 (이미지의 분홍 안내박스 톤) */}
      {notice && (
        <div className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-center text-sm font-medium text-brand-700">
          ⏳ {notice}
        </div>
      )}

      {/* 알림: 오류 */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {/* 후보 리스트 (2대 이상) */}
      {results.length > 1 && (
        <section>
          <h2 className="mb-2 px-1 text-sm font-semibold text-slate-500">
            매칭된 차량 {results.length}대 — 선택하세요
          </h2>
          <ul className="flex flex-col gap-2">
            {results.map((r) => {
              const active = selected?.plateNo === r.plateNo;
              return (
                <li key={r.plateNo}>
                  <button
                    onClick={() => setSelected(r)}
                    className={`flex min-h-[60px] w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                      active
                        ? "border-brand-500 bg-brand-50 ring-1 ring-brand-200"
                        : "border-slate-200 bg-white active:bg-slate-50 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate">
                        <span className="font-bold text-slate-800">{r.plateNo}</span>
                        <span className="ml-2 text-sm text-slate-500">{r.routeName}</span>
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-slate-400">
                        {r.garageName}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 pl-3 text-sm font-semibold ${
                        r.live ? "text-brand-600" : "text-slate-300"
                      }`}
                    >
                      {r.live ? `${r.etaMinutes}분` : "신호없음"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* 선택 차량 대시보드 */}
      {selected && <EtaCard r={selected} />}

      {/* 결과 없음 */}
      {searched && !loading && results.length === 0 && !error && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-slate-400 shadow-card">
          매칭되는 차량이 없습니다. 끝자리를 다시 확인하세요.
        </div>
      )}

      <footer className="mt-auto pt-4 text-center text-xs text-slate-300">
        © ATEC Mobility · 티머니 단말기 A/S 지원
      </footer>
    </main>
  );
}

// ── ETA 대시보드 카드 ──────────────────────────────────────────
function EtaCard({ r }: { r: SearchResult }) {
  if (!r.live) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-card">
        <p className="text-lg font-bold text-slate-800">{r.plateNo}</p>
        <p className="mt-1 text-sm font-medium text-slate-600">
          {r.garageName}
          {r.operator && r.operator !== r.garageName && (
            <span className="text-slate-400"> · {r.operator}</span>
          )}
        </p>
        <p className="mt-3 text-sm text-amber-700">
          실시간 위치 신호가 없습니다. (미운행 / 차고지 대기 / 단말기 점검 가능성)
        </p>
        <p className="mt-1 text-xs text-slate-400">노선: {r.routeName}</p>
      </section>
    );
  }

  const etaLabel = r.etaUnknown
    ? "—"
    : r.arrived
      ? "종점 도착"
      : r.etaMinutes <= 2
        ? "곧 도착"
        : `약 ${r.etaMinutes}분`;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      {/* 카드 헤더 */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
        <div className="min-w-0">
          <p className="text-xl font-extrabold text-slate-900">{r.plateNo}</p>
          <p className="truncate text-sm font-semibold text-slate-600">{r.garageName}</p>
          <p className="truncate text-xs text-slate-400">
            {r.routeName}
            {r.operator && r.operator !== r.garageName && <> · {r.operator}</>}
          </p>
        </div>
        {r.atStop && (
          <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 ring-1 ring-emerald-200">
            정류소 정차중
          </span>
        )}
      </div>

      {/* 지표 */}
      <div className="grid grid-cols-2 gap-px bg-slate-100">
        <Stat label="남은 정류장" value={r.etaUnknown ? "—" : `${r.remainingStops}개`} />
        <Stat label="예상 도착(ETA)" value={etaLabel} highlight />
      </div>

      {r.etaUnknown && (
        <p className="bg-amber-50 px-6 py-3 text-xs text-amber-700">
          ⚠ 이 노선의 종점 정류장 정보가 아직 수집되지 않아 ETA를 계산할 수 없습니다.
          현재 위치(구간 {r.currentSeq})는 실시간으로 확인됩니다.
        </p>
      )}

      <div className="px-6 py-3 text-xs text-slate-400">
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
    <div className="bg-white px-5 py-5">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p
        className={`mt-1 font-extrabold ${
          highlight ? "text-3xl text-brand-600" : "text-2xl text-slate-800"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
