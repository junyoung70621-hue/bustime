"use client";

// ─────────────────────────────────────────────────────────────
// 서명 입력 오버레이: 이름(정자) + 캔버스 서명 → 투명 PNG dataURL
//   react-signature-canvas 기반. touch-action:none 로 모바일 스크롤 방지.
// ─────────────────────────────────────────────────────────────
import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";

export default function SignaturePad({
  title,
  initialName,
  onConfirm,
  onClose,
}: {
  title: string;
  initialName: string;
  onConfirm: (name: string, sig: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<SignatureCanvas>(null);
  const [name, setName] = useState(initialName);
  const [err, setErr] = useState<string | null>(null);

  function confirm() {
    if (!name.trim()) return setErr("이름(정자)을 입력하세요.");
    const pad = ref.current;
    if (!pad || pad.isEmpty()) return setErr("서명을 그려주세요.");
    onConfirm(name.trim(), pad.toDataURL("image/png"));
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center">
      <div className="safe-bottom w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
        <h3 className="text-base font-bold text-slate-800">{title}</h3>

        <label className="mt-3 block text-sm font-semibold text-slate-600">이름 (정자)</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 홍길동"
          className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />

        <label className="mt-3 block text-sm font-semibold text-slate-600">서명 (인)</label>
        <div className="mt-1 overflow-hidden rounded-xl border border-slate-300 bg-slate-50">
          <SignatureCanvas
            ref={ref}
            penColor="#111827"
            canvasProps={{
              width: 340,
              height: 170,
              className: "w-full",
              style: { touchAction: "none" },
            }}
          />
        </div>

        {err && <p className="mt-2 text-sm font-medium text-red-600">{err}</p>}

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => ref.current?.clear()}
            className="h-11 flex-1 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-50"
          >
            지우기
          </button>
          <button
            onClick={onClose}
            className="h-11 flex-1 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-50"
          >
            취소
          </button>
          <button
            onClick={confirm}
            className="h-11 flex-1 rounded-xl bg-brand-600 font-bold text-white hover:bg-brand-700"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
