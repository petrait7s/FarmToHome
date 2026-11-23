/**
 * Pure pricing functions (no I/O) so they can be unit tested and reused by cart and checkout.
 * All amounts are integer minor units.
 */

export type PricedLine = {
  variantId: string;
  productId: string;
  categoryId: string;
  unitPriceMinor: number;
  quantity: number;
};

export type PromotionRule = {
  code: string;
  type: "PERCENT" | "FIXED";
  value: number; // percent (1–100) or fixed minor units
  minSubtotalMinor: number | null;
  maxDiscountMinor: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  active: boolean;
  usageLimit: number | null;
  usedCount: number;
  perCustomerLimit: number | null;
  customerUses: number;
  productIds: string[];
  categoryIds: string[];
};

export type PromoResult =
  | { ok: true; discountMinor: number; perLine: Map<string, number> }
  | { ok: false; error: "promo_invalid" | "promo_expired" | "promo_limit" | "promo_min" | "promo_scope"; minSubtotalMinor?: number };

export type ZoneRule = { feeMinor: number; freeThresholdMinor: number | null };

export function lineTotal(line: PricedLine): number {
  return line.unitPriceMinor * line.quantity;
}

export function subtotalOf(lines: PricedLine[]): number {
  return lines.reduce((s, l) => s + lineTotal(l), 0);
}

export function evaluatePromotion(rule: PromotionRule | null, lines: PricedLine[], now = new Date()): PromoResult {
  if (!rule || !rule.active) return { ok: false, error: "promo_invalid" };
  if (rule.startsAt && rule.startsAt > now) return { ok: false, error: "promo_invalid" };
  if (rule.endsAt && rule.endsAt < now) return { ok: false, error: "promo_expired" };
  if (rule.usageLimit !== null && rule.usedCount >= rule.usageLimit) return { ok: false, error: "promo_limit" };
  if (rule.perCustomerLimit !== null && rule.customerUses >= rule.perCustomerLimit) return { ok: false, error: "promo_limit" };

  const subtotal = subtotalOf(lines);
  if (rule.minSubtotalMinor !== null && subtotal < rule.minSubtotalMinor) {
    return { ok: false, error: "promo_min", minSubtotalMinor: rule.minSubtotalMinor };
  }

  const scoped = rule.productIds.length > 0 || rule.categoryIds.length > 0;
  const eligible = scoped
    ? lines.filter((l) => rule.productIds.includes(l.productId) || rule.categoryIds.includes(l.categoryId))
    : lines;
  if (eligible.length === 0) return { ok: false, error: "promo_scope" };

  const eligibleTotal = subtotalOf(eligible);
  let discount = rule.type === "PERCENT" ? Math.floor((eligibleTotal * Math.min(100, Math.max(0, rule.value))) / 100) : rule.value;
  if (rule.maxDiscountMinor !== null) discount = Math.min(discount, rule.maxDiscountMinor);
  discount = Math.max(0, Math.min(discount, eligibleTotal));

  // Spread the discount across eligible lines proportionally (largest remainder) for order-item records.
  const perLine = new Map<string, number>();
  let allocated = 0;
  const shares = eligible.map((l) => {
    const exact = eligibleTotal ? (discount * lineTotal(l)) / eligibleTotal : 0;
    const floor = Math.floor(exact);
    allocated += floor;
    return { id: l.variantId, floor, rem: exact - floor };
  });
  let left = discount - allocated;
  shares.sort((a, b) => b.rem - a.rem);
  for (const s of shares) {
    perLine.set(s.id, s.floor + (left > 0 ? 1 : 0));
    if (left > 0) left--;
  }
  return { ok: true, discountMinor: discount, perLine };
}

export function deliveryFee(subtotalAfterDiscountMinor: number, zone: ZoneRule | null): number {
  if (!zone) return 0;
  if (subtotalAfterDiscountMinor <= 0) return 0;
  if (zone.freeThresholdMinor !== null && subtotalAfterDiscountMinor >= zone.freeThresholdMinor) return 0;
  return zone.feeMinor;
}

export type Totals = { subtotalMinor: number; discountMinor: number; deliveryFeeMinor: number; totalMinor: number };

export function computeTotals(lines: PricedLine[], zone: ZoneRule | null, discountMinor = 0): Totals {
  const subtotalMinor = subtotalOf(lines);
  const discount = Math.min(discountMinor, subtotalMinor);
  const fee = deliveryFee(subtotalMinor - discount, zone);
  return { subtotalMinor, discountMinor: discount, deliveryFeeMinor: fee, totalMinor: subtotalMinor - discount + fee };
}
