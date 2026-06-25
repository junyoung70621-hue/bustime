"use client";

// ─────────────────────────────────────────────────────────────
// 설치 완료 체크리스트 작성/수정 모달 (모델별 점검표 기반)
//   헤더 입력 + 모델별 점검 체크(○) + 전체 일괄체크 + NOW 시간 + 서명
//   → ChecklistForm 미리보기 캡처 → PDF 업로드(POST/PUT)
// ─────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";
import { CENTERS } from "@/lib/daepyecha/templates";
import { generatePdfAndJpg } from "@/lib/daepyecha/pdf";
import { emptyPhotoSlots, compressImage, type PhotoSlot } from "@/lib/daepyecha/photo";
import PhotoStep from "./PhotoStep";
import { CK_MODELS, CK_MODELS_DATA, CK_TAGLESS_DATA, TAGLESS_MODELS, TAGLESS_CHECK_KEY, emptyCkForm, rowCheckKey, rowCheckActive, modelFamily, hasSeunghacha, hasSeunghachaModule, presetFor } from "@/lib/checklist/templates";
import type { CkFormState, CkModel, CkRow, CkRowDef, VehicleType, OX } from "@/lib/checklist/types";

// 활성 점검행: 태그리스면 공통 태그리스 양식, 아니면 선택 모델 점검표
function activeRows(d: CkFormState): CkRowDef[] {
  if (d.tagless) return CK_TAGLESS_DATA.rows;
  return d.model ? CK_MODELS_DATA[d.model]?.rows ?? [] : [];
}
// 체크키용 모델 키(태그리스는 모델 무관 단일 키)
function checkKeyModel(d: CkFormState): string {
  return d.tagless ? TAGLESS_CHECK_KEY : d.model;
}
import type { Center } from "@/lib/daepyecha/types";
import SignaturePad from "../SignaturePad";
import ChecklistForm from "./ChecklistForm";

// 신규 작성 임시저장 키(브라우저 localStorage). 사진은 파일이라 미포함.
const DRAFT_KEY = "checklist-draft-v1";

