"use client";

// ─────────────────────────────────────────────────────────────
// 고속/시외 증·대폐차 설치확인서 작성/수정 모달
//   헤더 입력 + 자재 체크(수량/완료) + 고속사 서명 → GosiForm 캡처 → PDF 업로드
//   백엔드는 /api/checklist 공유(variant='gosi'). 티머니측은 서명 없이 빈칸.
// ─────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";
import { generatePdfBlob } from "@/lib/daepyecha/pdf";
import { GOSI_PURPOSES, emptyGosiForm } from "@/lib/gosi/templates";
import type { GosiForm, GosiItem, GosiPurpose, GosiRow } from "@/lib/gosi/types";
import SignaturePad from "@/app/daepyecha/SignaturePad";
import GosiForm_ from "./GosiForm";

function todayStr() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function GosiModal({
  editId,
  onClose,
  onSaved,
}: {
  editId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!editId;
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);
  const [modifiedBy, setModifiedBy] = useState("");
  const [pad, setPad] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<GosiForm>(() => emptyGosiForm(todayStr()));

  useEffect(() => {
    if (!editId) return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/checklist/${editId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "불러오기 실패");
        const r = json.row as GosiRow;
        if (!alive) return;
        setData({ ...emptyGosiForm(todayStr()), ...r.data }); // 기존 서명 유지
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

  const patch = (p: Partial<GosiForm>) => setData((d) => ({ ...d, ...p }));
  const setItem = (i: number, p: Partial<GosiItem>) =>
    setData((d) => ({ ...d, items: d.items.map((it, idx) => (idx === i ? { ...it, ...p } : it)) }));
  const addItem = () => setData((d) => ({ ...d, items: [...d.items, { name: "", qty: "", done: false, custom: true }] }));
  const removeItem = (i: number) => setData((d) => ({ ...d, items: d.items.filter((_, idx) => idx !== i) }));

  async function save() {
    const miss = firstMissing(data);
    if (miss) return setError(miss);
    if (isEdit && !modifiedBy.trim()) return setError("수정자명을 입력하세요.");
    if (!captureRef.current) return setError("미리보기가 준비되지 않았습니다.");
    setError(null);
    setSaving(true);
    try {
      const blob = await generatePdfBlob(captureRef.current);
      const meta = {
        center: "고속시외",
        operator: data.operatorName,
        model: "고속시외",
        install_date: data.installDate,
        vehicle_numbers: data.vehicleNo,
        installer_name: data.tmoneyName,
        operator_signer_name: data.operatorSignerName,
        data, // 서명 포함 저장(수정 시 유지)
        variant: "gosi",
        doc_label: "고속시외 설치확인서",
        ...(isEdit ? { modified_by: modifiedBy.trim() } : {}),
      };
      const fd = new FormData();
      fd.append("pdf", blob, "gosi.pdf");
      fd.append("meta", JSON.stringify(meta));
      const res = await fetch(isEdit ? `/api/checklist/${editId}` : "/api/checklist", {
        method: isEdit ? "PUT" : "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "저장 실패");
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 중 오류");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="safe-bottom flex max-h-[94dvh] w-full max-w-lg flex-col rounded-t-2xl bg-white sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="text-base font-bold text-slate-800">{isEdit ? "설치확인서 수정 (고속/시외)" : "증·대폐차 설치확인서 (고속/시외)"}</h2>
          <button onClick={onClose} aria-label="닫기" className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="py-10 text-center text-sm text-slate-400">불러오는 중…</p>
          ) : (
            <div className="flex flex-col gap-3">
              {isEdit && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <label className="mb-1 block text-sm font-bold text-amber-800">수정자명 (필수)</label>
                  <input value={modifiedBy} onChange={(e) => setModifiedBy(e.target.value)} placeholder="수정하는 사람 이름" className={inp} />
                  <p className="mt-1 text-xs text-amber-700">* 기존 서명은 자동 유지됩니다. 변경할 때만 다시 서명하세요.</p>
                </div>
              )}

              <L t="구분">
                <div className="flex overflow-hidden rounded-xl ring-1 ring-slate-200">
                  {GOSI_PURPOSES.map((p) => (
                    <button key={p} type="button" onClick={() => patch({ purpose: p as GosiPurpose })} className={`h-11 flex-1 text-sm font-bold transition ${data.purpose === p ? "bg-brand-600 text-white" : "bg-white text-slate-500"}`}>{p}</button>
                  ))}
                </div>
              </L>

              <div className="grid grid-cols-2 gap-2">
                <L t="요청일자"><input type="date" value={data.requestDate} onChange={(e) => patch({ requestDate: e.target.value })} className={inp} /></L>
                <L t="설치일자"><input type="date" value={data.installDate} onChange={(e) => patch({ installDate: e.target.value })} className={inp} /></L>
                <L t="운수사명(고속사)"><input value={data.operatorName} onChange={(e) => patch({ operatorName: e.target.value })} className={inp} /></L>
                <L t="차량번호"><input value={data.vehicleNo} onChange={(e) => patch({ vehicleNo: e.target.value })} className={inp} /></L>
                <L t="운전자IH"><input value={data.driverIH} onChange={(e) => patch({ driverIH: e.target.value })} className={inp} /></L>
                <L t="승하차IH"><input value={data.scIH} onChange={(e) => patch({ scIH: e.target.value })} className={inp} /></L>
                <L t="영수증기 S/N"><input value={data.receiptSn} onChange={(e) => patch({ receiptSn: e.target.value })} className={inp} /></L>
                <L t="바코드 S/N"><input value={data.barcodeSn} onChange={(e) => patch({ barcodeSn: e.target.value })} className={inp} /></L>
              </div>

              {/* 자재 항목 */}
              <div className="rounded-xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                  <span className="text-sm font-bold text-slate-600">자재 ({data.items.length})</span>
                  <button type="button" onClick={addItem} className="rounded-lg bg-brand-600 px-3 py-1 text-xs font-bold text-white">+ 품목 추가</button>
                </div>
                <ul className="flex flex-col divide-y divide-slate-100">
                  {data.items.map((it, i) => (
                    <li key={i} className="flex items-center gap-2 px-3 py-2">
                      <span className="w-5 shrink-0 text-xs text-slate-400">{i + 1}</span>
                      {it.custom ? (
                        <input value={it.name} onChange={(e) => setItem(i, { name: e.target.value })} placeholder="품명" className="h-9 min-w-0 flex-1 rounded-lg border border-slate-300 px-2 text-sm outline-none focus:border-brand-500" />
                      ) : (
                        <span className="min-w-0 flex-1 text-sm text-slate-700">{it.name}</span>
                      )}
                      <input value={it.qty} onChange={(e) => setItem(i, { qty: e.target.value })} placeholder="수량" inputMode="numeric" className="h-9 w-12 shrink-0 rounded-lg border border-slate-300 px-1 text-center text-sm outline-none focus:border-brand-500" />
                      <label className="flex shrink-0 items-center gap-1 text-xs font-semibold text-slate-600">
                        <input type="checkbox" checked={it.done} onChange={(e) => setItem(i, { done: e.target.checked })} className="h-4 w-4" />완료
                      </label>
                      {it.custom && <button type="button" onClick={() => removeItem(i)} className="shrink-0 text-xs font-bold text-red-500">✕</button>}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 서명: 고속사 터치 서명만 (PDF의 티머니 칸은 양식상 빈칸 유지) */}
              <SignBtn label="고속사 확인 (터치 서명)" name={data.operatorSignerName} done={!!data.operatorSig} onClick={() => setPad(true)} />

              <p className="text-xs text-slate-400">미리보기 (저장 시 이 내용 그대로 PDF)</p>
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
                <div ref={captureRef} className="mx-auto w-[794px]"><GosiForm_ data={data} /></div>
              </div>

              {error && <p className="text-sm font-medium text-red-600">{error}</p>}

              <div className="flex gap-2 pb-1">
                <button onClick={onClose} disabled={saving} className="h-12 flex-1 rounded-xl border border-slate-300 font-bold text-slate-600 disabled:opacity-50">취소</button>
                <button onClick={save} disabled={saving} className="h-12 flex-[2] rounded-xl bg-brand-600 font-bold text-white disabled:opacity-50">{saving ? "저장 중…" : "저장 (PDF 보관)"}</button>
              </div>
            </div>
          )}
        </div>

        {pad && (
          <SignaturePad title="고속사 확인 서명 (터치 서명)" initialName="" signOnly
            onConfirm={(_name, sig) => { patch({ operatorSignerName: "", operatorSig: sig }); setPad(false); }} onClose={() => setPad(false)} />
        )}
      </div>
    </div>
  );
}

function firstMissing(d: GosiForm): string | null {
  if (!d.purpose) return "구분(증차/대폐차/재설치)을 선택하세요.";
  if (!d.installDate) return "설치일자를 입력하세요.";
  if (!d.operatorName.trim()) return "운수사명을 입력하세요.";
  if (!d.vehicleNo.trim()) return "차량번호를 입력하세요.";
  const missingQty = d.items.filter((it) => it.name.trim() && !it.qty.trim()).length;
  if (missingQty > 0) return `자재 수량 ${missingQty}건이 비어 있습니다. (수량 필수 입력)`;
  if (!d.operatorSig) return "고속사 확인 서명을 완료하세요.";
  return null;
}

const inp = "h-11 w-full min-w-0 rounded-xl border border-slate-300 px-3 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

function L({ t, children }: { t: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-600">{t}</span>
      {children}
    </label>
  );
}

function SignBtn({ label, name, done, onClick }: { label: string; name: string; done: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex w-full flex-col items-start gap-1 rounded-xl border p-3 text-left ${done ? "border-emerald-300 bg-emerald-50" : "border-slate-300 bg-white"}`}>
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <span className="text-sm font-bold text-slate-800">{done ? (name ? `${name} ✓` : "서명 완료 ✓") : "✍ 사인 입력"}</span>
    </button>
  );
}
