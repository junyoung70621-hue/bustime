"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AdminLogin() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "로그인 실패");
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="safe-x mx-auto flex min-h-[100dvh] max-w-sm flex-col justify-center gap-6 py-10">
      <div className="flex flex-col items-center">
        <Image src="/atec-logo.png" alt="ATEC" width={3481} height={315} priority className="h-8 w-auto" />
        <p className="mt-2 text-sm font-semibold text-slate-400">관리자 로그인</p>
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
          placeholder="관리자 비밀번호"
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
        ← 검색 화면으로
      </a>
    </main>
  );
}
