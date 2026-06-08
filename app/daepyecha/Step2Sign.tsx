"use client";

// ─────────────────────────────────────────────────────────────
// 신규 작성 2단계: 미리보기 + 서명
//   인수자(운수회사) / 인계자(자사 직원) 각각 이름(정자) + 서명
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import type { FormState } from "@/lib/daepyecha/types";
import ConfirmationForm from "./ConfirmationForm";
import SignaturePad from "./SignaturePad";

export default function Step2Sign({
  data,
  previewRef,
  isEdit,
  modifiedBy,
  onModifiedBy,
  onSetReceiver,
  onSetTransferor,
  onBack,
  onSave,
  saving,
  error,
}: {
  data: FormState;
  previewRef: React.RefObject<HTMLDivElement>;
  isEdit: boolean;
  modifiedBy: string;
  onModifiedBy: (v: string) => void;
  onSetReceiver: (name: string, sig: string) => void;
  onSetTransferor: (name: string, sig: string) => void;
  onBack: () => void;
  onSave: () => void;
  saving: boolean;
  error: string | null;
}) {
  const [pad, setPad] = useState<null | "receiver" | "transferor">(null);

  return (
    <div className="flex flex-col gap-3">
      {isEdit && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <label className="mb-1 block text-sm font-bold text-amber-800">수정자명 (필수)</label>
          <input
            value={modifiedBy}
            onChange={(e) => onModifiedBy(e.target.value)}
            placeholder="수정하는 사람 이름"
            className="h-11 w-full rounded-lg border border-amber-300 px-3 text-base outline-none focus:border-amber-500"
          />
          <p className="mt-1.5 text-xs text-amber-700">
            * 수정 시 서명은 다시 입력해야 합니다. 최종수정일은 목록에만 표시됩니다.
          </p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <SignButton
          label="인수자 (운수회사)"
          name={data.receiverName}
          done={!!data.receiverSig}
          onClick={() => setPad("receiver")}
        />
        <SignButton
          label="인계자 (자사 직원)"
          name={data.transferorName}
          done={!!data.transferorSig}
          onClick={() => setPad("transferor")}
        />
      </div>

      {/* 미리보기 (가로 스크롤). 이 노드를 그대로 PDF로 캡처 */}
      <p className="text-xs text-slate-400">미리보기 (저장 시 이 내용 그대로 PDF 생성)</p>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
        <div ref={previewRef} className="mx-auto w-[794px]">
          <ConfirmationForm data={data} />
        </div>
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={onBack}
          disabled={saving}
          className="h-12 flex-1 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          이전
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="h-12 flex-[2] rounded-xl bg-brand-600 font-bold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? "저장 중…" : "저장 (PDF 보관)"}
        </button>
      </div>

      {pad === "receiver" && (
        <SignaturePad
          title="인수자 서명 (운수회사)"
          initialName={data.receiverName}
          onConfirm={(name, sig) => {
            onSetReceiver(name, sig);
            setPad(null);
          }}
          onClose={() => setPad(null)}
        />
      )}
      {pad === "transferor" && (
        <SignaturePad
          title="인계자 서명 (자사 직원)"
          initialName={data.transferorName}
          onConfirm={(name, sig) => {
            onSetTransferor(name, sig);
            setPad(null);
          }}
          onClose={() => setPad(null)}
        />
      )}
    </div>
  );
}

function SignButton({
  label,
  name,
  done,
  onClick,
}: {
  label: string;
  name: string;
  done: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition ${
        done ? "border-emerald-300 bg-emerald-50" : "border-slate-300 bg-white hover:bg-slate-50"
      }`}
    >
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <span className="text-sm font-bold text-slate-800">
        {done ? `${name} ✓ 서명완료` : "✍ 사인 입력"}
      </span>
    </button>
  );
}
