"use client";

// ─────────────────────────────────────────────────────────────
// 좌측 슬라이드 사이드바 내비게이션 (모바일 우선)
//   - 차량도착정보 조회(/)  · 대폐차(/daepyecha)
//   - backdrop/Esc 닫기, body 스크롤 락, safe-area 대응
// ─────────────────────────────────────────────────────────────
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const NAV = [
  { href: "/", label: "차량도착정보 조회", emoji: "🚌" },
  { href: "/daepyecha", label: "대폐차(수도권)", emoji: "📄" },
  { href: "/daepyecha-region", label: "대폐차(지역)", emoji: "📍" },
];

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <>
      {/* 배경 */}
      <div
        onClick={onClose}
        aria-hidden
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-200 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      {/* 드로어 */}
      <aside
        aria-hidden={!open}
        className={`safe-top safe-bottom fixed left-0 top-0 z-50 flex h-[100dvh] w-72 max-w-[80vw] flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* 헤더: 좌상단 햄버거(AppChrome, 토글)가 떠 있으므로 로고는 그만큼 우측으로 */}
        <div className="flex items-center border-b border-slate-100 py-4 pl-14 pr-4">
          <Image src="/atec-logo.png" alt="ATEC" width={3481} height={315} className="h-6 w-auto" />
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {NAV.map((item) => {
            // 정확 일치 또는 하위 경로만 active (/daepyecha 가 /daepyecha-region 까지 잡지 않도록 트레일링 슬래시 기준)
            const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition ${
                  active
                    ? "bg-brand-50 text-brand-700 ring-1 ring-brand-100"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="text-lg">{item.emoji}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <p className="mt-auto px-4 py-3 text-[11px] text-slate-300">ATEC Mobility</p>
      </aside>
    </>
  );
}
