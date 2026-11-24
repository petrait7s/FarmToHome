"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { checkbox, fd, flash, optDate, optStr, reqStr, staffAction, zErr } from "@/server/admin";
import { audit } from "@/server/audit";
import { destroyAllSessions } from "@/server/auth/session";
import { normalizeCode } from "@/server/promotions";
import { cuid } from "@/lib/validation";

// ───────── Delivery zones & slots ─────────
const zoneSchema = z.object({
  name: reqStr(120), division: reqStr(40), district: reqStr(40),
  areas: z.string().transform((s) => s.split(/[,\n]/).map((a) => a.trim()).filter(Boolean)).refine((a) => a.length > 0, "add at least one area"),
  fee: z.coerce.number().min(0).max(100000), freeThreshold: z.string().optional(), active: checkbox,
});

export async function saveZone(form: FormData) {
  await staffAction(async (user) => {
    const raw = fd(form);
    const v = zoneSchema.safeParse(raw);
    if (!v.success) flash("/admin/delivery", "error", zErr(v.error));
    const data = { name: v.data.name, division: v.data.division, district: v.data.district, areas: v.data.areas, active: v.data.active, feeMinor: Math.round(v.data.fee * 100), freeThresholdMinor: v.data.freeThreshold ? Math.round(Number(v.data.freeThreshold) * 100) : null };
    const id = raw.id ? cuid.parse(raw.id) : null;
    const row = id ? await db.deliveryZone.update({ where: { id }, data }) : await db.deliveryZone.create({ data });
    await audit(user.id, id ? "update" : "create", "DeliveryZone", row.id, { name: row.name, feeMinor: row.feeMinor });
    flash("/admin/delivery", "ok", `Zone “${row.name}” saved.`);
  });
}

export async function generateSlots(form: FormData) {
  await staffAction(async (user) => {
    const v = z.object({
      zoneId: z.string(), from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), days: z.coerce.number().int().min(1).max(60),
      times: z.string().transform((s) => s.split(/[,\n]/).map((x) => x.trim()).filter(Boolean)),
      capacity: z.coerce.number().int().min(1).max(500), skipFridays: checkbox,
    }).safeParse(fd(form));
    if (!v.success) flash("/admin/delivery", "error", zErr(v.error));
    const ranges = v.data.times.map((t) => t.split("-").map((x) => x.trim()));
    if (ranges.some((r) => r.length !== 2 || !r.every((x) => /^\d{2}:\d{2}$/.test(x)))) flash("/admin/delivery", "error", "Times must look like 08:00-10:00, 10:00-12:00");
    const zones = v.data.zoneId === "all" ? await db.deliveryZone.findMany({ where: { active: true } }) : await db.deliveryZone.findMany({ where: { id: v.data.zoneId } });
    let created = 0;
    for (const zone of zones) {
      for (let i = 0; i < v.data.days; i++) {
        const date = new Date(new Date(`${v.data.from}T00:00:00.000Z`).getTime() + i * 864e5);
        if (v.data.skipFridays && date.getUTCDay() === 5) continue;
        for (const [startTime, endTime] of ranges) {
          const r = await db.deliverySlot.upsert({ where: { zoneId_date_startTime: { zoneId: zone.id, date, startTime } }, create: { zoneId: zone.id, date, startTime, endTime, capacity: v.data.capacity }, update: {} });
          if (r.booked === 0 && r.capacity === v.data.capacity) created++;
        }
      }
    }
    await audit(user.id, "generate", "DeliverySlot", null, { zones: zones.length, days: v.data.days, created });
    flash("/admin/delivery", "ok", `Slots generated (${created} new or unchanged). Existing slots keep their bookings.`);
  });
}

export async function updateSlot(form: FormData) {
  await staffAction(async (user) => {
    const v = z.object({ id: cuid, capacity: z.coerce.number().int().min(0).max(500), active: checkbox }).parse(fd(form));
    const slot = await db.deliverySlot.findUniqueOrThrow({ where: { id: v.id } });
    if (v.capacity < slot.booked) flash("/admin/delivery", "error", `Capacity cannot be below the ${slot.booked} orders already booked.`);
    await db.deliverySlot.update({ where: { id: v.id }, data: { capacity: v.capacity, active: v.active } });
    await audit(user.id, "update", "DeliverySlot", v.id, v);
    flash("/admin/delivery", "ok", "Slot updated.");
  });
}

