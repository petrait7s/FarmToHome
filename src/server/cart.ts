import "server-only";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { hashToken, randomToken } from "@/lib/crypto";
import { isProd } from "@/lib/env";
import { getCurrentUser } from "./auth/session";
import { availableByVariant } from "./inventory/availability";
import type { MarketMode } from "@/generated/prisma/client";

export const CART_COOKIE = "fth_cart";
export const MAX_LINE_QTY = 30;

export type CartLine = {
  variantId: string;
  productId: string;
  productSlug: string;
  productName: string;
  productNameBn: string | null;
  categoryId: string;
  categorySlug: string;
  variantLabel: string;
  unitPriceMinor: number;
  quantity: number;
  lineTotalMinor: number;
  artKey: string | null;
  imageUrl: string | null;
  originDistrict: string | null;
  isPerishable: boolean;
  fulfillmentMode: "STOCK" | "SOURCED_TO_ORDER";
  available: boolean;
  availableQty: number | null;
};

export type CartView = {
  id: string | null;
  mode: MarketMode;
  promoCode: string | null;
  lines: CartLine[];
  productCount: number;
  itemCount: number;
  subtotalMinor: number;
};

const EMPTY: CartView = { id: null, mode: "WEEKLY", promoCode: null, lines: [], productCount: 0, itemCount: 0, subtotalMinor: 0 };

async function findCartId(): Promise<string | null> {
  const user = await getCurrentUser();
  if (user) {
    const c = await db.cart.findFirst({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, select: { id: true } });
    return c?.id ?? null;
  }
  const token = (await cookies()).get(CART_COOKIE)?.value;
  if (!token) return null;
  const c = await db.cart.findUnique({ where: { anonTokenHash: hashToken(token) }, select: { id: true } });
  return c?.id ?? null;
}

/** Only call from Server Actions / Route Handlers (may set a cookie). */
export async function getOrCreateCartId(): Promise<string> {
  const existing = await findCartId();
  if (existing) return existing;
  const user = await getCurrentUser();
  if (user) {
    const c = await db.cart.create({ data: { userId: user.id } });
    return c.id;
  }
  const token = randomToken();
  const c = await db.cart.create({ data: { anonTokenHash: hashToken(token) } });
  (await cookies()).set(CART_COOKIE, token, { httpOnly: true, secure: isProd, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 60 });
  return c.id;
}

