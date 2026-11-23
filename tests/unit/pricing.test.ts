import { describe, expect, it } from "vitest";
import { computeTotals, deliveryFee, evaluatePromotion, type PricedLine, type PromotionRule } from "@/server/pricing";

const lines: PricedLine[] = [
  { variantId: "v1", productId: "p1", categoryId: "rice", unitPriceMinor: 42000, quantity: 2 },
  { variantId: "v2", productId: "p2", categoryId: "fish", unitPriceMinor: 38000, quantity: 1 },
];

const rule = (over: Partial<PromotionRule> = {}): PromotionRule => ({
  code: "TEST", type: "PERCENT", value: 10, minSubtotalMinor: null, maxDiscountMinor: null, startsAt: null, endsAt: null,
  active: true, usageLimit: null, usedCount: 0, perCustomerLimit: null, customerUses: 0, productIds: [], categoryIds: [], ...over,
});

describe("delivery fee", () => {
  it("charges the zone fee below the free threshold", () => {
    expect(deliveryFee(100000, { feeMinor: 6000, freeThresholdMinor: 250000 })).toBe(6000);
  });
  it("is free at or above the threshold", () => {
    expect(deliveryFee(250000, { feeMinor: 6000, freeThresholdMinor: 250000 })).toBe(0);
  });
  it("is zero for an empty basket", () => {
    expect(deliveryFee(0, { feeMinor: 6000, freeThresholdMinor: null })).toBe(0);
  });
});

describe("promotions", () => {
  it("applies a percentage discount across all lines", () => {
    const r = evaluatePromotion(rule(), lines);
    expect(r.ok && r.discountMinor).toBe(12200);
  });
  it("caps a percentage discount at the maximum", () => {
    const r = evaluatePromotion(rule({ maxDiscountMinor: 5000 }), lines);
    expect(r.ok && r.discountMinor).toBe(5000);
  });
  it("never discounts more than the eligible total", () => {
    const r = evaluatePromotion(rule({ type: "FIXED", value: 10_000_000 }), lines);
    expect(r.ok && r.discountMinor).toBe(122000);
  });
  it("restricts to categories", () => {
    const r = evaluatePromotion(rule({ type: "FIXED", value: 10000, categoryIds: ["fish"] }), lines);
    expect(r.ok && r.discountMinor).toBe(10000);
    expect(r.ok && r.perLine.get("v2")).toBe(10000);
    expect(r.ok && (r.perLine.get("v1") ?? 0)).toBe(0);
  });
  it("rejects when no line is in scope", () => {
    expect(evaluatePromotion(rule({ categoryIds: ["honey"] }), lines)).toMatchObject({ ok: false, error: "promo_scope" });
  });
  it("rejects expired, future, inactive and exhausted codes", () => {
    expect(evaluatePromotion(rule({ endsAt: new Date(Date.now() - 1000) }), lines)).toMatchObject({ ok: false, error: "promo_expired" });
    expect(evaluatePromotion(rule({ startsAt: new Date(Date.now() + 864e5) }), lines)).toMatchObject({ ok: false, error: "promo_invalid" });
    expect(evaluatePromotion(rule({ active: false }), lines)).toMatchObject({ ok: false, error: "promo_invalid" });
    expect(evaluatePromotion(rule({ usageLimit: 5, usedCount: 5 }), lines)).toMatchObject({ ok: false, error: "promo_limit" });
    expect(evaluatePromotion(rule({ perCustomerLimit: 1, customerUses: 1 }), lines)).toMatchObject({ ok: false, error: "promo_limit" });
    expect(evaluatePromotion(null, lines)).toMatchObject({ ok: false, error: "promo_invalid" });
  });
  it("enforces a minimum subtotal", () => {
    expect(evaluatePromotion(rule({ minSubtotalMinor: 200000 }), lines)).toMatchObject({ ok: false, error: "promo_min", minSubtotalMinor: 200000 });
  });
  it("spreads the discount across lines so the parts add up exactly", () => {
    const r = evaluatePromotion(rule({ type: "FIXED", value: 1001 }), lines);
    if (!r.ok) throw new Error("expected ok");
    const sum = [...r.perLine.values()].reduce((s, v) => s + v, 0);
    expect(sum).toBe(1001);
  });
});

describe("totals", () => {
  it("bases the delivery fee on the discounted subtotal", () => {
    const t = computeTotals(lines, { feeMinor: 6000, freeThresholdMinor: 120000 }, 5000);
    expect(t).toEqual({ subtotalMinor: 122000, discountMinor: 5000, deliveryFeeMinor: 6000, totalMinor: 123000 });
  });
  it("is free delivery when the discounted subtotal still meets the threshold", () => {
    const t = computeTotals(lines, { feeMinor: 6000, freeThresholdMinor: 100000 }, 5000);
    expect(t.deliveryFeeMinor).toBe(0);
    expect(t.totalMinor).toBe(117000);
  });
});
