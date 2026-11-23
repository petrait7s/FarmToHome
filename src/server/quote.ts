import "server-only";
import { db } from "@/lib/db";
import type { CartView } from "./cart";
import { computeTotals, type PricedLine } from "./pricing";
import { applyPromotion } from "./promotions";
import { getSettings } from "./settings";

export type Quote = {
  subtotalMinor: number;
  discountMinor: number;
  deliveryFeeMinor: number;
  totalMinor: number;
  promoCode: string | null;
  promoError: string | null;
  promoMinSubtotalMinor: number | null;
  minOrderMinor: number;
  meetsMinimum: boolean;
  zoneName: string | null;
  hasUnavailable: boolean;
};

export function pricedLines(cart: CartView): PricedLine[] {
  return cart.lines
    .filter((l) => l.available)
    .map((l) => ({ variantId: l.variantId, productId: l.productId, categoryId: l.categoryId, unitPriceMinor: l.unitPriceMinor, quantity: l.quantity }));
}

/** Server-side quote for a cart. The same rules are re-applied inside the order transaction. */
export async function quoteCart(cart: CartView, opts: { userId?: string | null; phone?: string | null; zoneId?: string | null }): Promise<Quote> {
  const settings = await getSettings();
  const zone = opts.zoneId
    ? await db.deliveryZone.findFirst({ where: { id: opts.zoneId, active: true } })
    : await db.deliveryZone.findFirst({ where: { active: true }, orderBy: { feeMinor: "asc" } });
  const lines = pricedLines(cart);
  let discount = 0;
  let promoError: string | null = null;
  let promoMin: number | null = null;
  if (cart.promoCode && lines.length) {
    const r = await applyPromotion(cart.promoCode, lines, { userId: opts.userId, phone: opts.phone });
    if (r?.ok) discount = r.discountMinor;
    else if (r) {
      promoError = r.error;
      promoMin = r.minSubtotalMinor ?? null;
    }
  }
  const totals = computeTotals(lines, zone ? { feeMinor: zone.feeMinor, freeThresholdMinor: zone.freeThresholdMinor } : null, discount);
  return {
    ...totals,
    promoCode: cart.promoCode,
    promoError,
    promoMinSubtotalMinor: promoMin,
    minOrderMinor: settings.minOrderMinor,
    meetsMinimum: totals.subtotalMinor >= settings.minOrderMinor,
    zoneName: zone?.name ?? null,
    hasUnavailable: cart.lines.some((l) => !l.available),
  };
}
