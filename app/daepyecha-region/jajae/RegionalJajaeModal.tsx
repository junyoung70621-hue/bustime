"use client";

// ─────────────────────────────────────────────────────────────
// 대전·세종 자재 지급확인서 작성/수정 모달 (수도권과 동일 방식)
//   step1(기본정보+품목) → step2(서명/미리보기) → 저장(PDF→Storage+DB, variant=regional)
//   모델 B500/B650 × 용도(대폐차/증차) 에 따라 품목 자동 구성. 태그리스 없음.
//   ConfirmationForm·SignaturePad 는 기존 daepyecha 컴포넌트 재사용.
// ─────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";
import { REGIONS, REG_JAJAE_MODELS, regJajaeItemsFor } from "@/lib/daepyecha-regional/templates";
import type { RegJajaeModel, RegJajaePurpose } from "@/lib/daepyecha-regional/templates";
import { generatePdfBlob } from "@/lib/daepyecha/pdf";
import type { ConfirmationRow, FormState, ItemState, NewReused, OfficeType, Purpose } from "@/lib/daepyecha/types";
import type { Region } from "@/lib/checklist-regional/types";
import { itemVariants, firstUnselectedVariant } from "@/lib/daepyecha/templates";
import ConfirmationForm from "@/app/daepyecha/ConfirmationForm";
import SignaturePad from "@/app/daepyecha/SignaturePad";

// FormState 와 동일하되 model=지역 기종(B500/B650), center=지역(대전/세종 등)
type RegForm = Omit<FormState, "model" | "center"> & { model: RegJajaeModel | ""; center: Region | "" };

const OFFICE_TYPES: OfficeType[] = ["본사", "영업소"];
const PURPOSES: Purpose[] = ["대폐차", "증차"];

