"use client";

// ─────────────────────────────────────────────────────────────
// 인천 B820 설치완료 체크리스트 작성/수정 모달
//   B820 단일 기종 고정 · 센터 "인천" 고정 · 설치자 서명만(운수사 서명/사진 없음).
//   태그리스·좌석표시기·전자노선도는 "해당없음" 토글 → O칸에 "해당없음".
//   → IncheonChecklistForm 미리보기 캡처 → PDF+JPG 업로드(POST/PUT, variant=incheon).
// ─────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";
import { generatePdfAndJpg } from "@/lib/daepyecha/pdf";
import { emptyPhotoSlots, uploadPhotosDirect, type PhotoSlot } from "@/lib/daepyecha/photo";
import type { PhotoRef } from "@/lib/daepyecha/photo-upload";
import PhotoStep from "../checklist/PhotoStep";
import AutoInputStep, { SLOTS } from "./AutoInputStep";
import { emptyIncForm, incItemDone, INC_CHECK_ITEMS, INC_CHECK_KEYS, INC_NA_KEYS, INC_MODEL } from "@/lib/checklist-incheon/templates";
import type { IncFormState, IncRow, VehicleType, OX } from "@/lib/checklist-incheon/types";
import SignaturePad from "../SignaturePad";
import IncheonChecklistForm from "./IncheonChecklistForm";

const DRAFT_KEY = "checklist-incheon-draft-v1";

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

// 점검 항목을 케이스별 그룹으로
const CHECK_GROUPS: { no: string; label: string; items: typeof INC_CHECK_ITEMS }[] = (() => {
  const groups: { no: string; label: string; items: typeof INC_CHECK_ITEMS }[] = [];
  for (const it of INC_CHECK_ITEMS) {
    let g = groups.find((g) => g.no === it.caseNo);
    if (!g) { g = { no: it.caseNo, label: it.caseLabel, items: [] }; groups.push(g); }
    g.items.push(it);
  }
  return groups;
})();

