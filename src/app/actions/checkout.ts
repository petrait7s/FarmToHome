"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getCurrentUser, clientIp } from "@/server/auth/session";
import { getOrCreateCartId } from "@/server/cart";
import { availableSlots, type SlotView } from "@/server/delivery";
import { checkoutSchema, placeOrder } from "@/server/orders/place";
import { rateLimit } from "@/server/rate-limit";
import { zodFieldErrors, type FieldErrors } from "@/lib/validation";
import { cuid } from "@/lib/validation";

export async function getSlots(zoneId: string): Promise<SlotView[]> {
  const id = cuid.safeParse(zoneId);
  if (!id.success) return [];
  return availableSlots(id.data);
}

export type CheckoutResult = { ok: true; redirectTo: string } | { ok: false; error?: string; meta?: Record<string, string | number>; fields?: FieldErrors };

export async function placeOrderAction(payload: unknown): Promise<CheckoutResult> {
  const user = await getCurrentUser();
  const ip = clientIp(await headers()) ?? "unknown";
  if (!(await rateLimit(`checkout:${user?.id ?? ip}`, 10, 600))) return { ok: false, error: "too_many" };
  const parsed = checkoutSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, fields: zodFieldErrors(parsed.error) };
  const cartId = await getOrCreateCartId();
  const result = await placeOrder(parsed.data, { cartId, userId: user?.id ?? null });
  if (!result.ok) return { ok: false, error: result.error, meta: result.meta };
  revalidatePath("/account/orders");
  const q = result.guestToken ? `t=${result.guestToken}&` : "";
  return { ok: true, redirectTo: result.nextUrl ?? `/orders/${result.reference}?${q}placed=1` };
}
