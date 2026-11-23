"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { flash, fd, staffAction } from "@/server/admin";
import { audit } from "@/server/audit";
import { allocateSourcedBatch, changeOrderStatus } from "@/server/orders/manage";
import { setPaymentStatus } from "@/server/payments";
import { slotLabel } from "@/server/delivery";
import { cuid } from "@/lib/validation";

const STATUSES = ["PLACED", "CONFIRMED", "PROCUREMENT", "QUALITY_CHECK", "PROCESSING", "PACKAGING", "READY_FOR_DISPATCH", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"] as const;

export async function adminChangeStatus(form: FormData) {
  await staffAction(async (user) => {
    const { orderId, status, note } = z.object({ orderId: cuid, status: z.enum(STATUSES), note: z.string().trim().max(500).optional() }).parse(fd(form));
    const back = `/admin/orders/${orderId}`;
    const r = await changeOrderStatus(orderId, status, user.id, note || undefined);
    if (!r.ok) flash(back, "error", r.error === "unallocated" ? "Allocate a batch to every item before dispatch." : "That status change is not allowed from the current status.");
    await audit(user.id, `order.status.${status}`, "Order", orderId, { note: note ?? null });
    revalidatePath(back);
    flash(back, "ok", `Status changed to ${status.replaceAll("_", " ").toLowerCase()}.`);
  });
}

export async function adminSaveDelivery(form: FormData) {
  await staffAction(async (user) => {
    const v = z.object({ orderId: cuid, riderName: z.string().trim().max(80).optional(), riderPhone: z.string().trim().max(20).optional(), notes: z.string().trim().max(500).optional(), staffNote: z.string().trim().max(1000).optional(), slotId: z.string().optional() }).parse(fd(form));
    const back = `/admin/orders/${v.orderId}`;
    const order = await db.order.findUniqueOrThrow({ where: { id: v.orderId } });
    if (v.slotId && v.slotId !== order.slotId) {
      const moved = await db.$transaction(async (tx) => {
        const slot = await tx.deliverySlot.findUnique({ where: { id: v.slotId! } });
        if (!slot || slot.zoneId !== order.zoneId) return false;
        const ok = await tx.$executeRaw`UPDATE "DeliverySlot" SET "booked" = "booked" + 1 WHERE "id" = ${slot.id} AND "booked" < "capacity"`;
        if (ok !== 1) return false;
        await tx.$executeRaw`UPDATE "DeliverySlot" SET "booked" = GREATEST(0, "booked" - 1) WHERE "id" = ${order.slotId}`;
        const label = slotLabel(slot);
        await tx.order.update({ where: { id: order.id }, data: { slotId: slot.id, deliveryDate: slot.date, slotLabel: label } });
        return true;
      });
      if (!moved) flash(back, "error", "That slot is full or belongs to another zone.");
    }
    await db.order.update({ where: { id: v.orderId }, data: { staffNote: v.staffNote || null } });
    await db.deliveryAssignment.upsert({
      where: { orderId: v.orderId },
      create: { orderId: v.orderId, riderName: v.riderName || null, riderPhone: v.riderPhone || null, notes: v.notes || null, status: v.riderName ? "ASSIGNED" : "UNASSIGNED", staffId: user.id },
      update: { riderName: v.riderName || null, riderPhone: v.riderPhone || null, notes: v.notes || null, staffId: user.id, status: v.riderName ? "ASSIGNED" : "UNASSIGNED" },
    });
    await audit(user.id, "order.delivery", "Order", v.orderId, { rider: v.riderName ?? null, slotId: v.slotId ?? null });
    revalidatePath(back);
    flash(back, "ok", "Delivery details saved.");
  });
}

export async function adminAllocateBatch(form: FormData) {
  await staffAction(async (user) => {
    const v = z.object({ orderId: cuid, orderItemId: cuid, batchId: cuid }).parse(fd(form));
    const back = `/admin/orders/${v.orderId}`;
    const r = await allocateSourcedBatch(v.orderItemId, v.batchId);
    if (!r.ok) flash(back, "error", "Batch does not match this product.");
    await audit(user.id, "order.allocate_batch", "OrderItem", v.orderItemId, { batchId: v.batchId });
    revalidatePath(back);
    flash(back, "ok", "Batch allocated.");
  });
}

export async function adminPaymentStatus(form: FormData) {
  await staffAction(async (user) => {
    const v = z.object({ orderId: cuid, paymentId: cuid, status: z.enum(["PAID", "REFUND_PENDING", "REFUNDED", "FAILED", "CANCELLED"]), note: z.string().trim().max(300).optional() }).parse(fd(form));
    const back = `/admin/orders/${v.orderId}`;
    const p = await db.payment.findFirst({ where: { id: v.paymentId, orderId: v.orderId } });
    if (!p) flash(back, "error", "Payment not found.");
    const ok = await setPaymentStatus(v.paymentId, v.status, v.note || `Set by staff`);
    if (!ok) flash(back, "error", `Cannot move payment from ${p!.status} to ${v.status}.`);
    await audit(user.id, `payment.${v.status}`, "Payment", v.paymentId, { orderId: v.orderId });
    revalidatePath(back);
    flash(back, "ok", "Payment updated.");
  });
}