function todayStr() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function nowTime() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function ChecklistModal({
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
  const [pad, setPad] = useState<null | "installer" | "operator">(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<CkFormState>(() => emptyCkForm(todayStr()));
  // 임시저장 복원용: 마운트 시점에 한 번만 localStorage에서 읽어 보관(이후 자동저장이
  // 덮어써도 이 값은 유지 → 복원 배너에 사용). 신규 작성에서만.
  const [draft] = useState<CkFormState | null>(() => {
    if (isEdit || typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      return raw ? (JSON.parse(raw) as CkFormState) : null;
    } catch {
      return null;
    }
  });
  const [draftHandled, setDraftHandled] = useState(false); // 복원/무시 후 배너 숨김
  const [draftSaved, setDraftSaved] = useState(false); // 임시저장 버튼 피드백
  // 신규 작성은 사진 촬영 단계부터. 단, 임시저장본이 있으면 폼으로 바로 진입(복원 편의).
  // 수정은 폼으로 바로 진입(사진 재업로드 안 함).
  const [step, setStep] = useState<"photos" | "form">(isEdit || draft ? "form" : "photos");
  const [photos, setPhotos] = useState<PhotoSlot[]>(() => emptyPhotoSlots());
  // 모달이 완전히 닫힐 때만 미리보기 URL 일괄 해제(폼 단계 전환 시에는 유지)
  const photosRef = useRef(photos);
  photosRef.current = photos;
  useEffect(() => () => { for (const s of photosRef.current) if (s.preview) URL.revokeObjectURL(s.preview); }, []);

  useEffect(() => {
    if (!editId) return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/checklist/${editId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "불러오기 실패");
        const r = json.row as CkRow;
        if (!alive) return;
        setData({ ...emptyCkForm(todayStr()), ...r.data }); // 기존 서명 유지
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

  // 신규 작성 자동 임시저장: 내용이 어느 정도 채워졌을 때만 저장(빈 폼이 기존 임시본을 덮지 않게).
  useEffect(() => {
    if (isEdit || typeof window === "undefined") return;
    const filled = data.model || data.center || data.operatorName.trim() || data.vehicleNo.trim();
    if (!filled) return;
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    } catch {
      /* 용량 초과 등은 무시 */
    }
    setDraftSaved(false); // 내용이 바뀌면 "저장됨 ✓" 표시 해제
  }, [data, isEdit]);

  const saveDraft = () => {
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
      setDraftSaved(true);
    } catch {
      setError("임시저장 실패(브라우저 저장공간 부족)");
    }
  };
  const restoreDraft = () => {
    if (draft) setData({ ...emptyCkForm(todayStr()), ...draft });
    setDraftHandled(true);
  };

  const patch = (p: Partial<CkFormState>) => setData((d) => ({ ...d, ...p }));
  const toggleCheck = (k: string) => setData((d) => ({ ...d, checks: { ...d.checks, [k]: !d.checks[k] } }));
  const checkAll = () =>
    setData((d) => {
      const rows = activeRows(d);
      const km = checkKeyModel(d);
      const next: Record<string, boolean> = {};
      rows.forEach((r, i) => {
        if (r.kind === "check" && !r.mergeUp && rowCheckActive(r, d.model)) next[rowCheckKey(km, i)] = true;
      });
      return { ...d, checks: next };
    });

  async function save() {
    const miss = firstMissing(data);
    if (miss) return setError(`${miss} 입력/완료가 필요합니다. (특이사항 외 모두 필수)`);
    if (isEdit && !modifiedBy.trim()) return setError("수정자명을 입력하세요.");
    if (!captureRef.current) return setError("미리보기가 준비되지 않았습니다.");
    setError(null);
    setSaving(true);
    try {
      const { pdf, jpg } = await generatePdfAndJpg(captureRef.current);
      const meta = {
        center: data.center,
        operator: data.tagless ? `(태그리스)${data.operatorName}` : data.operatorName,
        model: data.model,
        install_date: data.installDate,
        vehicle_numbers: data.vehicleNo,
        installer_name: data.installerName,
        operator_signer_name: data.operatorSignerName,
        data, // 서명 포함 저장(수정 시 유지)
        ...(isEdit ? { modified_by: modifiedBy.trim() } : {}),
      };
      const metaStr = JSON.stringify(meta);
      const fd = new FormData();
      fd.append("pdf", pdf, "checklist.pdf");
      fd.append("jpg", jpg, "checklist.jpg"); // 팀즈 업로드용(수도권)
      fd.append("meta", metaStr);
      // 증빙사진은 Vercel 함수 본문 한계(~4.5MB) 안에 들도록 예산에 맞춰 적응 압축.
      // pdf+jpg+meta가 고정 비용(base)이고, 남는 예산에 사진을 맞춰 화질을 단계적으로 낮춘다.
      const BUDGET = 4.2 * 1024 * 1024; // 4.5MB보다 보수적
      const base = pdf.size + jpg.size + metaStr.length;
      const slots = photos.filter((s) => !s.na && s.file);
      const LADDER: [number, number][] = [[1280, 0.6], [1024, 0.5], [820, 0.45], [640, 0.4]];
      let photoBlobs: { label: string; blob: Blob }[] = [];
      for (const [dim, q] of LADDER) {
        photoBlobs = [];
        for (const s of slots) photoBlobs.push({ label: s.label, blob: await compressImage(s.file!, dim, q) });
        const total = base + photoBlobs.reduce((a, p) => a + p.blob.size, 0);
        if (total <= BUDGET || slots.length === 0) break;
      }
      for (const p of photoBlobs) fd.append("photos", p.blob, `${p.label}.jpg`);
      const bodyBytes = base + photoBlobs.reduce((a, p) => a + p.blob.size, 0);
      const mb = (bodyBytes / (1024 * 1024)).toFixed(1);
      // 그래도 한계를 넘으면 업로드 전에 명확히 안내(413으로 죽지 않게).
      if (bodyBytes > 4.4 * 1024 * 1024) {
        throw new Error(`[용량 ${mb}MB] 사진 용량이 너무 큽니다. 사진 수를 줄이거나 '없음' 처리 후 다시 시도해 주세요.`);
      }
      let res: Response;
      try {
        res = await fetch(isEdit ? `/api/checklist/${editId}` : "/api/checklist", {
          method: isEdit ? "PUT" : "POST",
          body: fd,
        });
      } catch (e) {
        throw new Error(`[업로드 ${mb}MB] ${e instanceof Error ? e.message : String(e)}`);
      }
      // 서버가 비-JSON(413/504 등 플랫폼 오류)을 줄 수 있어 text로 먼저 받고 안전 파싱.
      const text = await res.text();
      let json: { error?: string; id?: string } = {};
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(`[서버 ${res.status}, ${mb}MB] 응답이 JSON이 아님: ${text.slice(0, 80) || "(빈 응답)"}`);
      }
      if (!res.ok) throw new Error(`[서버 ${res.status}] ${json.error ?? "저장 실패"}`);
      if (!isEdit) {
        try {
          window.localStorage.removeItem(DRAFT_KEY); // 저장 성공 → 임시본 정리
        } catch {
          /* noop */
        }
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 중 오류");
      setSaving(false);
    }
  }

  // 활성 점검행 → 케이스별 그룹
  const modelRows = activeRows(data).map((r, i) => ({ r, i }));
  const groups: { no: number; label: string; items: { r: (typeof modelRows)[number]["r"]; i: number }[] }[] = [];
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
          <h2 className="text-base font-bold text-slate-800">{isEdit ? "체크리스트 수정" : step === "photos" ? "증빙사진 촬영" : "설치 완료 체크리스트"}</h2>
          <button onClick={onClose} aria-label="닫기" className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="py-10 text-center text-sm text-slate-400">불러오는 중…</p>
          ) : step === "photos" ? (
            <PhotoStep photos={photos} setPhotos={setPhotos} onNext={() => setStep("form")} />
          ) : (
            <div className="flex flex-col gap-3">
              {!isEdit && (
                <button
                  type="button"
                  onClick={() => setStep("photos")}
                  className="self-start text-sm font-semibold text-slate-500 hover:text-slate-700"
                >
                  ← 사진 촬영
                </button>
              )}
              {!isEdit && draft && !draftHandled && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-sm font-bold text-emerald-800">임시저장된 작성 내용이 있어요</p>
                  <p className="mt-0.5 text-xs text-emerald-700">불러오면 사진을 제외한 입력값·체크·서명이 복원됩니다.</p>
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={restoreDraft} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white">불러오기</button>
                    <button type="button" onClick={() => setDraftHandled(true)} className="rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-bold text-emerald-700">새로 작성</button>
                  </div>
                </div>
              )}
              {isEdit && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <label className="mb-1 block text-sm font-bold text-amber-800">수정자명 (필수)</label>
                  <input value={modifiedBy} onChange={(e) => setModifiedBy(e.target.value)} placeholder="수정하는 사람 이름" className={inp} />
                  <p className="mt-1 text-xs text-amber-700">* 기존 서명은 자동 유지됩니다. 변경할 때만 다시 서명하세요.</p>
                </div>
              )}

              {/* 기본 정보 */}
              <div className="grid grid-cols-2 gap-2">
                <L t="센터">
                  <select value={data.center} onChange={(e) => patch({ center: e.target.value as Center })} className={inp}>
                    <option value="">선택</option>
                    {CENTERS.map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </L>
                <L t="모델">
                  <select value={data.model} onChange={(e) => { const m = e.target.value as CkModel; const tagless = data.tagless && TAGLESS_MODELS.includes(m); patch({ model: m, checks: {}, tagless, ...presetFor(m) }); }} className={inp}>
                    <option value="">선택</option>
                    {CK_MODELS.map((m) => (<option key={m} value={m}>{m}</option>))}
                  </select>
                </L>
                {TAGLESS_MODELS.includes(data.model) && (
                  <label className="col-span-2 flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2.5">
                    <input type="checkbox" checked={data.tagless} onChange={(e) => patch({ tagless: e.target.checked, checks: {} })} className="h-4 w-4 shrink-0" />
                    <span className="text-sm font-bold text-indigo-700">태그리스 양식으로 작성</span>
                    <span className="text-xs text-indigo-500">(비콘/BLE 전용 점검표)</span>
                  </label>
                )}
                <L t="설치일"><input type="date" value={data.installDate} onChange={(e) => patch({ installDate: e.target.value })} className={inp} /></L>
                <L t="설치시간">
                  <div className="flex gap-1">
                    <input value={data.installTime} onChange={(e) => patch({ installTime: e.target.value })} placeholder="HH:MM" className={inp} />
                    <button type="button" onClick={() => patch({ installTime: nowTime() })} className={nowBtn}>NOW</button>
                  </div>
                </L>
                <L t="운수사명"><input value={data.operatorName} onChange={(e) => patch({ operatorName: e.target.value })} className={inp} /></L>
                <L t="운수사ID"><input value={data.operatorId} onChange={(e) => patch({ operatorId: e.target.value })} className={inp} /></L>
                <L t="노선번호"><input value={data.routeNo} onChange={(e) => patch({ routeNo: e.target.value })} className={inp} /></L>
                <L t="차량번호"><input value={data.vehicleNo} onChange={(e) => patch({ vehicleNo: e.target.value })} placeholder="예: 70-1234" className={inp} /></L>
                <L t="좌석수"><input value={data.seatCount} onChange={(e) => patch({ seatCount: e.target.value })} inputMode="numeric" className={inp} /></L>

                {data.tagless ? (
                  <>
                    <L t="허브 IH"><input value={data.hubIH} onChange={(e) => patch({ hubIH: e.target.value })} className={inp} /></L>
                    <div className="col-span-2">
                      <L t="타사 장비 설치여부 — 선택"><input value={data.otherEquip} onChange={(e) => patch({ otherEquip: e.target.value })} placeholder="메가박스 TV/대수, 공기청정기 등" className={inp} /></L>
                    </div>
                  </>
                ) : modelFamily(data.model) === "driver" ? (
                  <>
                    <L t="운전자단말기 IH"><input value={data.driverIH} onChange={(e) => patch({ driverIH: e.target.value })} className={inp} /></L>
                    {hasSeunghacha(data.model) && (
                      <div className="col-span-2">
                        <span className="mb-1 block text-xs font-semibold text-slate-600">승.하차단말기 IH (승차 / 하차1 / 하차2) <span className="font-normal text-slate-400">— 선택</span></span>
                        <div className="flex gap-1">
                          <input value={data.seungChaIH} onChange={(e) => patch({ seungChaIH: e.target.value })} placeholder="승차" className={inp} />
                          <input value={data.hacha1IH} onChange={(e) => patch({ hacha1IH: e.target.value })} placeholder="하차1" className={inp} />
                          <input value={data.hacha2IH} onChange={(e) => patch({ hacha2IH: e.target.value })} placeholder="하차2" className={inp} />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <L t="LTE모뎀 IH"><input value={data.lteModemIH} onChange={(e) => patch({ lteModemIH: e.target.value })} className={inp} /></L>
                    <div className="col-span-2">
                      <span className="mb-1 block text-xs font-semibold text-slate-600">승.하차단말기 IH (승차 / 하차1 / 하차2) <span className="font-normal text-slate-400">— 선택</span></span>
                      <div className="flex gap-1">
                        <input value={data.seungChaIH} onChange={(e) => patch({ seungChaIH: e.target.value })} placeholder="승차" className={inp} />
                        <input value={data.hacha1IH} onChange={(e) => patch({ hacha1IH: e.target.value })} placeholder="하차1" className={inp} />
                        <input value={data.hacha2IH} onChange={(e) => patch({ hacha2IH: e.target.value })} placeholder="하차2" className={inp} />
                      </div>
                    </div>
                    {hasSeunghachaModule(data.model) && (
                      <div className="col-span-2">
                        <span className="mb-1 block text-xs font-semibold text-slate-600">승.하차(모듈) IH (승차 / 하차1 / 하차2) <span className="font-normal text-slate-400">— 선택</span></span>
                        <div className="flex gap-1">
                          <input value={data.seungChaModuleIH} onChange={(e) => patch({ seungChaModuleIH: e.target.value })} placeholder="승차" className={inp} />
                          <input value={data.hacha1ModuleIH} onChange={(e) => patch({ hacha1ModuleIH: e.target.value })} placeholder="하차1" className={inp} />
                          <input value={data.hacha2ModuleIH} onChange={(e) => patch({ hacha2ModuleIH: e.target.value })} placeholder="하차2" className={inp} />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {!data.tagless && modelFamily(data.model) === "pyochul" && (
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="mb-2 text-sm font-bold text-slate-600">IH (프리셋 자동입력, 수정 가능)</p>
                  <div className="grid grid-cols-2 gap-2">
                    <L t="표출단말기 IH"><input value={data.pyochulIH} onChange={(e) => patch({ pyochulIH: e.target.value })} className={inp} /></L>
                    <L t="표출(모듈) IH"><input value={data.pyochulModuleIH} onChange={(e) => patch({ pyochulModuleIH: e.target.value })} className={inp} /></L>
                    <L t="메인단말기 IH"><input value={data.mainIH} onChange={(e) => patch({ mainIH: e.target.value })} className={inp} /></L>
                    {data.model === "B700" && (
                      <L t="CITS 처리부 IH"><input value={data.citsIH} onChange={(e) => patch({ citsIH: e.target.value })} className={inp} /></L>
                    )}
                  </div>
                </div>
              )}

              {data.tagless && (
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="mb-2 text-sm font-bold text-slate-600">FW 버전</p>
                  <div className="grid grid-cols-2 gap-2">
                    <L t="태그리스 FW"><input value={data.taglessFw} onChange={(e) => patch({ taglessFw: e.target.value })} className={inp} /></L>
                    <L t="비콘 FW"><input value={data.beaconFw} onChange={(e) => patch({ beaconFw: e.target.value })} className={inp} /></L>
                    <L t="AFC FW"><input value={data.afcFw} onChange={(e) => patch({ afcFw: e.target.value })} className={inp} /></L>
                    <L t="G/W FW"><input value={data.gwFw} onChange={(e) => patch({ gwFw: e.target.value })} className={inp} /></L>
                  </div>
                </div>
              )}

              {/* 케이스1 차량특성 (태그리스는 제조사/차종만) */}
              {data.tagless ? (
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="mb-2 text-sm font-bold text-slate-600">차량 정보</p>
                  <div className="grid grid-cols-2 gap-2">
                    <L t="차량 제조사"><input value={data.manufacturer} onChange={(e) => patch({ manufacturer: e.target.value })} className={inp} /></L>
                    <L t="차종"><input value={data.modelName} onChange={(e) => patch({ modelName: e.target.value })} className={inp} /></L>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="mb-2 text-sm font-bold text-slate-600">차량특성</p>
                  <div className="grid grid-cols-2 gap-2">
                    <L t="차량 특성">
                      <select value={data.vehicleType} onChange={(e) => patch({ vehicleType: e.target.value as VehicleType })} className={inp}>
                        <option value="">선택</option>
                        {["일반A", "저상B", "전기차C", "기타D"].map((v) => (<option key={v} value={v}>{v}</option>))}
                      </select>
                    </L>
                    <L t="격벽설치(O/X)">
                      <select value={data.partition} onChange={(e) => patch({ partition: e.target.value as OX })} className={inp}>
                        <option value="">선택</option><option value="O">O</option><option value="X">X</option>
                      </select>
                    </L>
                    <L t="제조사"><input value={data.manufacturer} onChange={(e) => patch({ manufacturer: e.target.value })} className={inp} /></L>
                    <L t="모델명"><input value={data.modelName} onChange={(e) => patch({ modelName: e.target.value })} className={inp} /></L>
                  </div>
                </div>
              )}

              {/* 점검 항목 (모델별) */}
              {data.model ? (
                <div className="rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                    <span className="text-sm font-bold text-slate-600">점검 항목 (체크 = ○)</span>
                    <button type="button" onClick={checkAll} className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white">전체 ○</button>
                  </div>
                  {groups.map((g) => {
                    const renderable = g.items.filter((x) => ["check", "time", "version", "appVehicleNo"].includes(x.r.kind));
                    if (renderable.length === 0) return null;
                    return (
                      <div key={g.no} className="border-b border-slate-100 last:border-0">
                        <p className="bg-slate-50 px-3 py-1 text-xs font-bold text-slate-500">{g.no}. {g.label}</p>
                        {renderable.map(({ r, i }) => {
                          if (r.kind === "check") {
                            if (r.mergeUp) return null; // 셀병합 행은 위 체크행을 따라가므로 별도 체크박스 없음
                            if (!rowCheckActive(r, data.model)) return null; // CITS 등 모델 전용 행은 타모델에서 체크 미노출
                            const key = rowCheckKey(checkKeyModel(data), i);
                            const label = [r.target, r.item || r.method].filter(Boolean).join(" · ").replace(/\s+/g, " ") || r.point.split(/\r?\n/)[0];
                            return (
                              <label key={i} className="flex items-center gap-2 px-3 py-1.5">
                                <input type="checkbox" checked={!!data.checks[key]} onChange={() => toggleCheck(key)} className="h-4 w-4 shrink-0" />
                                <span className="min-w-0 flex-1 text-sm text-slate-700">{label}</span>
                              </label>
                            );
                          }
                          if (r.kind === "appVehicleNo") {
                            return (
                              <div key={i} className="px-3 py-2">
                                <span className="mb-1 block text-xs font-semibold text-slate-600">앱 내 설치 차량번호</span>
                                <input value={data.appVehicleNo} onChange={(e) => patch({ appVehicleNo: e.target.value })} placeholder="예: 747208" className={inp} />
                              </div>
                            );
                          }
                          if (r.kind === "time") {
                            return (
                              <div key={i} className="px-3 py-2">
                                <span className="mb-1 block text-xs font-semibold text-slate-600">시간확인 (NOW)</span>
                                <div className="flex gap-1">
                                  <input value={data.timeValue} onChange={(e) => patch({ timeValue: e.target.value })} placeholder="HH:MM" className={inp} />
                                  <button type="button" onClick={() => patch({ timeValue: nowTime(), timeChecked: true })} className={nowBtn}>NOW</button>
                                </div>
                              </div>
                            );
                          }
                          // version
                          return (
                            <div key={i} className="grid grid-cols-2 gap-2 px-3 py-2">
                              <L t="확인 FW버전"><input value={data.fwVer} onChange={(e) => patch({ fwVer: e.target.value })} className={inp} /></L>
                              <L t="확인 OS버전"><input value={data.osVer} onChange={(e) => patch({ osVer: e.target.value })} className={inp} /></L>
                            </div>
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
                <p className="mb-2 text-sm font-bold text-slate-600">특이사항 (선택 — 유일하게 선택 입력)</p>
                <textarea value={data.etcContent} onChange={(e) => patch({ etcContent: e.target.value })} placeholder="내용 기재" rows={2} className={`${inp} h-auto py-2`} />
                <div className="mt-2"><L t="수량"><input value={data.etcQty} onChange={(e) => patch({ etcQty: e.target.value })} className={inp} /></L></div>
              </div>

              {/* 서명 (태그리스 양식은 설치자 확인만) */}
              <div className="grid grid-cols-2 gap-2">
                <SignBtn label="설치자 확인" name={data.installerName} done={!!data.installerSig} onClick={() => setPad("installer")} />
                {!data.tagless && (
                  <SignBtn label="운수사 확인" name={data.operatorSignerName} done={!!data.operatorSig} onClick={() => setPad("operator")} />
                )}
              </div>

              {/* 미리보기(캡처 대상) */}
              <p className="text-xs text-slate-400">미리보기 (저장 시 이 내용 그대로 PDF)</p>
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
                <div ref={captureRef} className="mx-auto w-[840px]"><ChecklistForm data={data} /></div>
              </div>

              {error && <p className="text-sm font-medium text-red-600">{error}</p>}

              {!isEdit && (
                <button
                  type="button"
                  onClick={saveDraft}
                  disabled={saving}
                  className="h-11 w-full rounded-xl border border-slate-300 text-sm font-bold text-slate-600 disabled:opacity-50"
                >
                  {draftSaved ? "임시저장됨 ✓ (다음에 불러올 수 있어요)" : "임시저장 (작성 내용 보관)"}
                </button>
              )}
              <div className="flex gap-2 pb-1">
                <button onClick={onClose} disabled={saving} className="h-12 flex-1 rounded-xl border border-slate-300 font-bold text-slate-600 disabled:opacity-50">취소</button>
                <button onClick={save} disabled={saving} className="h-12 flex-[2] rounded-xl bg-brand-600 font-bold text-white disabled:opacity-50">{saving ? "저장 중…" : "저장 (PDF 보관)"}</button>
              </div>
            </div>
          )}
        </div>

        {pad === "installer" && (
          <SignaturePad title="설치자 서명" initialName={data.installerName}
            onConfirm={(name, sig) => { patch({ installerName: name, installerSig: sig }); setPad(null); }} onClose={() => setPad(null)} />
        )}
        {pad === "operator" && (
          <SignaturePad title="운수사 서명" initialName={data.operatorSignerName}
            onConfirm={(name, sig) => { patch({ operatorSignerName: name, operatorSig: sig }); setPad(null); }} onClose={() => setPad(null)} />
        )}
      </div>
    </div>
  );
}

// 특이사항(etcContent/etcQty) 외 모든 필드 필수 검증. 첫 누락 항목명 반환(없으면 null)
function firstMissing(d: CkFormState): string | null {
  const rows = activeRows(d);
  const km = checkKeyModel(d);
  const has = (k: string) => rows.some((r) => r.kind === k);
  const req: [boolean, string][] = [
    [!d.center, "센터"],
    [!d.model, "모델"],
    [!d.operatorName.trim(), "운수사명"],
    [!d.operatorId.trim(), "운수사ID"],
    [!d.installDate, "설치일"],
    [!d.installTime.trim(), "설치시간"],
    [!d.routeNo.trim(), "노선번호"],
    [!d.vehicleNo.trim(), "차량번호"],
    [has("seat") && !d.seatCount.trim(), "좌석수"],
    [has("vehicleType") && !d.vehicleType, "차량 특성"],
    [has("partition") && !d.partition, "격벽설치(O/X)"],
    [!d.manufacturer.trim(), d.tagless ? "차량 제조사" : "제조사"],
    [!d.modelName.trim(), d.tagless ? "차종" : "모델명"],
    [has("time") && !d.timeValue.trim(), "시간확인"],
    [has("version") && !d.fwVer.trim(), "FW버전"],
    [has("version") && !d.osVer.trim(), "OS버전"],
    [has("appVehicleNo") && !d.appVehicleNo.trim(), "앱 차량번호"],
  ];
  // 승.하차단말기 IH / 승.하차단말기(모듈) IH 는 도어 수가 기종마다 달라 선택 입력(필수 아님)
  if (d.tagless) {
    // 타사 장비 설치여부는 없을 수 있어 선택 입력
    req.push(
      [!d.hubIH.trim(), "허브 IH"],
      [!d.taglessFw.trim(), "태그리스 FW"],
      [!d.beaconFw.trim(), "비콘 FW"],
      [!d.afcFw.trim(), "AFC FW"],
      [!d.gwFw.trim(), "G/W FW"],
    );
  } else if (modelFamily(d.model) === "driver") {
    req.push([!d.driverIH.trim(), "운전자단말기 IH"]);
  } else if (d.model) {
    req.push(
      [!d.lteModemIH.trim(), "LTE모뎀 IH"],
      [!d.pyochulIH.trim(), "표출단말기 IH"],
      [!d.pyochulModuleIH.trim(), "표출(모듈) IH"],
      [!d.mainIH.trim(), "메인단말기 IH"],
    );
    if (d.model === "B700") req.push([!d.citsIH.trim(), "CITS 처리부 IH"]);
  }
  // 점검 항목 전부 ○ 체크 필수
  const unchecked = rows.filter((r, i) => r.kind === "check" && !r.mergeUp && rowCheckActive(r, d.model) && !d.checks[rowCheckKey(km, i)]).length;
  req.push([unchecked > 0, `점검 항목 ${unchecked}개 미체크 (전부 ○ 필요)`]);
  req.push([!d.installerName || !d.installerSig, "설치자 서명"]);
  if (!d.tagless) req.push([!d.operatorSignerName || !d.operatorSig, "운수사 서명"]);
  const m = req.find(([bad]) => bad);
  return m ? m[1] : null;
}

const inp = "h-11 w-full min-w-0 rounded-xl border border-slate-300 px-3 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";
const nowBtn = "h-11 shrink-0 rounded-xl bg-slate-600 px-3 text-sm font-bold text-white";

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
