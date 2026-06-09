"use client";

// ─────────────────────────────────────────────────────────────
// 메인 UI — ATEC 모빌리티 브랜드(라이트/크림슨) 테마
//   - 차량번호 4자리 검색
//   - 후보 차량 리스트 (여러 대일 때 선택)
//   - 남은 정류장 수 + ETA 대시보드
// ─────────────────────────────────────────────────────────────
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import AppChrome from "@/components/AppChrome";
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
    <AppChrome>
    <main className="safe-x safe-top safe-bottom mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col gap-5">
      {/* 헤더 / 브랜딩 */}
      <header className="flex flex-col items-center text-center">
        <Image
          src="/atec-logo.png"
          alt="ATEC 에이텍모빌리티"
          width={3481}
          height={315}
          priority
          className="h-8 w-auto sm:h-9"
        />
        <p className="mt-2.5 text-sm font-semibold tracking-wide text-slate-400">
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
                      <span className="flex items-center gap-2 truncate">
                        <span className="font-bold text-slate-800">{r.plateNo}</span>
                        <TypeBadge label={r.busTypeLabel} village={r.isVillage} />
                        <span className="truncate text-sm text-slate-500">{r.routeName}</span>
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

      <footer className="mt-auto flex flex-col items-center gap-2 pt-6 text-center">
        <p className="text-xs text-slate-300">
          © ATEC Mobility · 티머니 단말기 A/S 지원
          <a href="/admin" className="ml-2 underline decoration-slate-300 hover:text-slate-500">
            관리자
          </a>
        </p>
        <p className="px-4 text-[11px] leading-relaxed text-slate-400">
          실시간 위치·노선 정보 출처: 서울특별시 버스위치정보 등{" "}
          <a
            href="https://www.data.go.kr/data/15000332/openapi.do"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-slate-300 hover:text-slate-600"
          >
            공공데이터포털(data.go.kr)
          </a>
        </p>
        {/* 이용허락범위 마크: 공공누리 제1유형(출처표시) + CC BY(저작권 표시) */}
        <div className="flex items-center gap-4">
          <a
            href="https://www.kogl.or.kr/info/licenseType1.do"
            target="_blank"
            rel="noopener noreferrer"
            title="공공누리 제1유형: 출처표시"
          >
            <Image
              src="/kogl-type1.jpg"
              alt="공공누리 제1유형(출처표시)"
              width={574}
              height={241}
              className="h-7 w-auto"
            />
          </a>
          <a
            href="https://creativecommons.org/licenses/by/4.0/deed.ko"
            target="_blank"
            rel="noopener noreferrer"
            title="CC BY: 저작권 표시"
          >
            <Image
              src="/cc-by.png"
              alt="CC BY (저작권 표시)"
              width={403}
              height={141}
              className="h-7 w-auto"
            />
          </a>
        </div>
        <p className="text-[10px] leading-relaxed text-slate-300">
          공공저작물: 출처표시(제1유형) · 제3자 권리 포함: 저작권 표시
        </p>
      </footer>
    </main>
    </AppChrome>
  );
}

