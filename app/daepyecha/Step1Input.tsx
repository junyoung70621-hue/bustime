"use client";

// ─────────────────────────────────────────────────────────────
// 신규 작성 1단계: 기본 정보 입력
//   센터 / 운수사 / 모델 / 수량(대수) / 차량번호 / 지급날짜 + 품목별 수량·신규재활용
// ─────────────────────────────────────────────────────────────
import { CENTERS, MODELS } from "@/lib/daepyecha/templates";
import type { FormState, Model, NewReused, Center } from "@/lib/daepyecha/types";

export default function Step1Input({
  data,
  patch,
  onModelChange,
  onCountChange,
  onItemQty,
  onItemNR,
  onNext,
  error,
}: {
  data: FormState;
  patch: (p: Partial<FormState>) => void;
  onModelChange: (m: Model) => void;
  onCountChange: (n: number) => void;
  onItemQty: (i: number, qty: number) => void;
  onItemNR: (i: number, v: NewReused) => void;
  onNext: () => void;
  error: string | null;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="센터">
          <select
            value={data.center}
            onChange={(e) => patch({ center: e.target.value as Center })}
            className={selectCls}
          >
            <option value="">선택</option>
            {CENTERS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="모델">
          <select
            value={data.model}
            onChange={(e) => onModelChange(e.target.value as Model)}
            className={selectCls}
          >
            <option value="">선택</option>
            {MODELS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="운수사">
        <input
          value={data.operator}
          onChange={(e) => patch({ operator: e.target.value })}
          placeholder="예: ○○운수"
          className={inputCls}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="수량 (차량 대수)">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={data.vehicleCount || ""}
            onChange={(e) => onCountChange(Number(e.target.value) || 0)}
            placeholder="예: 3"
            className={inputCls}
          />
        </Field>
        <Field label="지급 날짜">
          <input
            type="date"
            value={data.issuedDate}
            onChange={(e) => patch({ issuedDate: e.target.value })}
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="차량번호 (선택)">
        <input
          value={data.vehicleNumbers}
          onChange={(e) => patch({ vehicleNumbers: e.target.value })}
          placeholder="예: 서울70사1234, 1235"
          className={inputCls}
        />
      </Field>

      {/* 품목 */}
      {data.model ? (
        <div className="rounded-xl border border-slate-200">
          <p className="border-b border-slate-100 px-3 py-2 text-sm font-bold text-slate-600">
            품목 ({data.items.length}) — 수량은 대수로 자동 입력, 수정 가능
          </p>
          <ul className="flex flex-col divide-y divide-slate-100">
            {data.items.map((it, i) => (
              <li key={i} className="flex items-center gap-2 px-3 py-2">
                <span className="w-5 shrink-0 text-xs text-slate-400">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{it.name}</span>
                {it.hasNewReused && (
                  <span className="flex shrink-0 overflow-hidden rounded-md ring-1 ring-slate-200">
                    {(["신규", "재활용"] as NewReused[]).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => onItemNR(i, v)}
                        className={`px-2 py-1 text-xs font-semibold ${
                          it.newReused === v ? "bg-brand-600 text-white" : "bg-white text-slate-500"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </span>
                )}
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={it.qty || ""}
                  onChange={(e) => onItemQty(i, Number(e.target.value) || 0)}
                  className="h-8 w-14 shrink-0 rounded-lg border border-slate-300 px-2 text-center text-sm outline-none focus:border-brand-500"
                />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-400">
          모델을 선택하면 품목이 표시됩니다.
        </p>
      )}

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <button
        onClick={onNext}
        className="h-12 w-full rounded-xl bg-brand-600 text-base font-bold text-white hover:bg-brand-700"
      >
        다음 (서명)
      </button>
    </div>
  );
}

const inputCls =
  "h-11 w-full rounded-xl border border-slate-300 px-3 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";
const selectCls =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  );
}
