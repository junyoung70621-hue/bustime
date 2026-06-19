"use client";

// ─────────────────────────────────────────────────────────────
// 설치 완료 체크리스트(지역) 작성/수정 모달 (모델별 점검표 기반)
//   헤더 입력 + 모델별 점검 체크(○) + 전체 일괄체크 + 점검자 서명 1개
//   → RegionalChecklistForm 미리보기 캡처 → PDF 업로드(POST/PUT, variant=regional)
// ─────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";
import { generatePdfBlob } from "@/lib/daepyecha/pdf";
import { REG_MODELS, REG_MODELS_DATA, REG_HEADER, REGIONS, regCheckKey, emptyRegForm } from "@/lib/checklist-regional/templates";
import type { RegFormState, RegModel, RegRow, Region } from "@/lib/checklist-regional/types";
import type { CkRowDef, OX } from "@/lib/checklist/types";
import SignaturePad from "../SignaturePad";
import RegionalChecklistForm from "./RegionalChecklistForm";

function todayStr() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function activeRows(d: RegFormState): CkRowDef[] {
  return d.model ? REG_MODELS_DATA[d.model]?.rows ?? [] : [];
}

export default function RegionalChecklistModal({
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
  const [data, setData] = useState<RegFormState>(() => emptyRegForm(todayStr()));

  useEffect(() => {
    if (!editId) return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/checklist/${editId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "불러오기 실패");
        const r = json.row as RegRow;
        if (!alive) return;
        setData({ ...emptyRegForm(todayStr()), ...r.data, inspectorSig: null });
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

  const patch = (p: Partial<RegFormState>) => setData((d) => ({ ...d, ...p }));
  const toggleCheck = (k: string) => setData((d) => ({ ...d, checks: { ...d.checks, [k]: !d.checks[k] } }));
  const checkAll = () =>
    setData((d) => {
      const rows = activeRows(d);
      const next: Record<string, boolean> = {};
      rows.forEach((r, i) => {
        if (r.kind === "check") next[regCheckKey(d.model, i)] = true;
      });
      return { ...d, checks: next };
    });

  async function save() {
    const miss = firstMissing(data);
    if (miss) return setError(`${miss} 입력/완료가 필요합니다. (특이사항·ID/IH·F/W 외 모두 필수)`);
    if (isEdit && !modifiedBy.trim()) return setError("수정자명을 입력하세요.");
    if (!captureRef.current) return setError("미리보기가 준비되지 않았습니다.");
    setError(null);
    setSaving(true);
    try {
      const blob = await generatePdfBlob(captureRef.current);
      const dataForDb: RegFormState = { ...data, inspectorSig: null };
      const meta = {
        center: data.region,
        operator: data.operatorName,
        model: data.model,
        install_date: data.inspectDate,
        vehicle_numbers: data.vehicleNo,
        installer_name: data.inspectorName,
        operator_signer_name: "",
        data: dataForDb,
        variant: "regional",
        ...(isEdit ? { modified_by: modifiedBy.trim() } : {}),
      };
      const fd = new FormData();
      fd.append("pdf", blob, "checklist.pdf");
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

  const cfg = data.model ? REG_HEADER[data.model as RegModel] : undefined;

  // 활성 점검행 → 케이스별 그룹
  const modelRows = activeRows(data).map((r, i) => ({ r, i }));
  const groups: { no: number; label: string; items: { r: CkRowDef; i: number }[] }[] = [];
  for (const x of modelRows) {
    let g = groups.find((g) => g.no === x.r.caseNo);
    if (!g) {
      g = { no: x.r.caseNo, label: x.r.caseLabel, items: [] };
      groups.push(g);
    }
    g.items.push(x);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="safe-bottom flex max-h-[94dvh] w-full max-w-lg flex-col rounded-t-2xl bg-white sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="text-base font-bold text-slate-800">{isEdit ? "체크리스트 수정 (지역)" : "설치 완료 체크리스트 (지역)"}</h2>
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
                  <p className="mt-1 text-xs text-amber-700">* 수정 시 서명은 다시 입력해야 합니다.</p>
                </div>
              )}

              {/* 기본 정보 */}
              <div className="grid grid-cols-2 gap-2">
                <L t="지역">
                  <select value={data.region} onChange={(e) => patch({ region: e.target.value as Region })} className={inp}>
                    <option value="">선택</option>
                    {REGIONS.map((r) => (<option key={r} value={r}>{r}</option>))}
                  </select>
                </L>
                <L t="모델">
                  <select value={data.model} onChange={(e) => patch({ model: e.target.value as RegModel, checks: {}, vehicleType: "" })} className={inp}>
                    <option value="">선택</option>
                    {REG_MODELS.map((m) => (<option key={m} value={m}>{m}</option>))}
                  </select>
                </L>
                <L t="점검일"><input type="date" value={data.inspectDate} onChange={(e) => patch({ inspectDate: e.target.value })} className={inp} /></L>
                <L t="차량번호"><input value={data.vehicleNo} onChange={(e) => patch({ vehicleNo: e.target.value })} placeholder="예: 70-1234" className={inp} /></L>
                <L t="운수사명"><input value={data.operatorName} onChange={(e) => patch({ operatorName: e.target.value })} className={inp} /></L>
                {cfg?.hasOperatorId && (
                  <L t="운수사ID"><input value={data.operatorId} onChange={(e) => patch({ operatorId: e.target.value })} className={inp} /></L>
                )}
              </div>

              {/* ID/IH (선택) */}
              {cfg && (
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="mb-2 text-sm font-bold text-slate-600">
                    {cfg.beforeAfter ? "교체전 ID/IH" : "단말기 ID/IH"} <span className="font-normal text-slate-400">— 선택</span>
                  </p>
                  <span className="mb-1 block text-xs font-semibold text-slate-600">{cfg.idLabel} (승차 / 하차1 / 하차2)</span>
                  <div className="flex gap-1">
                    <input value={data.seungCha} onChange={(e) => patch({ seungCha: e.target.value })} placeholder="승차" className={inp} />
                    <input value={data.hacha1} onChange={(e) => patch({ hacha1: e.target.value })} placeholder="하차1" className={inp} />
                    <input value={data.hacha2} onChange={(e) => patch({ hacha2: e.target.value })} placeholder="하차2" className={inp} />
                  </div>
                  <div className="mt-2"><L t={cfg.driverLabel}><input value={data.driverId} onChange={(e) => patch({ driverId: e.target.value })} className={inp} /></L></div>
                </div>
              )}

              {/* 교체후 ID/IH (B600, 선택) */}
              {cfg?.beforeAfter && (
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="mb-2 text-sm font-bold text-slate-600">교체후 ID/IH <span className="font-normal text-slate-400">— 선택</span></p>
                  <span className="mb-1 block text-xs font-semibold text-slate-600">{cfg.idLabel} (승차 / 하차1 / 하차2)</span>
                  <div className="flex gap-1">
                    <input value={data.seungChaAfter} onChange={(e) => patch({ seungChaAfter: e.target.value })} placeholder="승차" className={inp} />
                    <input value={data.hacha1After} onChange={(e) => patch({ hacha1After: e.target.value })} placeholder="하차1" className={inp} />
                    <input value={data.hacha2After} onChange={(e) => patch({ hacha2After: e.target.value })} placeholder="하차2" className={inp} />
                  </div>
                  <div className="mt-2"><L t={cfg.driverLabel}><input value={data.driverIdAfter} onChange={(e) => patch({ driverIdAfter: e.target.value })} className={inp} /></L></div>
                </div>
              )}

              {/* F/W 버전 (B500/B650, 선택) */}
              {cfg?.fwRow && (
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="mb-2 text-sm font-bold text-slate-600">F/W 버전 <span className="font-normal text-slate-400">— 선택</span></p>
                  <span className="mb-1 block text-xs font-semibold text-slate-600">승.하차1,하차2 단말기 F/W (승차 / 하차1 / 하차2)</span>
                  <div className="flex gap-1">
                    <input value={data.seungChaFw} onChange={(e) => patch({ seungChaFw: e.target.value })} placeholder="승차" className={inp} />
                    <input value={data.hacha1Fw} onChange={(e) => patch({ hacha1Fw: e.target.value })} placeholder="하차1" className={inp} />
                    <input value={data.hacha2Fw} onChange={(e) => patch({ hacha2Fw: e.target.value })} placeholder="하차2" className={inp} />
                  </div>
                  <div className="mt-2"><L t="운전자단말기 F/W"><input value={data.driverFw} onChange={(e) => patch({ driverFw: e.target.value })} className={inp} /></L></div>
                </div>
              )}

              {/* 차량특성 */}
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="mb-2 text-sm font-bold text-slate-600">차량특성</p>
                <div className="grid grid-cols-2 gap-2">
                  {cfg && cfg.vehicleTypeOptions.length > 0 && (
                    <L t="차량 특성(차종)">
                      <select value={data.vehicleType} onChange={(e) => patch({ vehicleType: e.target.value, ...(e.target.value === "기타" ? {} : { vehicleTypeEtc: "" }) })} className={inp}>
                        <option value="">선택</option>
                        {cfg.vehicleTypeOptions.map((v) => (<option key={v} value={v}>{v}</option>))}
                      </select>
                    </L>
                  )}
                  {cfg && cfg.vehicleTypeOptions.length > 0 && data.vehicleType === "기타" && (
                    <L t="기타 차종 (직접 입력 → 비고)">
                      <input value={data.vehicleTypeEtc} onChange={(e) => patch({ vehicleTypeEtc: e.target.value })} placeholder="차종을 입력하세요" className={inp} />
                    </L>
                  )}
                  <L t="격벽설치(O/X)">
                    <select value={data.partition} onChange={(e) => patch({ partition: e.target.value as OX })} className={inp}>
                      <option value="">선택</option><option value="O">O</option><option value="X">X</option>
                    </select>
                  </L>
                </div>
              </div>

              {/* 점검 항목 (모델별) */}
              {data.model ? (
                <div className="rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                    <span className="text-sm font-bold text-slate-600">점검 항목 (체크 = ○)</span>
                    <button type="button" onClick={checkAll} className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white">전체 ○</button>
                  </div>
                  {groups.map((g) => {
                    const renderable = g.items.filter((x) => x.r.kind === "check");
                    if (renderable.length === 0) return null;
                    return (
                      <div key={g.no} className="border-b border-slate-100 last:border-0">
                        <p className="bg-slate-50 px-3 py-1 text-xs font-bold text-slate-500">{g.no}. {g.label}</p>
                        {renderable.map(({ r, i }) => {
                          const key = regCheckKey(data.model, i);
                          const label = [r.target, r.item || r.method].filter(Boolean).join(" · ").replace(/\s+/g, " ") || (r.point || "").split(/\r?\n/)[0];
                          return (
                            <label key={i} className="flex items-center gap-2 px-3 py-1.5">
                              <input type="checkbox" checked={!!data.checks[key]} onChange={() => toggleCheck(key)} className="h-4 w-4 shrink-0" />
                              <span className="min-w-0 flex-1 text-sm text-slate-700">{label}</span>
                            </label>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-400">모델을 선택하면 점검 항목이 표시됩니다.</p>
              )}

              {/* 특이사항 */}
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="mb-2 text-sm font-bold text-slate-600">특이사항 (선택)</p>
                <textarea value={data.etcContent} onChange={(e) => patch({ etcContent: e.target.value })} placeholder="추가 자재사용 내역 및 특이사항 (운전자 봉 / 승하차 봉 등)" rows={2} className={`${inp} h-auto py-2`} />
                <div className="mt-2"><L t="수량"><input value={data.etcQty} onChange={(e) => patch({ etcQty: e.target.value })} className={inp} /></L></div>
              </div>

              {/* 서명 (점검자 1개) */}
              <SignBtn label="점검자 확인" name={data.inspectorName} done={!!data.inspectorSig} onClick={() => setPad(true)} />

              {/* 미리보기(캡처 대상) */}
              <p className="text-xs text-slate-400">미리보기 (저장 시 이 내용 그대로 PDF)</p>
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
                <div ref={captureRef} className="mx-auto w-[840px]"><RegionalChecklistForm data={data} /></div>
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
          <SignaturePad title="점검자 서명" initialName={data.inspectorName}
            onConfirm={(name, sig) => { patch({ inspectorName: name, inspectorSig: sig }); setPad(false); }} onClose={() => setPad(false)} />
        )}
      </div>
    </div>
  );
}

// 특이사항·ID/IH·F/W 외 필수 검증. 첫 누락 항목명 반환(없으면 null)
function firstMissing(d: RegFormState): string | null {
  const rows = activeRows(d);
  const cfg = d.model ? REG_HEADER[d.model] : undefined;
  const hasVt = !!cfg && cfg.vehicleTypeOptions.length > 0;
  const req: [boolean, string][] = [
    [!d.region, "지역"],
    [!d.model, "모델"],
    [!d.operatorName.trim(), "운수사명"],
    [!!cfg?.hasOperatorId && !d.operatorId.trim(), "운수사ID"],
    [!d.inspectDate, "점검일"],
    [!d.vehicleNo.trim(), "차량번호"],
    [hasVt && !d.vehicleType, "차량 특성(차종)"],
    [hasVt && d.vehicleType === "기타" && !d.vehicleTypeEtc.trim(), "기타 차종(직접 입력)"],
    [!d.partition, "격벽설치(O/X)"],
  ];
  // 점검 항목 전부 ○ 체크 필수
  const unchecked = rows.filter((r, i) => r.kind === "check" && !d.checks[regCheckKey(d.model, i)]).length;
  req.push([unchecked > 0, `점검 항목 ${unchecked}개 미체크 (전부 ○ 필요)`]);
  req.push([!d.inspectorName || !d.inspectorSig, "점검자 서명"]);
  const m = req.find(([bad]) => bad);
  return m ? m[1] : null;
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
    <button onClick={onClick} className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left ${done ? "border-emerald-300 bg-emerald-50" : "border-slate-300 bg-white"}`}>
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <span className="text-sm font-bold text-slate-800">{done ? `${name} ✓` : "✍ 사인 입력"}</span>
    </button>
  );
}