// ── ETA 대시보드 카드 ──────────────────────────────────────────
function EtaCard({ r }: { r: SearchResult }) {
  if (!r.live) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-card">
        <p className="flex items-center gap-2 text-lg font-bold text-slate-800">
          {r.plateNo}
          <TypeBadge label={r.busTypeLabel} village={r.isVillage} />
        </p>
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
        {/* 신호 없을 때: 오늘 기록해 둔 앞차로 위치 가늠 */}
        {r.frontTail && (
          <FrontCar tail={r.frontTail} gap={r.frontGap} live={r.frontLive} at={r.frontAt} prominent />
        )}
        {/* 마을버스: 신호 없어도 정류장(회차지) 목록은 표시 */}
        {r.isVillage && (
          <div className="mt-4 overflow-hidden rounded-xl border border-amber-200 bg-white">
            <StationList
              stations={r.stations}
              currentSeq={r.currentSeq}
              live={false}
              routeVehicles={r.routeVehicles}
            />
          </div>
        )}
      </section>
    );
  }

  // 메인: 도착 예상 시각(현재 한국시간 + 남은 분). 종점 도착/ETA미상일 땐 상태 문구.
  const etaLabel = r.etaUnknown
    ? "—"
    : r.arrived
      ? "종점 도착"
      : `${arrivalClock(r.etaMinutes)} 도착`;

  // 보조: 남은 시간. 도착/미상일 땐 표시 안 함.
  const etaRemain =
    r.etaUnknown || r.arrived
      ? undefined
      : r.etaMinutes <= 2
        ? "곧 도착"
        : `약 ${r.etaMinutes}분`;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      {/* 카드 헤더 */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xl font-extrabold text-slate-900">
            {r.plateNo}
            <TypeBadge label={r.busTypeLabel} village={r.isVillage} />
          </p>
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
        <Stat
          label="예상 도착(ETA)"
          value={etaLabel}
          sub={etaRemain}
          highlight
          extra={
            r.frontTail ? (
              <FrontCar tail={r.frontTail} gap={r.frontGap} live={r.frontLive} at={r.frontAt} />
            ) : undefined
          }
        />
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

      {/* 마을버스: 회차지 확인용 정류장 목록 + 현재 위치 */}
      {r.isVillage && (
        <StationList
          stations={r.stations}
          currentSeq={r.currentSeq}
          live={r.live}
          routeVehicles={r.routeVehicles}
        />
      )}
    </section>
  );
}

// seq가 어느 정류장 칸에 해당하는지: 정확히 일치하면 그 칸, 없으면 seq 이하 중 가장 큰 칸(직전 통과).
function stationIdxForSeq(stations: NonNullable<SearchResult["stations"]>, seq: number): number {
  let idx = -1;
  for (let i = 0; i < stations.length; i++) {
    if (stations[i].seq <= seq) idx = i;
    if (stations[i].seq >= seq) break;
  }
  return idx;
}