export async function loadCart(cartId: string | null): Promise<CartView> {
  if (!cartId) return EMPTY;
  const cart = await db.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        orderBy: { addedAt: "asc" },
        include: {
          variant: {
            include: {
              product: {
                select: {
                  id: true, slug: true, name: true, nameBn: true, status: true, artKey: true, isPerishable: true,
                  category: { select: { id: true, slug: true } },
                  origin: { select: { district: true } },
                  images: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!cart) return EMPTY;
  const avail = await availableByVariant(cart.items.map((i) => i.variantId));
  const lines: CartLine[] = cart.items.map((i) => {
    const v = i.variant;
    const p = v.product;
    const availableQty = avail.get(v.id) ?? 0;
    const available = v.active && p.status === "ACTIVE" && (availableQty === null || availableQty >= i.quantity);
    return {
      variantId: v.id,
      productId: p.id,
      productSlug: p.slug,
      productName: p.name,
      productNameBn: p.nameBn,
      categoryId: p.category.id,
      categorySlug: p.category.slug,
      variantLabel: v.label,
      unitPriceMinor: v.priceMinor,
      quantity: i.quantity,
      lineTotalMinor: v.priceMinor * i.quantity,
      artKey: p.artKey,
      imageUrl: p.images[0]?.url ?? null,
      originDistrict: p.origin?.district ?? null,
      isPerishable: p.isPerishable,
      fulfillmentMode: v.fulfillmentMode,
      available,
      availableQty,
    };
  });
  const counted = lines.filter((l) => l.available);
  return {
    id: cart.id,
    mode: cart.mode,
    promoCode: cart.promoCode,
    lines,
    productCount: counted.length,
    itemCount: counted.reduce((s, l) => s + l.quantity, 0),
    subtotalMinor: counted.reduce((s, l) => s + l.lineTotalMinor, 0),
  };
}

/** Read-only, safe in Server Components. */
export async function getCurrentCart(): Promise<CartView> {
  return loadCart(await findCartId());
}

export type CartError = { error: "not_found" | "unavailable" | "out_of_stock" | "limit"; available?: number | null; name?: string };

/** Set an absolute quantity (0 removes). Validates product state and stock on the server. */
export async function setCartQuantity(cartId: string, variantId: string, quantity: number): Promise<CartError | null> {
  const qty = Math.max(0, Math.floor(quantity));
  if (qty === 0) {
    await db.cartItem.deleteMany({ where: { cartId, variantId } });
    await db.cart.update({ where: { id: cartId }, data: { updatedAt: new Date() } });
    return null;
  }
  if (qty > MAX_LINE_QTY) return { error: "limit" };
  const variant = await db.productVariant.findUnique({
    where: { id: variantId },
    select: { id: true, active: true, product: { select: { status: true, name: true } } },
  });
  if (!variant) return { error: "not_found" };
  if (!variant.active || variant.product.status !== "ACTIVE") return { error: "unavailable", name: variant.product.name };
  const available = (await availableByVariant([variantId])).get(variantId) ?? 0;
  if (available !== null && qty > available) return { error: "out_of_stock", available, name: variant.product.name };
  await db.cartItem.upsert({
    where: { cartId_variantId: { cartId, variantId } },
    create: { cartId, variantId, quantity: qty },
    update: { quantity: qty },
  });
  await db.cart.update({ where: { id: cartId }, data: { updatedAt: new Date() } });
  return null;
}

/** Replace a variant line with another variant of the same product (pack-size change), keeping quantity. */
export async function swapVariant(cartId: string, fromVariantId: string, toVariantId: string): Promise<CartError | null> {
  const [from, to] = await Promise.all([
    db.productVariant.findUnique({ where: { id: fromVariantId }, select: { productId: true } }),
    db.productVariant.findUnique({ where: { id: toVariantId }, select: { productId: true } }),
  ]);
  if (!from || !to || from.productId !== to.productId) return { error: "not_found" };
  const line = await db.cartItem.findUnique({ where: { cartId_variantId: { cartId, variantId: fromVariantId } } });
  if (!line) return { error: "not_found" };
  const err = await setCartQuantity(cartId, toVariantId, line.quantity);
  if (err) return err;
  await db.cartItem.deleteMany({ where: { cartId, variantId: fromVariantId } });
  return null;
}

export async function clearCart(cartId: string): Promise<void> {
  await db.$transaction([db.cartItem.deleteMany({ where: { cartId } }), db.cart.update({ where: { id: cartId }, data: { promoCode: null } })]);
}

/** Add many lines at once (repeat saved market / reorder). Skips unavailable items and caps at stock. */
export async function addLinesToCart(cartId: string, lines: { variantId: string; quantity: number }[], mode: "merge" | "replace"): Promise<{ added: number; skipped: number }> {
  if (mode === "replace") await db.cartItem.deleteMany({ where: { cartId } });
  const variants = await db.productVariant.findMany({
    where: { id: { in: lines.map((l) => l.variantId) }, active: true, product: { status: "ACTIVE" } },
    select: { id: true },
  });
  const okIds = new Set(variants.map((v) => v.id));
  const avail = await availableByVariant([...okIds]);
  const existing = new Map((await db.cartItem.findMany({ where: { cartId } })).map((i) => [i.variantId, i.quantity]));
  let added = 0, skipped = 0;
  for (const l of lines) {
    if (!okIds.has(l.variantId)) { skipped++; continue; }
    const a = avail.get(l.variantId);
    let qty = Math.min(MAX_LINE_QTY, (existing.get(l.variantId) ?? 0) + l.quantity);
    if (a !== null && a !== undefined) qty = Math.min(qty, a);
    if (qty <= 0) { skipped++; continue; }
    await db.cartItem.upsert({
      where: { cartId_variantId: { cartId, variantId: l.variantId } },
      create: { cartId, variantId: l.variantId, quantity: qty },
      update: { quantity: qty },
    });
    added++;
  }
  await db.cart.update({ where: { id: cartId }, data: { updatedAt: new Date() } });
  return { added, skipped };
}

/** On sign-in: move the anonymous cart's lines into the user's cart and drop the cookie. */
export async function mergeAnonymousCart(userId: string): Promise<void> {
  const jar = await cookies();
  const token = jar.get(CART_COOKIE)?.value;
  if (!token) return;
  const anon = await db.cart.findUnique({ where: { anonTokenHash: hashToken(token) }, include: { items: true } });
  jar.delete(CART_COOKIE);
  if (!anon) return;
  let target = await db.cart.findFirst({ where: { userId }, orderBy: { updatedAt: "desc" } });
  if (!target) {
    await db.cart.update({ where: { id: anon.id }, data: { userId, anonTokenHash: null } });
    return;
  }
  if (anon.items.length) {
    await addLinesToCart(target.id, anon.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })), "merge");
    target = await db.cart.update({ where: { id: target.id }, data: { mode: anon.mode } });
  }
  await db.cart.delete({ where: { id: anon.id } });
}

export async function setCartMode(cartId: string, mode: MarketMode): Promise<void> {
  await db.cart.update({ where: { id: cartId }, data: { mode } });
}