// ───────── Customers ─────────
export async function setCustomerStatus(form: FormData) {
  await staffAction(async (user) => {
    const v = z.object({ id: cuid, status: z.enum(["ACTIVE", "SUSPENDED"]) }).parse(fd(form));
    const target = await db.user.findUniqueOrThrow({ where: { id: v.id } });
    if (target.role !== "CUSTOMER") flash(`/admin/customers/${v.id}`, "error", "Manage staff accounts from Team.");
    await db.user.update({ where: { id: v.id }, data: { status: v.status } });
    if (v.status === "SUSPENDED") await destroyAllSessions(v.id);
    await audit(user.id, `customer.${v.status.toLowerCase()}`, "User", v.id);
    flash(`/admin/customers/${v.id}`, "ok", `Account ${v.status.toLowerCase()}.`);
  });
}

// ───────── Promotions ─────────
const promoSchema = z.object({
  code: z.string().trim().min(3).max(30).transform(normalizeCode).refine((c) => /^[A-Z0-9]+$/.test(c), "letters and numbers only"),
  description: optStr, type: z.enum(["PERCENT", "FIXED"]), value: z.coerce.number().positive().max(1_000_000),
  minSubtotal: z.string().optional(), maxDiscount: z.string().optional(), startsAt: optDate, endsAt: optDate,
  usageLimit: z.string().optional(), perCustomerLimit: z.string().optional(), active: checkbox,
});
const intOrNull = (s?: string) => (s ? Math.max(0, Math.floor(Number(s))) : null);
const minorOrNull = (s?: string) => (s ? Math.round(Number(s) * 100) : null);

export async function savePromotion(form: FormData) {
  await staffAction(async (user) => {
    const raw = fd(form);
    const id = raw.id ? cuid.parse(raw.id) : null;
    const back = id ? `/admin/promotions/${id}` : "/admin/promotions/new";
    const v = promoSchema.safeParse(raw);
    if (!v.success) flash(back, "error", zErr(v.error));
    if (v.data.type === "PERCENT" && v.data.value > 100) flash(back, "error", "Percent discounts cannot exceed 100.");
    const productIds = form.getAll("productIds").map(String).filter(Boolean);
    const categoryIds = form.getAll("categoryIds").map(String).filter(Boolean);
    const data = {
      code: v.data.code, description: v.data.description, type: v.data.type,
      value: v.data.type === "PERCENT" ? Math.round(v.data.value) : Math.round(v.data.value * 100),
      minSubtotalMinor: minorOrNull(v.data.minSubtotal), maxDiscountMinor: minorOrNull(v.data.maxDiscount),
      startsAt: v.data.startsAt, endsAt: v.data.endsAt, usageLimit: intOrNull(v.data.usageLimit), perCustomerLimit: intOrNull(v.data.perCustomerLimit), active: v.data.active,
    };
    const dup = await db.promotion.findFirst({ where: { code: data.code, id: id ? { not: id } : undefined } });
    if (dup) flash(back, "error", "Code already exists.");
    const row = id
      ? await db.promotion.update({ where: { id }, data: { ...data, products: { set: productIds.map((x) => ({ id: x })) }, categories: { set: categoryIds.map((x) => ({ id: x })) } } })
      : await db.promotion.create({ data: { ...data, products: { connect: productIds.map((x) => ({ id: x })) }, categories: { connect: categoryIds.map((x) => ({ id: x })) } } });
    await audit(user.id, id ? "update" : "create", "Promotion", row.id, { code: row.code });
    flash(`/admin/promotions/${row.id}`, "ok", "Promotion saved.");
  });
}

// ───────── Concierge ─────────
export async function staffConciergeReply(form: FormData) {
  await staffAction(async (user) => {
    const v = z.object({ id: cuid, body: z.string().trim().max(2000).optional(), status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]) }).parse(fd(form));
    const req = await db.conciergeRequest.findUniqueOrThrow({ where: { id: v.id } });
    await db.$transaction(async (tx) => {
      if (v.body) await tx.conciergeMessage.create({ data: { requestId: v.id, authorId: user.id, fromStaff: true, body: v.body } });
      await tx.conciergeRequest.update({ where: { id: v.id }, data: { status: v.status, assigneeId: req.assigneeId ?? user.id } });
      if (req.userId && v.body) await tx.notification.create({ data: { userId: req.userId, type: "concierge", title: "Your concierge replied", body: v.body.slice(0, 140), href: "/account/concierge" } });
    });
    await audit(user.id, "concierge.reply", "ConciergeRequest", v.id, { status: v.status });
    revalidatePath(`/admin/concierge/${v.id}`);
    flash(`/admin/concierge/${v.id}`, "ok", "Saved.");
  });
}