// 마을버스 정류장 목록 + 현재 위치. 회차지에서 대기/회차하는 마을버스 확인용.
// 같은 노선에서 운행 중인 모든 차량을 각 정류장에 차량번호 끝 4자리로 표시(선택 차량은 강조).
function StationList({
  stations,
  currentSeq,
  live,
  routeVehicles,
}: {
  stations: SearchResult["stations"];
  currentSeq: number;
  live: boolean;
  routeVehicles: SearchResult["routeVehicles"];
}) {
  const currentRef = useRef<HTMLLIElement | null>(null);

  // 선택 차량의 현재 정류장(자동 스크롤·강조용).
  const currentIdx = live && stations && currentSeq > 0 ? stationIdxForSeq(stations, currentSeq) : -1;

  // 정류장 칸별 차량 목록. 위치신호 있는 차량을 각자 sectOrd 위치 칸에 모은다.
  const vehiclesByIdx = new Map<number, NonNullable<SearchResult["routeVehicles"]>>();
  if (stations && routeVehicles) {
    for (const rv of routeVehicles) {
      const idx = stationIdxForSeq(stations, rv.sectOrd);
      if (idx < 0) continue;
      const list = vehiclesByIdx.get(idx) ?? [];
      list.push(rv);
      vehiclesByIdx.set(idx, list);
    }
  }
  const runningCount = routeVehicles?.length ?? 0;

  // 현재 정류장이 보이도록 자동 스크롤.
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: "center" });
  }, [currentIdx]);

  if (!stations || stations.length === 0) {
    return (
      <p className="px-6 py-3 text-xs text-slate-400">
        정류장 목록이 아직 수집되지 않았습니다(곧 자동 업데이트 예정).
      </p>
    );
  }

  return (
    <div className="border-t border-slate-100">
      <p className="flex items-center justify-between px-6 pt-3 text-xs font-semibold text-slate-500">
        <span>정류장 ({stations.length}개)</span>
        {runningCount > 0 ? (
          <span className="text-emerald-600">🚍 운행 중 {runningCount}대</span>
        ) : (
          <span className="text-slate-300">위치신호 없음</span>
        )}
      </p>
      <ol className="max-h-64 overflow-y-auto px-3 py-2">
        {stations.map((s, i) => {
          const isCurrent = i === currentIdx;
          const here = vehiclesByIdx.get(i);
          return (
            <li
              key={`${s.seq}-${i}`}
              ref={isCurrent ? currentRef : null}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ${
                isCurrent
                  ? "bg-emerald-50 font-bold text-emerald-700 ring-1 ring-emerald-200"
                  : here
                    ? "text-slate-700"
                    : "text-slate-500"
              }`}
            >
              <span className="w-6 shrink-0 text-right text-xs text-slate-300">{s.seq}</span>
              <span className="truncate">{s.nm}</span>
              {here && (
                <span className="ml-auto flex shrink-0 flex-wrap justify-end gap-1">
                  {here.map((rv, k) => (
                    <span
                      key={`${rv.tail}-${k}`}
                      title={rv.stopFlag === "1" ? "정차 중" : "운행 중"}
                      className={`rounded px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${
                        rv.sel
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                      }`}
                    >
                      🚍{rv.tail}
                    </span>
                  ))}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// 노선유형 뱃지: 마을버스는 초록 강조, 그 외(간선/지선/순환/광역/공항/심야/시내)는 회색.
function TypeBadge({ label, village }: { label: string | null; village: boolean }) {
  if (!label) return null;
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${
        village
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
          : "bg-slate-100 text-slate-500 ring-slate-200"
      }`}
    >
      {village ? "마을버스" : label}
    </span>
  );
}

// 남은 분(etaMinutes)을 한국시간(Asia/Seoul) 기준 도착 예상 시각 "ㅇㅇ시 ㅇㅇ분"으로 변환.
// 사용자 기기 시간대와 무관하게 항상 한국 시각으로 표시한다.
function arrivalClock(minutes: number): string {
  const arrive = new Date(Date.now() + minutes * 60_000);
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(arrive);
  const hh = parts.find((p) => p.type === "hour")?.value ?? "";
  const mm = parts.find((p) => p.type === "minute")?.value ?? "";
  return `${hh}시 ${mm}분`;
}

function Stat({
  label,
  value,
  sub,
  highlight,
  extra,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  extra?: React.ReactNode;
}) {
  return (
    <div className="bg-white px-5 py-5">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p
        className={`mt-1 font-extrabold ${
          highlight ? "text-[23px] text-brand-600" : "text-2xl text-slate-800"
        }`}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-sm font-semibold text-slate-400">{sub}</p>}
      {extra}
    </div>
  );
}

// 앞차(같은 노선 내 바로 앞 차량) 번호 표시. prominent=신호없음 카드용 강조, 그 외 ETA 옆 소형.
function FrontCar({
  tail,
  gap,
  live,
  at,
  prominent,
}: {
  tail: string;
  gap: number;
  live: boolean;
  at: string | null;
  prominent?: boolean;
}) {
  const gapLabel = gap > 0 ? `${gap}정거장 앞` : "";
  if (prominent) {
    return (
      <div className="mt-3 rounded-xl border border-amber-300 bg-white px-4 py-3">
        <p className="text-xs font-medium text-slate-400">
          오늘 기록된 앞차 (실제 앞차 번호판과 대조해 위치 가늠)
        </p>
        <p className="mt-1 flex flex-wrap items-baseline gap-2">
          <span className="rounded-lg bg-amber-100 px-2.5 py-1 text-lg font-extrabold tabular-nums text-amber-700 ring-1 ring-amber-200">
            🚌 {tail}
          </span>
          {(at || gapLabel) && (
            <span className="text-xs font-semibold text-slate-400">
              {at && `${at} 기준`}
              {at && gapLabel && " · "}
              {gapLabel}
            </span>
          )}
        </p>
        <p className="mt-1 text-[11px] text-slate-400">※ 배차 상황에 따라 정확하지 않을 수 있어요</p>
      </div>
    );
  }
  return (
    <p className="mt-1 flex flex-wrap items-center gap-1 text-xs font-semibold text-slate-400">
      앞차
      <span
        className="rounded bg-slate-100 px-1.5 py-0.5 font-bold tabular-nums text-slate-600 ring-1 ring-slate-200"
        title={[gapLabel, live ? "실시간" : at ? `${at} 기준` : ""].filter(Boolean).join(" · ")}
      >
        🚌{tail}
      </span>
      <span className="text-[11px] font-normal text-slate-300">정확하지 않을 수 있음</span>
    </p>
  );
}
