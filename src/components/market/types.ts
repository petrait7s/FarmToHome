import type { ProductDTO, VariantDTO } from "@/server/catalog";

export type Mode = "WEEKLY" | "MONTHLY" | "CUSTOM";

export type MarketCategory = { id: string; slug: string; name: string; nameBn: string | null; story: string | null; storyBn: string | null; description: string | null; descriptionBn: string | null };

export type TraceInfo = { batchNumber: string; collectedAt: string | null; packedAt: string | null; isDemo: boolean };

export type SavedMarketSummary = { id: string; name: string; mode: Mode; itemCount: number };

export type ZoneRule = { feeMinor: number; freeThresholdMinor: number | null } | null;

export type { ProductDTO, VariantDTO };

/** Weekly or monthly household need for a product, in its usage unit. */
export function householdNeed(p: ProductDTO, household: number, mode: Mode): number | null {
  if (!p.householdUsePerPersonWeek) return null;
  return p.householdUsePerPersonWeek * household * (mode === "MONTHLY" ? 4.3 : 1);
}

/** Variant quantity in the product's usage unit (g→kg, ml→L). */
export function variantAmount(v: VariantDTO): number {
  return v.unit === "g" || v.unit === "ml" ? v.netQuantity / 1000 : v.netQuantity;
}

/** Choose the pack size and pack count that best matches a household need (fewest packs on ties). */
export function suggestPick(p: ProductDTO, household: number, mode: Mode): { variant: VariantDTO; quantity: number } {
  const need = householdNeed(p, household, mode);
  const fallback = mode === "MONTHLY" ? p.variants[p.variants.length - 1] : p.variants[0];
  if (!need) return { variant: fallback, quantity: 1 };
  let best = { variant: fallback, quantity: 1, diff: Number.POSITIVE_INFINITY };
  for (const v of p.variants) {
    const amount = variantAmount(v);
    if (!amount) continue;
    const quantity = Math.max(1, Math.round(need / amount));
    const diff = Math.abs(quantity * amount - need) + quantity * 0.01;
    if (diff < best.diff) best = { variant: v, quantity, diff };
  }
  return { variant: best.variant, quantity: best.quantity };
}

export function formatAmount(amount: number, unit: string): string {
  if (unit === "kg" && amount < 1) return `${Math.round(amount * 1000)} g`;
  if (unit === "L" && amount < 1) return `${Math.round(amount * 1000)} ml`;
  return `${Math.round(amount * 10) / 10} ${unit}`;
}
