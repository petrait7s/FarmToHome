import "server-only";
import { db } from "@/lib/db";
import type { OrderStatus } from "@/generated/prisma/client";
import { canTransition, customerCanCancel, fulfilsStock } from "./workflow";
import { fulfillStock, releaseStock } from "../inventory/stock";
import { setPaymentStatus } from "../payments";
import { notify } from "./place";

const STATUS_TEXT: Record<OrderStatus, string> = {
  PLACED: "has been placed",
  CONFIRMED: "is confirmed by your concierge",
  PROCUREMENT: "is being sourced",
  QUALITY_CHECK: "is in quality inspection",
  PROCESSING: "is being processed",
  PACKAGING: "is being packed",
  READY_FOR_DISPATCH: "is ready for dispatch",
  OUT_FOR_DELIVERY: "is out for delivery",
  DELIVERED: "has been delivered",
  CANCELLED: "has been cancelled",
};

export type StatusChange = { ok: true } | { ok: false; error: "not_found" | "invalid_transition" | "unallocated" };

/**
 * Move an order through the fulfilment workflow. Every change records history and notifies the customer.
 * Cancelling releases stock, slot capacity and promotion usage; dispatch converts reservations into deductions.
 */
export async function changeOrderStatus(orderId: string, to: OrderStatus, actorId: string | null, note?: string, opts: { asCustomer?: boolean } = {}): Promise<StatusChange> {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { allocations: true } }, payments: true },
    });
    if (!order) return { ok: false, error: "not_found" } as const;
    const allowed = opts.asCustomer ? to === "CANCELLED" && customerCanCancel(order.status) : canTransition(order.status, to, order.needsSourcing);
    if (!allowed) return { ok: false, error: "invalid_transition" } as const;

    if (fulfilsStock(to) && order.status !== "OUT_FOR_DELIVERY") {
      // Sourced-to-order items must have batches allocated before they can leave the warehouse.
      const unallocated = order.items.some((i) => i.allocations.reduce((s, a) => s + a.quantity, 0) < i.quantity);
      if (unallocated) return { ok: false, error: "unallocated" } as const;
      for (const item of order.items) {
        for (const a of item.allocations) {
          if (a.fulfilled) continue;
          if (item.fulfillmentMode === "STOCK") await fulfillStock(tx, item.variantId, a.batchId, a.quantity, order.id, actorId);
          await tx.orderItemAllocation.update({ where: { id: a.id }, data: { fulfilled: true } });
        }
      }
    }

    if (to === "CANCELLED") {
      for (const item of order.items) {
        for (const a of item.allocations) {
          if (!a.fulfilled && item.fulfillmentMode === "STOCK") await releaseStock(tx, item.variantId, a.batchId, a.quantity, order.id, actorId);
        }
      }
      await tx.$executeRaw`UPDATE "DeliverySlot" SET "booked" = GREATEST(0, "booked" - 1) WHERE "id" = ${order.slotId}`;
      if (order.promoCode) {
        await tx.$executeRaw`UPDATE "Promotion" SET "usedCount" = GREATEST(0, "usedCount" - 1) WHERE "code" = ${order.promoCode}`;
        await tx.promotionRedemption.deleteMany({ where: { orderId: order.id } });
      }
      for (const p of order.payments) {
        if (p.status === "PAID") await setPaymentStatus(p.id, "REFUND_PENDING", "Order cancelled — refund required", tx);
        else if (["PENDING", "AUTHORIZED", "FAILED"].includes(p.status)) await setPaymentStatus(p.id, "CANCELLED", "Order cancelled", tx);
      }
    }

    if (to === "DELIVERED") {
      for (const p of order.payments) {
        if (p.method === "CASH_ON_DELIVERY" && p.status === "PENDING") await setPaymentStatus(p.id, "PAID", "Cash collected on delivery", tx);
      }
      await tx.deliveryAssignment.updateMany({ where: { orderId: order.id }, data: { status: "DELIVERED" } });
    }
    if (to === "OUT_FOR_DELIVERY") await tx.deliveryAssignment.updateMany({ where: { orderId: order.id }, data: { status: "OUT_FOR_DELIVERY" } });

    await tx.order.update({ where: { id: order.id }, data: { status: to, cancelledReason: to === "CANCELLED" ? note ?? null : undefined } });
    await tx.orderStatusHistory.create({ data: { orderId: order.id, status: to, note: note ?? null, actorId } });
    await notify(tx, order.userId, `Order ${order.reference}`, `Your order ${STATUS_TEXT[to]}.`, `/orders/${order.reference}`);
    return { ok: true } as const;
  }, { timeout: 20000 });
}

/** Staff assign a collected batch to a sourced-to-order item (keeps Product → Batch → Order traceability). */
export async function allocateSourcedBatch(orderItemId: string, batchId: string): Promise<{ ok: boolean; error?: string }> {
  const item = await db.orderItem.findUnique({ where: { id: orderItemId }, include: { variant: true, allocations: true } });
  const batch = await db.batch.findUnique({ where: { id: batchId } });
  if (!item || !batch || batch.productId !== item.variant.productId) return { ok: false, error: "mismatch" };
  if (item.fulfillmentMode !== "SOURCED_TO_ORDER") return { ok: false, error: "not_sourced" };
  await db.$transaction([
    db.orderItemAllocation.deleteMany({ where: { orderItemId } }),
    db.orderItemAllocation.create({ data: { orderItemId, batchId, quantity: item.quantity } }),
  ]);
  return { ok: true };
}
