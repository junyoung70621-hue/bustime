"use client";

import { useState } from "react";
import Image from "next/image";

// 비밀번호 1개짜리 로그인 폼 (관리자 / 대폐차 현장 공용)
export default function PasswordLogin({ title, endpoint, next, placeholder }: { title: string; endpoint: string; next: string; placeholder: string }) {
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "로그인 실패");
      // 화면 내부 이동(router)은 로그인 전 받아둔 "로그인으로 보내기" 결과를 재사용하거나
      // 다음 화면을 받는 동안 로그인 화면에 멈춘 것처럼 보임 → 새 쿠키로 페이지를 새로 연다.
      // 이동하는 동안 버튼은 "확인중…" 유지(loading 을 풀지 않음).
      window.location.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류");
      setLoading(false);
    }
  }

  return (
    <main className="safe-x mx-auto flex min-h-[100dvh] max-w-sm flex-col justify-center gap-6 py-10">
      <div className="flex flex-col items-center">
        <Image src="/atec-logo.png" alt="ATEC" width={3481} height={315} priority className="h-8 w-auto" />
        <p className="mt-2 text-sm font-semibold text-slate-400">{title}</p>
      </div>

      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-card"
      >
        <label htmlFor="pw" className="text-sm font-bold text-slate-700">
          비밀번호
        </label>
        <input
          id="pw"
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder={placeholder}
          autoFocus
          className="h-12 rounded-xl border border-slate-300 px-4 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="h-12 rounded-xl bg-brand-600 font-bold text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "확인중…" : "로그인"}
        </button>
      </form>

      <a href="/" className="text-center text-xs text-slate-400 hover:text-slate-600">
        검색 화면으로
      </a>
    </main>
  );
}