export default function IncheonChecklistModal({
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
  const [ihHelp, setIhHelp] = useState(false); // 단말기 IH 확인방법 팝업
  const [draftSaved, setDraftSaved] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<IncFormState>(() => emptyIncForm(todayStr()));

  const [draft] = useState<IncFormState | null>(() => {
    if (isEdit || typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      return raw ? (JSON.parse(raw) as IncFormState) : null;
    } catch {
      return null;
    }
  });
  const [draftHandled, setDraftHandled] = useState(false);
  // 신규 작성은 사진 촬영 → IH 자동입력 → 폼 순서. 임시저장본이 있거나 수정이면 폼으로 바로.
  const [step, setStep] = useState<"photos" | "auto" | "form">(isEdit || draft ? "form" : "photos");
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
        const r = json.row as IncRow;
        if (!alive) return;
        setData({ ...emptyIncForm(todayStr()), ...r.data }); // 기존 서명 유지
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

  // 신규 작성 자동 임시저장(어느 정도 채워졌을 때만)
  useEffect(() => {
    if (isEdit || typeof window === "undefined") return;
    const filled = data.operatorName.trim() || data.vehicleNo.trim() || data.routeNo.trim();
    if (!filled) return;
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    } catch {
      /* 용량 초과 등 무시 */
    }
    setDraftSaved(false);
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
    if (draft) setData({ ...emptyIncForm(todayStr()), ...draft });
    setDraftHandled(true);
  };

  const patch = (p: Partial<IncFormState>) => setData((d) => ({ ...d, ...p }));
  const toggleCheck = (k: string) =>
    setData((d) => ({ ...d, checks: { ...d.checks, [k]: !d.checks[k] } }));
  // 해당없음 토글: 켜면 ○ 체크 해제(상호배타)
  const toggleNa = (k: string) =>
    setData((d) => {
      const on = !d.naChecks[k];
      return { ...d, naChecks: { ...d.naChecks, [k]: on }, checks: { ...d.checks, [k]: on ? false : d.checks[k] } };
    });
  const checkAll = () =>
    setData((d) => {
      const next: Record<string, boolean> = {};
      // 해당없음이 켜진 항목은 그대로 두고 나머지만 ○
      for (const k of INC_CHECK_KEYS) next[k] = d.naChecks[k] ? false : true;
      return { ...d, checks: next };
    });

  async function save() {
    const miss = firstMissing(data);
    if (miss) return setError(`${miss} 입력/완료가 필요합니다. (특이사항·IH 외 모두 필수)`);
    if (isEdit && !modifiedBy.trim()) return setError("수정자명을 입력하세요.");
    if (!captureRef.current) return setError("미리보기가 준비되지 않았습니다.");
    setError(null);
    setSaving(true);
    try {
      const { pdf, jpg } = await generatePdfAndJpg(captureRef.current);

      // 증빙사진은 Storage에 직접 업로드(수도권과 동일) → 본문에는 참조(path)만 실어 413 차단.
      const slots = photos.filter((s) => !s.na && s.file).map((s) => ({ label: s.label, file: s.file! }));
      let photoRefs: PhotoRef[] = [];
      if (slots.length > 0) photoRefs = await uploadPhotosDirect(slots, crypto.randomUUID());

      const meta = {
        center: "인천",
        operator: data.operatorName,
        model: INC_MODEL,
        install_date: data.installDate,
        vehicle_numbers: data.vehicleNo,
        installer_name: data.installerName,
        operator_signer_name: "",
        data, // 서명 포함 저장(수정 시 유지)
        variant: "incheon",
        ...(photoRefs.length ? { photos_upload: photoRefs } : {}),
        ...(isEdit ? { modified_by: modifiedBy.trim() } : {}),
      };
      const metaStr = JSON.stringify(meta);
      const fd = new FormData();
      fd.append("pdf", pdf, "checklist.pdf");
      fd.append("jpg", jpg, "checklist.jpg"); // 팀즈 인라인 업로드용
      fd.append("meta", metaStr);
      const mb = ((pdf.size + jpg.size + metaStr.length) / (1024 * 1024)).toFixed(1);
      let res: Response;
      try {
        res = await fetch(isEdit ? `/api/checklist/${editId}` : "/api/checklist", {
          method: isEdit ? "PUT" : "POST",
          body: fd,
        });
      } catch (e) {
        throw new Error(`[업로드 ${mb}MB] ${e instanceof Error ? e.message : String(e)}`);
      }
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
          window.localStorage.removeItem(DRAFT_KEY);
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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="safe-bottom flex max-h-[94dvh] w-full max-w-lg flex-col rounded-t-2xl bg-white sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="text-base font-bold text-slate-800">{isEdit ? "인천 체크리스트 수정" : step === "photos" ? "증빙사진 촬영" : step === "auto" ? "IH 자동입력" : "인천 설치완료 체크리스트"}</h2>
          <button onClick={onClose} aria-label="닫기" className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="py-10 text-center text-sm text-slate-400">불러오는 중…</p>
          ) : step === "photos" ? (
            <PhotoStep photos={photos} setPhotos={setPhotos} onNext={() => setStep("auto")} />
          ) : step === "auto" ? (
            <AutoInputStep patch={patch} onNext={() => setStep("form")} onBack={() => setStep("photos")} />
          ) : (
            <div className="flex flex-col gap-3">
              {!isEdit && (
                <button
                  type="button"
                  onClick={() => setStep("auto")}
                  className="self-start text-sm font-semibold text-slate-500 hover:text-slate-700"
                >
                  ← IH 자동입력
                </button>
              )}
              {!isEdit && draft && !draftHandled && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-sm font-bold text-emerald-800">임시저장된 작성 내용이 있어요</p>
                  <p className="mt-0.5 text-xs text-emerald-700">불러오면 입력값·체크·서명이 복원됩니다.</p>
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
                <L t="센터"><input value="인천" readOnly disabled className={`${inp} bg-slate-100 text-slate-500`} /></L>
                <L t="모델"><input value={INC_MODEL} readOnly disabled className={`${inp} bg-slate-100 text-slate-500`} /></L>
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
                <L t="차량번호"><input value={data.vehicleNo} onChange={(e) => patch({ vehicleNo: e.target.value })} placeholder="예: 인천70바1234" className={inp} /></L>
                <L t="좌석수"><input value={data.seatCount} onChange={(e) => patch({ seatCount: e.target.value })} inputMode="numeric" className={inp} /></L>
              </div>

              {/* IH (선택) */}
              <div className="rounded-xl border border-slate-200 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-600">단말기 IH <span className="font-normal text-slate-400">— 선택</span></p>
                  <button type="button" onClick={() => setIhHelp(true)} className="rounded bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-700">설명</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <L t="표출단말기 IH"><input value={data.pyochulIH} onChange={(e) => patch({ pyochulIH: e.target.value })} className={inp} /></L>
                  <L t="표출(모듈) IH"><input value={data.pyochulModuleIH} onChange={(e) => patch({ pyochulModuleIH: e.target.value })} className={inp} /></L>
                  <L t="AFC/BMS처리부,메인 IH"><input value={data.mainIH} onChange={(e) => patch({ mainIH: e.target.value })} className={inp} /></L>
                  <L t="LTE모뎀 IH"><input value={data.lteModemIH} onChange={(e) => patch({ lteModemIH: e.target.value })} className={inp} /></L>
                </div>
                <div className="mt-2">
                  <span className="mb-1 block text-xs font-semibold text-slate-600">승.하차단말기 IH (승차 / 하차1 / 하차2)</span>
                  <div className="flex gap-1">
                    <input value={data.seungChaIH} onChange={(e) => patch({ seungChaIH: e.target.value })} placeholder="승차" className={inp} />
                    <input value={data.hacha1IH} onChange={(e) => patch({ hacha1IH: e.target.value })} placeholder="하차1" className={inp} />
                    <input value={data.hacha2IH} onChange={(e) => patch({ hacha2IH: e.target.value })} placeholder="하차2" className={inp} />
                  </div>
                </div>
                <div className="mt-2">
                  <span className="mb-1 block text-xs font-semibold text-slate-600">승.하차단말기(모듈) IH (승차 / 하차1 / 하차2)</span>
                  <div className="flex gap-1">
                    <input value={data.seungChaModuleIH} onChange={(e) => patch({ seungChaModuleIH: e.target.value })} placeholder="승차" className={inp} />
                    <input value={data.hacha1ModuleIH} onChange={(e) => patch({ hacha1ModuleIH: e.target.value })} placeholder="하차1" className={inp} />
                    <input value={data.hacha2ModuleIH} onChange={(e) => patch({ hacha2ModuleIH: e.target.value })} placeholder="하차2" className={inp} />
                  </div>
                </div>
              </div>

              {/* 차량특성 */}
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

              {/* 버전확인 / 시간확인 */}
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="mb-2 text-sm font-bold text-slate-600">버전 · 시간확인</p>
                <div className="grid grid-cols-2 gap-2">
                  <L t="확인 FW버전"><input value={data.fwVer} onChange={(e) => patch({ fwVer: e.target.value })} className={inp} /></L>
                  <L t="확인 OS버전"><input value={data.osVer} onChange={(e) => patch({ osVer: e.target.value })} className={inp} /></L>
                </div>
                <div className="mt-2">
                  <span className="mb-1 block text-xs font-semibold text-slate-600">시간확인 (현재일시)</span>
                  <div className="flex gap-1">
                    <input value={data.timeValue} onChange={(e) => patch({ timeValue: e.target.value })} placeholder="HH:MM" className={inp} />
                    <button type="button" onClick={() => patch({ timeValue: nowTime() })} className={nowBtn}>NOW</button>
                  </div>
                </div>
              </div>

              {/* 점검 항목 */}
              <div className="rounded-xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                  <span className="text-sm font-bold text-slate-600">점검 항목 (체크 = ○)</span>
                  <button type="button" onClick={checkAll} className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white">전체 ○</button>
                </div>
                {CHECK_GROUPS.map((g) => (
                  <div key={g.no} className="border-b border-slate-100 last:border-0">
                    <p className="bg-slate-50 px-3 py-1 text-xs font-bold text-slate-500">{g.no}. {g.label}</p>
                    {g.items.map((it) => (
                      <div key={it.key} className="flex items-center gap-2 px-3 py-1.5">
                        <input
                          type="checkbox"
                          checked={!!data.checks[it.key]}
                          disabled={it.na && !!data.naChecks[it.key]}
                          onChange={() => toggleCheck(it.key)}
                          className="h-4 w-4 shrink-0"
                        />
                        <span className="min-w-0 flex-1 text-sm text-slate-700">{it.label}</span>
                        {it.na && (
                          <label className="flex shrink-0 items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                            <input type="checkbox" checked={!!data.naChecks[it.key]} onChange={() => toggleNa(it.key)} className="h-3.5 w-3.5" />
                            해당없음
                          </label>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* 특이사항 */}
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="mb-2 text-sm font-bold text-slate-600">특이사항 (선택)</p>
                <textarea value={data.etcContent} onChange={(e) => patch({ etcContent: e.target.value })} placeholder="추가 자재사용 내역 및 특이사항 (운전자 봉 / 승하차 봉 등)" rows={2} className={`${inp} h-auto py-2`} />
                <div className="mt-2"><L t="수량"><input value={data.etcQty} onChange={(e) => patch({ etcQty: e.target.value })} className={inp} /></L></div>
              </div>

              {/* 서명 (설치자만) */}
              <SignBtn label="설치자 확인" name={data.installerName} done={!!data.installerSig} onClick={() => setPad(true)} />

              {/* 미리보기(캡처 대상) */}
              <p className="text-xs text-slate-400">미리보기 (저장 시 이 내용 그대로 PDF)</p>
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
                <div ref={captureRef} className="mx-auto w-[840px]"><IncheonChecklistForm data={data} /></div>
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

        {pad && (
          <SignaturePad title="설치자 서명" initialName={data.installerName}
            onConfirm={(name, sig) => { patch({ installerName: name, installerSig: sig }); setPad(false); }} onClose={() => setPad(false)} />
        )}

        {/* 단말기 IH 확인방법 팝업 */}
        {ihHelp && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={() => setIhHelp(false)}>
            <div className="w-full max-w-sm rounded-2xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-800">단말기 IH 확인방법</p>
                <button onClick={() => setIhHelp(false)} aria-label="닫기" className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
              <p className="mt-2 rounded-lg bg-indigo-50 px-2 py-1.5 text-xs font-semibold text-indigo-700">
                설정 &gt; 설정 &gt; 1472 관리자 모드 진입
              </p>
              <ul className="mt-2 flex flex-col gap-1.5">
                {SLOTS.map((s) => (
                  <li key={s.kind} className="rounded-lg border border-slate-200 px-2 py-1.5">
                    <p className="text-xs font-bold text-slate-700">{s.label}</p>
                    <p className="text-xs text-slate-500">{s.hint}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs font-semibold text-slate-500">※ 입력이 잘되지 않을 경우 수동입력 바랍니다.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 특이사항·IH 외 필수 검증. 첫 누락 항목명 반환(없으면 null)
function firstMissing(d: IncFormState): string | null {
  const req: [boolean, string][] = [
    [!d.operatorName.trim(), "운수사명"],
    [!d.operatorId.trim(), "운수사ID"],
    [!d.installDate, "설치일"],
    [!d.installTime.trim(), "설치시간"],
    [!d.routeNo.trim(), "노선번호"],
    [!d.vehicleNo.trim(), "차량번호"],
    [!d.seatCount.trim(), "좌석수"],
    [!d.vehicleType, "차량 특성"],
    [!d.partition, "격벽설치(O/X)"],
    [!d.manufacturer.trim(), "제조사"],
    [!d.modelName.trim(), "모델명"],
    [!d.fwVer.trim(), "FW버전"],
    [!d.osVer.trim(), "OS버전"],
    [!d.timeValue.trim(), "시간확인"],
  ];
  const naSet = new Set(INC_NA_KEYS);
  const undone = INC_CHECK_ITEMS.filter((it) => !incItemDone(d, it.key, naSet.has(it.key))).length;
  req.push([undone > 0, `점검 항목 ${undone}개 미완료 (○ 또는 해당없음 필요)`]);
  req.push([!d.installerName || !d.installerSig, "설치자 서명"]);
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
