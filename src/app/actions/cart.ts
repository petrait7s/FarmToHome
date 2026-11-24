"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/server/auth/session";
import { getCurrentCart, getOrCreateCartId, loadCart } from "@/server/cart";
import { normalizeCode } from "@/server/promotions";
import { quoteCart, type Quote } from "@/server/quote";
import { rateLimit } from "@/server/rate-limit";

export async function getQuote(zoneId?: string | null): Promise<Quote> {
  const user = await getCurrentUser();
  const cart = await getCurrentCart();
  return quoteCart(cart, { userId: user?.id, phone: user?.phone, zoneId: zoneId ?? null });
}

export async function applyPromoCode(code: string): Promise<Quote> {
  const user = await getCurrentUser();
  const key = user ? `promo:${user.id}` : `promo:anon:${(await getCurrentCart()).id ?? "none"}`;
  const clean = z.string().trim().min(2).max(30).safeParse(code);
  const cartId = await getOrCreateCartId();
  if (clean.success && (await rateLimit(key, 15, 600))) {
    await db.cart.update({ where: { id: cartId }, data: { promoCode: normalizeCode(clean.data) } });
  }
  const cart = await loadCart(cartId);
  const quote = await quoteCart(cart, { userId: user?.id, phone: user?.phone });
  // Don't keep invalid codes on the cart.
  if (quote.promoError && quote.promoError !== "promo_min") {
    await db.cart.update({ where: { id: cartId }, data: { promoCode: null } });
  }
  return quote;
}

export async function removePromoCode(): Promise<Quote> {
  const cartId = await getOrCreateCartId();
  await db.cart.update({ where: { id: cartId }, data: { promoCode: null } });
  return getQuote();
}
