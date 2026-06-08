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
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
        aria-expanded={open}
        style={{ top: "max(0.5rem, env(safe-area-inset-top))" }}
        className="fixed left-2 z-[60] flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100/60 active:scale-95"
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
