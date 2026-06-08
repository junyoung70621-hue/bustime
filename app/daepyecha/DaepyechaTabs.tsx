"use client";

// ─────────────────────────────────────────────────────────────
// 대폐차 페이지 상단 탭: 자재 지급확인서 / 설치 완료 체크리스트
//   탭 전환 시 해당 관리 목록(각자 제목 보유) 표시.
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import DaepyechaList from "./DaepyechaList";
import ChecklistList from "./checklist/ChecklistList";

const TABS = [
  { key: "jajae", label: "자재 지급확인서" },
  { key: "checklist", label: "설치 완료 체크리스트" },
] as const;

export default function DaepyechaTabs() {
  const [tab, setTab] = useState<"jajae" | "checklist">("jajae");
  return (
    <main className="safe-x safe-top safe-bottom mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col gap-3">
      {/* 탭 바 (좌상단 햄버거 공간 확보) */}
      <div className="flex gap-1.5 pl-12">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`h-10 flex-1 rounded-xl text-sm font-bold transition ${
              tab === t.key
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "jajae" ? <DaepyechaList /> : <ChecklistList />}
    </main>
  );
}
