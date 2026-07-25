"use client";

// ─────────────────────────────────────────────────────────────
// 공용 설치확인서 작성/수정 모달 (다차량 1장 양식)
//   헤더 입력 + 차량 행(최대 10) + 서명(운수사/설치자) → GongyongForm 캡처 → PDF 업로드
//   백엔드는 /api/checklist 공유(variant='gongyong', model='공용').
// ─────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";
import { generatePdfBlob } from "@/lib/daepyecha/pdf";
import { parseJsonRes } from "@/lib/fetchJson";
import { REGIONS, GONGYONG_BUS_TYPES, MAX_VEHICLES, POHANG_COMPANIES, REGION_COMPANIES, emptyVehicle, emptyGongyongForm } from "@/lib/gongyong/templates";
import type { GongyongForm, GongyongRow, GongyongBusType, GongyongDocType, GongyongInstallType, GongyongOffice, GongyongVehicle } from "@/lib/gongyong/types";
import type { Region } from "@/lib/checklist-regional/types";
import SignaturePad from "@/app/daepyecha/SignaturePad";
import GongyongForm_ from "./GongyongForm";

function todayStr() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function GongyongModal({
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
  const [pad, setPad] = useState<null | "operator" | "installer">(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<GongyongForm>(() => emptyGongyongForm(todayStr()));

  useEffect(() => {
    if (!editId) return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/checklist/${editId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "불러오기 실패");
        const r = json.row as GongyongRow;
        if (!alive) return;
        setData({ ...emptyGongyongForm(todayStr()), ...r.data }); // 기존 서명 유지
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

  const patch = (p: Partial<GongyongForm>) => setData((d) => ({ ...d, ...p }));
  const setVeh = (i: number, p: Partial<GongyongVehicle>) =>
    setData((d) => ({ ...d, vehicles: d.vehicles.map((v, idx) => (idx === i ? { ...v, ...p } : v)) }));
  const addVeh = () =>
    setData((d) => {
      if (d.vehicles.length >= MAX_VEHICLES) return d;
      const nv = emptyVehicle();
      if (d.region === "포항") nv.vehicleNo = "경북"; // 포항은 차량번호 앞 '경북' 기본
      return { ...d, vehicles: [...d.vehicles, nv] };
    });
  const removeVeh = (i: number) => setData((d) => ({ ...d, vehicles: d.vehicles.length <= 1 ? d.vehicles : d.vehicles.filter((_, idx) => idx !== i) }));
  // 지역 변경: 포항 선택 시 빈 차량번호에 '경북' 기본 입력
  function onRegionChange(region: Region) {
    setData((d) => ({
      ...d,
      region,
      vehicles: region === "포항" ? d.vehicles.map((v) => (v.vehicleNo.trim() === "" ? { ...v, vehicleNo: "경북" } : v)) : d.vehicles,
    }));
  }
  // 포항 회사 선택 → 영업소/주소/전화 자동입력
  function selectCompany(idx: number) {
    const co = POHANG_COMPANIES[idx];
    if (!co) return;
    patch({ companyName: co.company, officeName: co.office, address: co.address, phone: co.phone });
  }
  // 대전·세종 운수사 선택 → 운수사명/주소/전화 자동입력
  const regionCompanies = REGION_COMPANIES[data.region] ?? [];
  function selectRegionCompany(idx: number) {
    const co = regionCompanies[idx];
    if (!co) return;
    patch({ operatorName: co.name, address: co.address, phone: co.phone });
  }

  async function save() {
    const miss = firstMissing(data);
    if (miss) return setError(miss);
    if (isEdit && !modifiedBy.trim()) return setError("수정자명을 입력하세요.");
    if (!captureRef.current) return setError("미리보기가 준비되지 않았습니다.");
    setError(null);
    setSaving(true);
    try {
      const blob = await generatePdfBlob(captureRef.current);
      const plates = data.vehicles.map((v) => v.vehicleNo).filter(Boolean).join(", ");
      const isPohang = data.region === "포항";
      const docLabel = isPohang && data.docType === "철수" ? "철수확인서" : "설치확인서";
      const meta = {
        center: data.region,
        operator: isPohang ? data.companyName : data.operatorName,
        model: isPohang ? "포항" : "공용",
        install_date: data.installDate,
        vehicle_numbers: plates,
        installer_name: data.installerName,
        operator_signer_name: data.operatorSignerName,
        data, // 서명 포함 저장(수정 시 유지)
        variant: "gongyong",
        doc_label: docLabel,
        ...(isEdit ? { modified_by: modifiedBy.trim() } : {}),
      };
      const fd = new FormData();
      fd.append("pdf", blob, "gongyong.pdf");
      fd.append("meta", JSON.stringify(meta));
      const res = await fetch(isEdit ? `/api/checklist/${editId}` : "/api/checklist", {
        method: isEdit ? "PUT" : "POST",
        body: fd,
      });
      const json = await parseJsonRes(res);
      if (!res.ok) throw new Error(json.error ?? "저장 실패");
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 중 오류");
      setSaving(false);
    }
  }

  const isPohang = data.region === "포항";
  const docWord = isPohang && data.docType === "철수" ? "철수" : "설치";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="safe-bottom flex max-h-[94dvh] w-full max-w-lg flex-col rounded-t-2xl bg-white sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="text-base font-bold text-slate-800">{isEdit ? `${docWord}확인서 수정` : `${docWord} 확인서`}</h2>
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

              <div className="grid grid-cols-2 gap-2">
                <L t="지역">
                  <select value={data.region} onChange={(e) => onRegionChange(e.target.value as Region)} className={inp}>
                    <option value="">선택</option>
                    {REGIONS.map((r) => (<option key={r} value={r}>{r}</option>))}
                  </select>
                </L>
                <L t={`${docWord}확인일자`}><input type="date" value={data.installDate} onChange={(e) => patch({ installDate: e.target.value })} className={inp} /></L>

                {isPohang ? (
                  <>
                    <div className="col-span-2">
                      <L t="확인서 구분">
                        <div className="flex overflow-hidden rounded-xl ring-1 ring-slate-200">
                          {(["설치", "철수"] as GongyongDocType[]).map((p) => (
                            <button key={p} type="button" onClick={() => patch({ docType: p })} className={`h-11 flex-1 text-sm font-bold transition ${data.docType === p ? "bg-brand-600 text-white" : "bg-white text-slate-500"}`}>{p}확인서</button>
                          ))}
                        </div>
                      </L>
                    </div>
                    <div className="col-span-2">
                      <L t="회사 선택 (영업소·주소·전화 자동입력)">
                        <select value="" onChange={(e) => { if (e.target.value !== "") selectCompany(Number(e.target.value)); }} className={inp}>
                          <option value="">회사 선택…</option>
                          {POHANG_COMPANIES.map((co, idx) => (<option key={idx} value={idx}>{co.company}{co.office ? ` ${co.office}` : ""}</option>))}
                        </select>
                      </L>
                    </div>
                    <L t="회사명"><input value={data.companyName} onChange={(e) => patch({ companyName: e.target.value })} className={inp} /></L>
                    <L t="영업소명"><input value={data.officeName} onChange={(e) => patch({ officeName: e.target.value })} className={inp} /></L>
                    <L t="전화번호"><input value={data.phone} onChange={(e) => patch({ phone: e.target.value })} className={inp} /></L>
                    <L t="노선구분"><input value={data.routeType} onChange={(e) => patch({ routeType: e.target.value })} className={inp} /></L>
                    <div className="col-span-2"><L t="주소"><input value={data.address} onChange={(e) => patch({ address: e.target.value })} className={inp} /></L></div>
                    <label className="col-span-2 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5">
                      <input type="checkbox" checked={data.newTerminal} onChange={(e) => patch({ newTerminal: e.target.checked })} className="h-4 w-4 shrink-0" />
                      <span className="text-sm font-bold text-slate-700">단말기구분 — 신단말기</span>
                    </label>
                  </>
                ) : (
                  <>
                    {regionCompanies.length > 0 && (
                      <div className="col-span-2">
                        <L t="운수사 선택 (주소·전화 자동입력)">
                          <select value="" onChange={(e) => { if (e.target.value !== "") selectRegionCompany(Number(e.target.value)); }} className={inp}>
                            <option value="">운수사 선택…</option>
                            {regionCompanies.map((co, idx) => (<option key={idx} value={idx}>{co.name}</option>))}
                          </select>
                        </L>
                      </div>
                    )}
                    <L t="버스 구분">
                      <select value={data.busType} onChange={(e) => patch({ busType: e.target.value as GongyongBusType })} className={inp}>
                        <option value="">선택</option>
                        {GONGYONG_BUS_TYPES.map((b) => (<option key={b} value={b}>{b}</option>))}
                      </select>
                    </L>
                    <L t="설치구분">
                      <div className="flex overflow-hidden rounded-xl ring-1 ring-slate-200">
                        {(["증차", "대폐차"] as GongyongInstallType[]).map((p) => (
                          <button key={p} type="button" onClick={() => patch({ installType: p })} className={`h-11 flex-1 text-sm font-bold transition ${data.installType === p ? "bg-brand-600 text-white" : "bg-white text-slate-500"}`}>{p}</button>
                        ))}
                      </div>
                    </L>
                    <div className="col-span-2">
                      <L t="운수사명 / 구분">
                        <div className="flex gap-2">
                          <input value={data.operatorName} onChange={(e) => patch({ operatorName: e.target.value })} placeholder="예: ○○운수" className={`${inp} flex-1`} />
                          <div className="flex shrink-0 overflow-hidden rounded-xl ring-1 ring-slate-200">
                            {(["본사", "영업소"] as GongyongOffice[]).map((o) => (
                              <button key={o} type="button" onClick={() => patch({ officeType: o })} className={`h-11 px-3 text-sm font-bold transition ${data.officeType === o ? "bg-brand-600 text-white" : "bg-white text-slate-500"}`}>{o}</button>
                            ))}
                          </div>
                        </div>
                      </L>
                    </div>
                    <L t="전화번호"><input value={data.phone} onChange={(e) => patch({ phone: e.target.value })} className={inp} /></L>
                    <L t="노선구분"><input value={data.routeType} onChange={(e) => patch({ routeType: e.target.value })} className={inp} /></L>
                    <div className="col-span-2"><L t="주소"><input value={data.address} onChange={(e) => patch({ address: e.target.value })} className={inp} /></L></div>
                  </>
                )}
                <div className="col-span-2"><L t="고객 요청 사항 (선택)"><textarea value={data.customerRequest} onChange={(e) => patch({ customerRequest: e.target.value })} rows={2} className={`${inp} h-auto py-2`} /></L></div>
                <div className="col-span-2"><L t="기타 사항 (선택)"><textarea value={data.etc} onChange={(e) => patch({ etc: e.target.value })} rows={2} className={`${inp} h-auto py-2`} /></L></div>
              </div>

              {/* 차량 목록 */}
              <div className="rounded-xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                  <span className="text-sm font-bold text-slate-600">차량 목록 ({data.vehicles.length}/{MAX_VEHICLES})</span>
                  <button type="button" onClick={addVeh} disabled={data.vehicles.length >= MAX_VEHICLES} className="rounded-lg bg-brand-600 px-3 py-1 text-xs font-bold text-white disabled:opacity-40">+ 차량 추가</button>
                </div>
                <div className="flex flex-col divide-y divide-slate-100">
                  {data.vehicles.map((v, i) => (
                    <div key={i} className="px-3 py-2.5">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500">#{i + 1}</span>
                        {data.vehicles.length > 1 && (
                          <button type="button" onClick={() => removeVeh(i)} className="text-xs font-bold text-red-500">삭제</button>
                        )}
                      </div>
                      <input value={v.vehicleNo} onChange={(e) => setVeh(i, { vehicleNo: e.target.value })} placeholder="차량번호" className={`${inp} mb-1.5`} />
                      <div className="grid grid-cols-2 gap-1.5">
                        <input value={v.main} onChange={(e) => setVeh(i, { main: e.target.value })} placeholder="운전자조작기(버스메인)" className={inpsm} />
                        <input value={v.sc1} onChange={(e) => setVeh(i, { sc1: e.target.value })} placeholder="승하차단말기1" className={inpsm} />
                        <input value={v.sc2} onChange={(e) => setVeh(i, { sc2: e.target.value })} placeholder="승하차단말기2" className={inpsm} />
                        {isPohang ? (
                          <>
                            <input value={v.iface} onChange={(e) => setVeh(i, { iface: e.target.value })} placeholder="인터페이스" className={inpsm} />
                            <input value={v.modem} onChange={(e) => setVeh(i, { modem: e.target.value })} placeholder="모뎀" className={inpsm} />
                          </>
                        ) : (
                          <>
                            <input value={v.sc3} onChange={(e) => setVeh(i, { sc3: e.target.value })} placeholder="승하차단말기3" className={inpsm} />
                            <input value={v.gpsAnt} onChange={(e) => setVeh(i, { gpsAnt: e.target.value })} placeholder="GPS 안테나(수량)" className={inpsm} />
                            <input value={v.partition} onChange={(e) => setVeh(i, { partition: e.target.value })} placeholder="ㄷ자 격벽용(수량)" className={inpsm} />
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 서명 */}
              <div className="grid grid-cols-2 gap-2">
                <SignBtn label="운수사 확인" name={data.operatorSignerName} done={!!data.operatorSig} onClick={() => setPad("operator")} />
                <SignBtn label={isPohang ? "담당자 확인" : "설치자 확인"} name={data.installerName} done={!!data.installerSig} onClick={() => setPad("installer")} />
              </div>

              <p className="text-xs text-slate-400">미리보기 (저장 시 이 내용 그대로 PDF)</p>
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
                <div ref={captureRef} className="mx-auto w-[840px]"><GongyongForm_ data={data} /></div>
              </div>

              {error && <p className="text-sm font-medium text-red-600">{error}</p>}

              <div className="flex gap-2 pb-1">
                <button onClick={onClose} disabled={saving} className="h-12 flex-1 rounded-xl border border-slate-300 font-bold text-slate-600 disabled:opacity-50">취소</button>
                <button onClick={save} disabled={saving} className="h-12 flex-[2] rounded-xl bg-brand-600 font-bold text-white disabled:opacity-50">{saving ? "저장 중…" : "저장 (PDF 보관)"}</button>
              </div>
            </div>
          )}
        </div>

        {pad === "operator" && (
          <SignaturePad title="운수사 확인 서명" initialName={data.operatorSignerName}
            onConfirm={(name, sig) => { patch({ operatorSignerName: name, operatorSig: sig }); setPad(null); }} onClose={() => setPad(null)} />
        )}
        {pad === "installer" && (
          <SignaturePad title={isPohang ? "담당자 확인 서명" : "설치자 확인 서명"} initialName={data.installerName}
            onConfirm={(name, sig) => { patch({ installerName: name, installerSig: sig }); setPad(null); }} onClose={() => setPad(null)} />
        )}
      </div>
    </div>
  );
}

function firstMissing(d: GongyongForm): string | null {
  const isPohang = d.region === "포항";
  if (!d.region) return "지역을 선택하세요.";
  if (!d.installDate) return "확인일자를 입력하세요.";
  if (isPohang ? !d.companyName.trim() : !d.operatorName.trim()) return isPohang ? "회사명을 선택/입력하세요." : "운수사명을 입력하세요.";
  if (!d.vehicles.some((v) => v.vehicleNo.trim())) return "차량을 1대 이상 입력하세요.";
  if (!d.operatorSignerName || !d.operatorSig) return "운수사 확인 서명을 완료하세요.";
  if (!d.installerName || !d.installerSig) return isPohang ? "담당자 확인 서명을 완료하세요." : "설치자 확인 서명을 완료하세요.";
  return null;
}

const inp = "h-11 w-full min-w-0 rounded-xl border border-slate-300 px-3 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";
const inpsm = "h-10 w-full min-w-0 rounded-lg border border-slate-300 px-2 text-sm outline-none focus:border-brand-500";

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
