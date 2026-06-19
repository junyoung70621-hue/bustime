"use client";

// ─────────────────────────────────────────────────────────────
// 대폐차(지역) 페이지 상단 탭: 자재 지급확인서 / 설치 완료 체크리스트
//   수도권(/daepyecha)과 동일 구성, 대상은 대전·세종 등 지역.
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import RegionalJajaeList from "./jajae/RegionalJajaeList";
import RegionalChecklistList from "@/app/daepyecha/checklist-regional/RegionalChecklistList";

const TABS = [
  { key: "jajae", label: "자재 지급확인서" },
  { key: "checklist", label: "설치 완료 체크리스트" },
] as const;

export default function RegionTabs() {
  const [tab, setTab] = useState<"jajae" | "checklist">("jajae");
  return (
    <main className="safe-x safe-top safe-bottom mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col gap-3">
      <div className="flex gap-1.5 pl-12">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`h-10 flex-1 rounded-xl text-sm font-bold transition ${
              tab === t.key ? "bg-brand-600 text-white shadow-sm" : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "jajae" ? <RegionalJajaeList /> : <RegionalChecklistList />}
    </main>
  );
}
