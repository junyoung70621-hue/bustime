// ─────────────────────────────────────────────────────────────
// 대전·세종 자재 지급확인서 — 모델·용도별 품목 + 헬퍼
//   품목 데이터는 items.generated.ts(엑셀 자동추출)에서 제공.
//   FormState/ItemState 등 타입은 기존 daepyecha 모듈을 재사용.
// ─────────────────────────────────────────────────────────────
import type { ItemState } from "@/lib/daepyecha/types";
import { REG_JAJAE_ITEMS, REG_JAJAE_MODELS } from "./items.generated";
import type { RegJajaeModel, RegJajaePurpose } from "./items.generated";

export { REG_JAJAE_MODELS };
export type { RegJajaeModel, RegJajaePurpose };

// 지역 목록은 체크리스트(지역)과 동일 소스 재사용
export { REGIONS, REGION_CODE } from "@/lib/checklist-regional/templates";

/** 모델×용도 품목 → 작성용 ItemState[] (수량 = 대당 1 × 대수, 신규/재활용은 기본 '신규') */
export function regJajaeItemsFor(model: RegJajaeModel, purpose: RegJajaePurpose, count: number): ItemState[] {
  const tpl = REG_JAJAE_ITEMS[model]?.[purpose] ?? [];
  return tpl.map((t) => ({
    name: t.name,
    bigo: t.bigo,
    qty: (t.perUnit ?? 1) * count,
    hasNewReused: t.hasNewReused,
    newReused: t.hasNewReused ? "신규" : null,
    perUnit: t.perUnit,
  }));
}
