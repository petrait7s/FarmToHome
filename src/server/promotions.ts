import "server-only";
import { db, type Tx } from "@/lib/db";
import { evaluatePromotion, type PricedLine, type PromoResult, type PromotionRule } from "./pricing";

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export async function loadPromotionRule(code: string, customer: { userId?: string | null; phone?: string | null }, tx?: Tx): Promise<PromotionRule | null> {
  const client = tx ?? db;
  const promo = await client.promotion.findUnique({
    where: { code: normalizeCode(code) },
    include: { products: { select: { id: true } }, categories: { select: { id: true } } },
  });
  if (!promo) return null;
  let customerUses = 0;
  if (promo.perCustomerLimit !== null && (customer.userId || customer.phone)) {
    customerUses = await client.promotionRedemption.count({
      where: {
        promotionId: promo.id,
        OR: [customer.userId ? { userId: customer.userId } : undefined, customer.phone ? { phone: customer.phone } : undefined].filter(Boolean) as object[],
      },
    });
  }
  return {
    code: promo.code,
    type: promo.type,
    value: promo.value,
    minSubtotalMinor: promo.minSubtotalMinor,
    maxDiscountMinor: promo.maxDiscountMinor,
    startsAt: promo.startsAt,
    endsAt: promo.endsAt,
    active: promo.active,
    usageLimit: promo.usageLimit,
    usedCount: promo.usedCount,
    perCustomerLimit: promo.perCustomerLimit,
    customerUses,
    productIds: promo.products.map((p) => p.id),
    categoryIds: promo.categories.map((c) => c.id),
  };
}

export async function applyPromotion(code: string | null | undefined, lines: PricedLine[], customer: { userId?: string | null; phone?: string | null }, tx?: Tx): Promise<PromoResult | null> {
  if (!code) return null;
  const rule = await loadPromotionRule(code, customer, tx);
  return evaluatePromotion(rule, lines);
}
