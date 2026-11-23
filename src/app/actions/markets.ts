"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/server/auth/guards";
import { getCurrentUser } from "@/server/auth/session";
import { addLinesToCart, getCurrentCart, getOrCreateCartId, loadCart, type CartView } from "@/server/cart";
import { cuid } from "@/lib/validation";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const modeSchema = z.enum(["WEEKLY", "MONTHLY", "CUSTOM"]);
const nameSchema = z.string().trim().min(1, "required").max(60);

async function ownMarket(userId: string, id: string) {
  const m = await db.savedMarket.findFirst({ where: { id, userId }, include: { items: true } });
  if (!m) throw new Error("not_found");
  return m;
}

/** Save the current basket as a new named market. */
export async function saveCartAsMarket(input: { name: string; mode: string }): Promise<Result<{ id: string; name: string }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthorized" };
  const name = nameSchema.safeParse(input.name);
  const mode = modeSchema.safeParse(input.mode);
  if (!name.success || !mode.success) return { ok: false, error: "required" };
  const cart = await getCurrentCart();
  const lines = cart.lines.filter((l) => l.available);
  if (!lines.length) return { ok: false, error: "cart_empty" };
  const market = await db.savedMarket.create({
    data: {
      userId: user.id, name: name.data, mode: mode.data,
      items: { create: lines.map((l, i) => ({ variantId: l.variantId, quantity: l.quantity, position: i })) },
    },
  });
  revalidatePath("/account/markets");
  return { ok: true, id: market.id, name: market.name };
}

/** Load a saved market into the basket (replace or merge). Ownership is enforced. */
export async function repeatMarket(input: { id: string; mode: "replace" | "merge" }): Promise<Result<{ cart: CartView; skipped: number }>> {
  const user = await requireUser();
  const id = cuid.parse(input.id);
  const market = await ownMarket(user.id, id).catch(() => null);
  if (!market) return { ok: false, error: "not_found" };
  const cartId = await getOrCreateCartId();
  const result = await addLinesToCart(cartId, market.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })), input.mode === "merge" ? "merge" : "replace");
  await db.cart.update({ where: { id: cartId }, data: { mode: market.mode } });
  await db.savedMarket.update({ where: { id }, data: { useCount: { increment: 1 }, lastUsedAt: new Date() } });
  revalidatePath("/account/markets");
  return { ok: true, cart: await loadCart(cartId), skipped: result.skipped };
}

export async function renameMarket(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = cuid.parse(formData.get("id"));
  const name = nameSchema.parse(formData.get("name"));
  await ownMarket(user.id, id);
  await db.savedMarket.update({ where: { id }, data: { name } });
  revalidatePath("/account/markets");
}

export async function deleteMarket(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = cuid.parse(formData.get("id"));
  await ownMarket(user.id, id);
  await db.savedMarket.delete({ where: { id } });
  revalidatePath("/account/markets");
}

export async function updateMarketItem(formData: FormData): Promise<void> {
  const user = await requireUser();
  const marketId = cuid.parse(formData.get("marketId"));
  const itemId = cuid.parse(formData.get("itemId"));
  const op = z.enum(["inc", "dec", "remove", "up", "down"]).parse(formData.get("op"));
  const market = await ownMarket(user.id, marketId);
  const items = [...market.items].sort((a, b) => a.position - b.position);
  const idx = items.findIndex((i) => i.id === itemId);
  if (idx < 0) return;
  const item = items[idx];
  if (op === "remove" || (op === "dec" && item.quantity <= 1)) {
    await db.savedMarketItem.delete({ where: { id: item.id } });
  } else if (op === "inc" || op === "dec") {
    await db.savedMarketItem.update({ where: { id: item.id }, data: { quantity: Math.min(30, item.quantity + (op === "inc" ? 1 : -1)) } });
  } else {
    const swapWith = items[op === "up" ? idx - 1 : idx + 1];
    if (swapWith) {
      await db.$transaction([
        db.savedMarketItem.update({ where: { id: item.id }, data: { position: swapWith.position } }),
        db.savedMarketItem.update({ where: { id: swapWith.id }, data: { position: item.position } }),
      ]);
    }
  }
  // Normalise positions so up/down always works even if positions collided.
  const fresh = await db.savedMarketItem.findMany({ where: { savedMarketId: marketId }, orderBy: [{ position: "asc" }, { id: "asc" }] });
  await db.$transaction(fresh.map((f, i) => db.savedMarketItem.update({ where: { id: f.id }, data: { position: i } })));
  await db.savedMarket.update({ where: { id: marketId }, data: { updatedAt: new Date() } });
  revalidatePath("/account/markets");
}

/** Replace a saved market's items with the current basket contents. */
export async function replaceMarketWithCart(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = cuid.parse(formData.get("id"));
  await ownMarket(user.id, id);
  const cart = await getCurrentCart();
  const lines = cart.lines.filter((l) => l.available);
  if (!lines.length) return;
  await db.$transaction([
    db.savedMarketItem.deleteMany({ where: { savedMarketId: id } }),
    db.savedMarketItem.createMany({ data: lines.map((l, i) => ({ savedMarketId: id, variantId: l.variantId, quantity: l.quantity, position: i })) }),
    db.savedMarket.update({ where: { id }, data: { updatedAt: new Date() } }),
  ]);
  revalidatePath("/account/markets");
}

/** Persist household size for signed-in customers (used for hints and suggestions). */
export async function saveHouseholdSize(size: number): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  const n = z.number().int().min(1).max(20).parse(size);
  await db.customerProfile.upsert({ where: { userId: user.id }, create: { userId: user.id, householdSize: n }, update: { householdSize: n } });
}