function todayStr(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function emptyForm(): RegForm {
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

export default function RegionalJajaeModal({
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
  const [pad, setPad] = useState<null | "receiver" | "transferor">(null);
  const touched = useRef<boolean[]>([]);
  const captureRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<RegForm>(emptyForm);

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
        touched.current = (r.items ?? []).map(() => true);
        setData({
          center: r.center as unknown as Region,
          operator: r.operator,
          officeType: (r.office_type as OfficeType) || "본사",
          purpose: (r.purpose as Purpose) || "대폐차",
          tagless: false,
          model: r.model as RegJajaeModel,
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

  const patch = (p: Partial<RegForm>) => setData((d) => ({ ...d, ...p }));

  function rebuildItems(model: RegJajaeModel | "", purpose: RegJajaePurpose, count: number): ItemState[] {
    return model ? regJajaeItemsFor(model, purpose, count) : [];
  }
  function onModelChange(m: RegJajaeModel | "") {
    touched.current = [];
    setData((d) => ({ ...d, model: m, items: rebuildItems(m, d.purpose, d.vehicleCount) }));
  }
  function onPurposeChange(p: RegJajaePurpose) {
    touched.current = [];
    setData((d) => ({ ...d, purpose: p, items: rebuildItems(d.model, p, d.vehicleCount) }));
  }
  function onCountChange(n: number) {
    setData((d) => ({
      ...d,
      vehicleCount: n,
      items: d.items.map((it, i) => (touched.current[i] ? it : { ...it, qty: (it.perUnit ?? 1) * n })),
    }));
  }
  function onItemQty(i: number, qty: number) {
    touched.current[i] = true;
    setData((d) => ({ ...d, items: d.items.map((it, idx) => (idx === i ? { ...it, qty } : it)) }));
  }
  function onItemNR(i: number, v: NewReused) {
    setData((d) => ({ ...d, items: d.items.map((it, idx) => (idx === i ? { ...it, newReused: v } : it)) }));
  }
  // 형(type) 선택: 같은 값 다시 누르면 해제(전체 표기로 복귀)
  function onItemVariant(i: number, v: string) {
    setData((d) => ({ ...d, items: d.items.map((it, idx) => (idx === i ? { ...it, variant: it.variant === v ? null : v } : it)) }));
  }

  function goSign() {
    if (!data.center) return setError("지역을 선택하세요.");
    if (!data.operator.trim()) return setError("운수사를 입력하세요.");
    if (!data.model) return setError("모델을 선택하세요.");
    if (!data.vehicleCount || data.vehicleCount <= 0) return setError("수량(대수)을 입력하세요.");
    const missVar = firstUnselectedVariant(data.items);
    if (missVar) return setError(`"${missVar}" 형을 선택하세요. (형 선택 필수)`);
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
      const blob = await generatePdfBlob(captureRef.current);
      const meta = {
        center: data.center,
        operator: data.operator,
        office_type: data.officeType,
        model: data.model,
        purpose: data.purpose,
        tagless: false,
        vehicle_count: data.vehicleCount,
        vehicle_numbers: data.vehicleNumbers,
        items: data.items,
        etc: data.etc,
        receiver_name: data.receiverName,
        transferor_name: data.transferorName,
        receiver_sig: data.receiverSig,
        transferor_sig: data.transferorSig,
        issued_date: data.issuedDate,
        variant: "regional",
        ...(isEdit ? { modified_by: modifiedBy.trim() } : {}),
      };
      const fd = new FormData();
      fd.append("pdf", blob, "confirmation.pdf");
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
            {isEdit ? "확인서 수정 (지역)" : "자재 지급확인서 (지역)"} — {step === "input" ? "기본 정보" : "서명"}
          </h2>
          <button onClick={onClose} aria-label="닫기" className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <div className="overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="py-10 text-center text-sm text-slate-400">불러오는 중…</p>
          ) : step === "input" ? (
            <div className="flex flex-col gap-3">
              {/* 용도 */}
              <Field label="용도">
                <div className="flex overflow-hidden rounded-xl ring-1 ring-slate-200">
                  {PURPOSES.map((p) => (
                    <button key={p} type="button" onClick={() => onPurposeChange(p)} className={`h-11 flex-1 text-sm font-bold transition ${data.purpose === p ? "bg-brand-600 text-white" : "bg-white text-slate-500"}`}>{p}</button>
                  ))}
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="지역">
                  <select value={data.center} onChange={(e) => patch({ center: e.target.value as Region })} className={selectCls}>
                    <option value="">선택</option>
                    {REGIONS.map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </Field>
                <Field label="모델">
                  <select value={data.model} onChange={(e) => onModelChange(e.target.value as RegJajaeModel)} className={selectCls}>
                    <option value="">선택</option>
                    {REG_JAJAE_MODELS.map((m) => (<option key={m} value={m}>{m}</option>))}
                  </select>
                </Field>
              </div>

              <Field label="운수사 / 구분">
                <div className="flex gap-2">
                  <input value={data.operator} onChange={(e) => patch({ operator: e.target.value })} placeholder="예: ○○운수" className={`${inputCls} flex-1`} />
                  <div className="flex shrink-0 overflow-hidden rounded-xl ring-1 ring-slate-200">
                    {OFFICE_TYPES.map((o) => (
                      <button key={o} type="button" onClick={() => patch({ officeType: o })} className={`h-11 px-3 text-sm font-bold transition ${data.officeType === o ? "bg-brand-600 text-white" : "bg-white text-slate-500"}`}>{o}</button>
                    ))}
                  </div>
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="수량 (차량 대수)">
                  <input type="number" min={0} inputMode="numeric" value={data.vehicleCount || ""} onChange={(e) => onCountChange(Number(e.target.value) || 0)} placeholder="예: 3" className={inputCls} />
                </Field>
                <Field label="지급 날짜">
                  <input type="date" value={data.issuedDate} onChange={(e) => patch({ issuedDate: e.target.value })} className={inputCls} />
                </Field>
              </div>

              <Field label="차량번호 (선택)">
                <input value={data.vehicleNumbers} onChange={(e) => patch({ vehicleNumbers: e.target.value })} placeholder="예: 70-1234" className={inputCls} />
              </Field>

              <Field label="기타사항 (선택)">
                <textarea value={data.etc} onChange={(e) => patch({ etc: e.target.value })} placeholder="기타 특이사항이 있으면 입력" rows={2} className={`${inputCls} h-auto py-2`} />
              </Field>

              {data.items.length > 0 ? (
                <div className="rounded-xl border border-slate-200">
                  <p className="border-b border-slate-100 px-3 py-2 text-sm font-bold text-slate-600">품목 ({data.items.length}) — 수량은 대수로 자동 입력, 수정 가능</p>
                  <ul className="flex flex-col divide-y divide-slate-100">
                    {data.items.map((it, i) => {
                      const variantOpts = itemVariants(it.name);
                      return (
                        <li key={i} className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 shrink-0 text-xs text-slate-400">{i + 1}</span>
                            <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{it.name}</span>
                            {it.hasNewReused && (
                              <span className="flex shrink-0 overflow-hidden rounded-md ring-1 ring-slate-200">
                                {(["신규", "재활용"] as NewReused[]).map((v) => (
                                  <button key={v} type="button" onClick={() => onItemNR(i, v)} className={`px-2 py-1 text-xs font-semibold ${it.newReused === v ? "bg-brand-600 text-white" : "bg-white text-slate-500"}`}>{v}</button>
                                ))}
                              </span>
                            )}
                            <input type="number" min={0} inputMode="numeric" value={it.qty || ""} onChange={(e) => onItemQty(i, Number(e.target.value) || 0)} className="h-8 w-14 shrink-0 rounded-lg border border-slate-300 px-2 text-center text-sm outline-none focus:border-brand-500" />
                          </div>
                          {variantOpts && (
                            <div className="mt-1.5 flex items-center gap-2 pl-7">
                              <span className="shrink-0 text-xs text-slate-400">형 선택 (선택 시 그 형만 표기)</span>
                              <span className="flex shrink-0 overflow-hidden rounded-md ring-1 ring-slate-200">
                                {variantOpts.map((v) => (
                                  <button key={v} type="button" onClick={() => onItemVariant(i, v)} className={`px-2 py-1 text-xs font-semibold ${it.variant === v ? "bg-brand-600 text-white" : "bg-white text-slate-500"}`}>{v}</button>
                                ))}
                              </span>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-400">모델을 선택하면 품목이 표시됩니다.</p>
              )}

              {error && <p className="text-sm font-medium text-red-600">{error}</p>}
              <button onClick={goSign} className="h-12 w-full rounded-xl bg-brand-600 text-base font-bold text-white hover:bg-brand-700">다음 (서명)</button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {isEdit && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <label className="mb-1 block text-sm font-bold text-amber-800">수정자명 (필수)</label>
                  <input value={modifiedBy} onChange={(e) => setModifiedBy(e.target.value)} placeholder="수정하는 사람 이름" className="h-11 w-full rounded-lg border border-amber-300 px-3 text-base outline-none focus:border-amber-500" />
                  <p className="mt-1.5 text-xs text-amber-700">* 기존 서명은 자동 유지됩니다. 변경할 때만 다시 서명하세요.</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <SignButton label="인수자 (운수회사)" name={data.receiverName} done={!!data.receiverSig} onClick={() => setPad("receiver")} />
                <SignButton label="인계자 (자사 직원)" name={data.transferorName} done={!!data.transferorSig} onClick={() => setPad("transferor")} />
              </div>

              <p className="text-xs text-slate-400">미리보기 (저장 시 이 내용 그대로 PDF 생성)</p>
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
                <div ref={captureRef} className="mx-auto w-[794px]">
                  <ConfirmationForm data={data as unknown as FormState} centerSuffix="" />
                </div>
              </div>

              {error && <p className="text-sm font-medium text-red-600">{error}</p>}
              <div className="flex gap-2">
                <button onClick={() => { setError(null); setStep("input"); }} disabled={saving} className="h-12 flex-1 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">이전</button>
                <button onClick={save} disabled={saving} className="h-12 flex-[2] rounded-xl bg-brand-600 font-bold text-white hover:bg-brand-700 disabled:opacity-50">{saving ? "저장 중…" : "저장 (PDF 보관)"}</button>
              </div>
            </div>
          )}
        </div>

        {pad === "receiver" && (
          <SignaturePad title="인수자 서명 (운수회사)" initialName={data.receiverName}
            onConfirm={(name, sig) => { patch({ receiverName: name, receiverSig: sig }); setPad(null); }} onClose={() => setPad(null)} />
        )}
        {pad === "transferor" && (
          <SignaturePad title="인계자 서명 (자사 직원)" initialName={data.transferorName}
            onConfirm={(name, sig) => { patch({ transferorName: name, transferorSig: sig }); setPad(null); }} onClose={() => setPad(null)} />
        )}
      </div>
    </div>
  );
}

const inputCls = "h-11 w-full rounded-xl border border-slate-300 px-3 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";
const selectCls = "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function SignButton({ label, name, done, onClick }: { label: string; name: string; done: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition ${done ? "border-emerald-300 bg-emerald-50" : "border-slate-300 bg-white hover:bg-slate-50"}`}>
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <span className="text-sm font-bold text-slate-800">{done ? `${name} ✓ 서명완료` : "✍ 사인 입력"}</span>
    </button>
  );
}
