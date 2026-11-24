"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getOrderForViewer } from "@/server/orders/access";
import { changeOrderStatus } from "@/server/orders/manage";
import { setPaymentStatus } from "@/server/payments";
import { addLinesToCart, getOrCreateCartId } from "@/server/cart";

const refSchema = z.string().regex(/^FTH-\d{6}-[A-Z0-9]{5}$/);

function back(ref: string, token?: string | null, extra = "") {
  const params = new URLSearchParams();
  if (token) params.set("t", token);
  if (extra) params.set("m", extra);
  const s = params.toString();
  return `/orders/${ref}${s ? `?${s}` : ""}`;
}

export async function cancelOrderAction(formData: FormData): Promise<void> {
  const ref = refSchema.parse(formData.get("ref"));
  const token = (formData.get("t") as string) || null;
  const access = await getOrderForViewer(ref, token);
  if (!access || (!access.viewer.owner && !access.viewer.guest)) redirect(back(ref, token));
  await changeOrderStatus(access.order.id, "CANCELLED", access.viewer.userId, "Cancelled by customer", { asCustomer: true });
  revalidatePath(`/orders/${ref}`);
  redirect(back(ref, token, "cancelled"));
}

export async function reorderAction(formData: FormData): Promise<void> {
  const ref = refSchema.parse(formData.get("ref"));
  const token = (formData.get("t") as string) || null;
  const access = await getOrderForViewer(ref, token);
  if (!access) redirect("/");
  const cartId = await getOrCreateCartId();
  await addLinesToCart(cartId, access.order.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })), "merge");
  redirect("/basket");
}

/** Development sandbox: the customer decides the outcome of a simulated payment. No provider is contacted. */
export async function simulatePaymentAction(formData: FormData): Promise<void> {
  const ref = refSchema.parse(formData.get("ref"));
  const token = (formData.get("t") as string) || null;
  const paymentId = z.string().min(10).parse(formData.get("paymentId"));
  const outcome = z.enum(["success", "failure"]).parse(formData.get("outcome"));
  const access = await getOrderForViewer(ref, token);
  if (!access || (!access.viewer.owner && !access.viewer.guest)) redirect("/");
  const payment = await db.payment.findFirst({ where: { id: paymentId, orderId: access.order.id, isSimulated: true } });
  if (!payment) redirect(back(ref, token));
  if (payment.status === "FAILED") await setPaymentStatus(payment.id, "PENDING", "Retry simulated payment");
  await setPaymentStatus(payment.id, outcome === "success" ? "PAID" : "FAILED", outcome === "success" ? "Simulated payment approved (sandbox, no money moved)" : "Simulated payment failed (sandbox)");
  revalidatePath(`/orders/${ref}`);
  redirect(`${back(ref, token)}${token ? "&" : "?"}placed=1`);
}

/** Switch a failed/pending simulated payment to Cash on Delivery. */
export async function switchToCodAction(formData: FormData): Promise<void> {
  const ref = refSchema.parse(formData.get("ref"));
  const token = (formData.get("t") as string) || null;
  const access = await getOrderForViewer(ref, token);
  if (!access || (!access.viewer.owner && !access.viewer.guest)) redirect("/");
  const open = access.order.payments.find((p) => p.isSimulated && (p.status === "PENDING" || p.status === "FAILED"));
  if (open) {
    await setPaymentStatus(open.id, "CANCELLED", "Customer switched to cash on delivery");
    await db.payment.create({
      data: { orderId: access.order.id, method: "CASH_ON_DELIVERY", provider: "cod", amountMinor: access.order.totalMinor, idempotencyKey: `${access.order.idempotencyKey}:cod`, events: { create: { status: "PENDING", note: "Switched to cash on delivery" } } },
    }).catch(() => undefined);
  }
  revalidatePath(`/orders/${ref}`);
  redirect(back(ref, token));
}
