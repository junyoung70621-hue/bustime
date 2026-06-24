"use client";

// ─────────────────────────────────────────────────────────────
// 작성/수정 모달 (전체 폼 상태 소유 + 단계 전환 + PDF 생성/업로드)
//   step1(기본정보) → step2(서명/미리보기) → 저장(PDF→Storage+DB)
//   editId 가 있으면 수정 모드: 기존 기록 로딩 + 수정자명 필수 + PUT 저장.
//   ※ 서명은 DB에 보관되어 수정 시 그대로 유지됨(변경 시에만 재서명).
// ─────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";
import { itemsForModel, itemsForTagless } from "@/lib/daepyecha/templates";
import { generatePdfAndJpg } from "@/lib/daepyecha/pdf";
import type { ConfirmationRow, FormState, Model, NewReused } from "@/lib/daepyecha/types";
import Step1Input from "./Step1Input";
import Step2Sign from "./Step2Sign";

function todayStr(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function emptyForm(): FormState {
  return {
    center: "",
    operator: "",
    officeType: "본사",
    purpose: "대폐차",
    tagless: false,
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
  };
}

export default function DaepyechaModal({
  editId,
  onClose,
  onSaved,
}: {
  editId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!editId;
  const [step, setStep] = useState<"input" | "sign">("input");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);
  const [modifiedBy, setModifiedBy] = useState("");
  const touched = useRef<boolean[]>([]); // 행별 수량 수동수정 여부
  const captureRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<FormState>(emptyForm);

  // 수정 모드: 기존 기록 로딩
  useEffect(() => {
    if (!editId) return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/daepyecha/${editId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "불러오기 실패");
        const r = json.row as ConfirmationRow;
        if (!alive) return;
        touched.current = (r.items ?? []).map(() => true); // 기존 수량 유지
        setData({
          center: r.center,
          operator: r.operator,
          officeType: (r.office_type as FormState["officeType"]) || "본사",
          purpose: (r.purpose as FormState["purpose"]) || "대폐차",
          tagless: r.tagless ?? false,
          model: r.model,
          vehicleCount: r.vehicle_count,
          vehicleNumbers: r.vehicle_numbers,
          etc: r.etc ?? "",
          issuedDate: r.issued_date,
          items: r.items ?? [],
          receiverName: r.receiver_name,
          receiverSig: r.receiver_sig ?? null, // 기존 서명 유지(없으면 재서명)
          transferorName: r.transferor_name,
          transferorSig: r.transferor_sig ?? null,
        });
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "불러오기 실패");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [editId]);

  const patch = (p: Partial<FormState>) => setData((d) => ({ ...d, ...p }));

  function onModelChange(m: Model) {
    touched.current = [];
    setData((d) => ({
      ...d,
      model: m,
      // 태그리스면 모델을 바꿔도 품목은 태그리스 공통 품목 유지
      items: d.tagless ? itemsForTagless(d.vehicleCount) : itemsForModel(m, d.vehicleCount),
    }));
  }
  function onToggleTagless(next: boolean) {
    touched.current = [];
    setData((d) => ({
      ...d,
      tagless: next,
      items: next
        ? itemsForTagless(d.vehicleCount)
        : d.model
          ? itemsForModel(d.model, d.vehicleCount)
          : [],
    }));
  }
  function onCountChange(n: number) {
    setData((d) => ({
      ...d,
      vehicleCount: n,
      // 미수정 행은 대당 기본수량 × 대수로 재계산(perUnit 미지정 시 1)
      items: d.items.map((it, i) =>
        touched.current[i] ? it : { ...it, qty: (it.perUnit ?? 1) * n },
      ),
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
    if (isEdit && !modifiedBy.trim()) return setError("수정자명을 입력하세요.");
    if (!captureRef.current) return setError("미리보기가 준비되지 않았습니다.");
    setError(null);
    setSaving(true);
    try {
      const { pdf, jpg } = await generatePdfAndJpg(captureRef.current);
      const meta = {
        center: data.center,
        operator: data.operator,
        office_type: data.officeType,
        model: data.model,
        purpose: data.purpose,
        tagless: data.tagless,
        vehicle_count: data.vehicleCount,
        vehicle_numbers: data.vehicleNumbers,
        items: data.items,
        etc: data.etc,
        receiver_name: data.receiverName,
        transferor_name: data.transferorName,
        receiver_sig: data.receiverSig,
        transferor_sig: data.transferorSig,
        issued_date: data.issuedDate,
        ...(isEdit ? { modified_by: modifiedBy.trim() } : {}),
      };
      const fd = new FormData();
      fd.append("pdf", pdf, "confirmation.pdf");
      fd.append("jpg", jpg, "confirmation.jpg"); // 팀즈 업로드용(수도권)
      fd.append("meta", JSON.stringify(meta));
      const res = await fetch(isEdit ? `/api/daepyecha/${editId}` : "/api/daepyecha", {
        method: isEdit ? "PUT" : "POST",
        body: fd,
      });
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
            {isEdit ? "확인서 수정" : "대폐차 확인서"} — {step === "input" ? "기본 정보" : "서명"}
          </h2>
          <button onClick={onClose} aria-label="닫기" className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="py-10 text-center text-sm text-slate-400">불러오는 중…</p>
          ) : step === "input" ? (
            <Step1Input
              data={data}
              patch={patch}
              onModelChange={onModelChange}
              onToggleTagless={onToggleTagless}
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
              isEdit={isEdit}
              modifiedBy={modifiedBy}
              onModifiedBy={setModifiedBy}
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
