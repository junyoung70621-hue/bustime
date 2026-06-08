"use client";

// ─────────────────────────────────────────────────────────────
// 페이지 공용 크롬: 좌상단 햄버거 + 사이드바 + children
//   - app/page.tsx, app/daepyecha/page.tsx 등에서 콘텐츠를 감싸 사용
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import Sidebar from "./Sidebar";

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="메뉴 열기"
        className="safe-top fixed left-2 top-2 z-30 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/90 text-slate-700 shadow-sm backdrop-blur transition hover:bg-white active:scale-95"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      </button>
      <Sidebar open={open} onClose={() => setOpen(false)} />
      {children}
    </>
  );
}
