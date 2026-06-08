"use client";

// ─────────────────────────────────────────────────────────────
// 신규 작성 모달 (전체 폼 상태 소유 + 단계 전환 + PDF 생성/업로드)
//   step1(기본정보) → step2(서명/미리보기) → 저장(PDF→Storage+DB)
// ─────────────────────────────────────────────────────────────
import { useRef, useState } from "react";
import { itemsForModel } from "@/lib/daepyecha/templates";
import { generatePdfBlob } from "@/lib/daepyecha/pdf";
import type { FormState, Model, NewReused } from "@/lib/daepyecha/types";
import Step1Input from "./Step1Input";
import Step2Sign from "./Step2Sign";

function todayStr(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function DaepyechaModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [step, setStep] = useState<"input" | "sign">("input");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const touched = useRef<boolean[]>([]); // 행별 수량 수동수정 여부
  const captureRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<FormState>({
    center: "",
    operator: "",
    officeType: "본사",
    purpose: "대폐차",
    model: "",
    vehicleCount: 0,
    vehicleNumbers: "",
    etc: "",
    issuedDate: todayStr(),
    items: [],
    receiverName: "",
    receiverSig: null,
    transferorName: "",
    transferorSig: null,
  });

  const patch = (p: Partial<FormState>) => setData((d) => ({ ...d, ...p }));

  function onModelChange(m: Model) {
    touched.current = [];
    setData((d) => ({ ...d, model: m, items: itemsForModel(m, d.vehicleCount) }));
  }
  function onCountChange(n: number) {
    setData((d) => ({
      ...d,
      vehicleCount: n,
      items: d.items.map((it, i) => (touched.current[i] ? it : { ...it, qty: n })),
    }));
  }
  function onItemQty(i: number, qty: number) {
    touched.current[i] = true;
    setData((d) => ({ ...d, items: d.items.map((it, idx) => (idx === i ? { ...it, qty } : it)) }));
  }
  function onItemNR(i: number, v: NewReused) {
    setData((d) => ({
      ...d,
      items: d.items.map((it, idx) => (idx === i ? { ...it, newReused: v } : it)),
    }));
  }

  function goSign() {
    if (!data.center) return setError("센터를 선택하세요.");
    if (!data.operator.trim()) return setError("운수사를 입력하세요.");
    if (!data.model) return setError("모델을 선택하세요.");
    if (!data.vehicleCount || data.vehicleCount <= 0) return setError("수량(대수)을 입력하세요.");
    setError(null);
    setStep("sign");
  }

  async function save() {
    if (!data.receiverName || !data.receiverSig) return setError("인수자 서명을 완료하세요.");
    if (!data.transferorName || !data.transferorSig) return setError("인계자 서명을 완료하세요.");
    if (!captureRef.current) return setError("미리보기가 준비되지 않았습니다.");
    setError(null);
    setSaving(true);
    try {
      const blob = await generatePdfBlob(captureRef.current);
      const meta = {
        center: data.center,
        operator: data.operator,
        office_type: data.officeType,
        model: data.model,
        purpose: data.purpose,
        vehicle_count: data.vehicleCount,
        vehicle_numbers: data.vehicleNumbers,
        items: data.items,
        receiver_name: data.receiverName,
        transferor_name: data.transferorName,
        issued_date: data.issuedDate,
      };
      const fd = new FormData();
      fd.append("pdf", blob, "confirmation.pdf");
      fd.append("meta", JSON.stringify(meta));
      const res = await fetch("/api/daepyecha", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "저장 실패");
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 중 오류가 발생했습니다.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="safe-bottom flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-2xl bg-white sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="text-base font-bold text-slate-800">
            대폐차 확인서 — {step === "input" ? "기본 정보" : "서명"}
          </h2>
          <button onClick={onClose} aria-label="닫기" className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">
          {step === "input" ? (
            <Step1Input
              data={data}
              patch={patch}
              onModelChange={onModelChange}
              onCountChange={onCountChange}
              onItemQty={onItemQty}
              onItemNR={onItemNR}
              onNext={goSign}
              error={error}
            />
          ) : (
            <Step2Sign
              data={data}
              previewRef={captureRef}
              onSetReceiver={(name, sig) => patch({ receiverName: name, receiverSig: sig })}
              onSetTransferor={(name, sig) => patch({ transferorName: name, transferorSig: sig })}
              onBack={() => {
                setError(null);
                setStep("input");
              }}
              onSave={save}
              saving={saving}
              error={error}
            />
          )}
        </div>
      </div>
    </div>
  );
}
