"use server";

import { z } from "zod";
import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { checkbox, fd, flash, optDate, optStr, reqStr, staffAction, zErr } from "@/server/admin";
import { audit } from "@/server/audit";
import { adjustStock, StockError } from "@/server/inventory/stock";
import { storeUpload, UploadError } from "@/server/storage";
import { cuid } from "@/lib/validation";

const UNITS = ["kg", "g", "L", "ml", "pc"] as const;

export async function createProcurement(form: FormData) {
  await staffAction(async (user) => {
    const raw = fd(form);
    const head = z.object({ producerId: cuid, notes: optStr, isDemo: checkbox }).safeParse(raw);
    if (!head.success) flash("/admin/procurement/new", "error", zErr(head.error));
    const items: { productId: string; quantity: number; unit: string; unitCostMinor: number; marketReferenceMinor: number | null }[] = [];
    for (let i = 0; i < 6; i++) {
      if (!raw[`productId${i}`]) continue;
      const it = z.object({
        productId: cuid, quantity: z.coerce.number().positive().max(1_000_000), unit: z.enum(UNITS),
        unitCost: z.coerce.number().positive().max(1_000_000), marketRef: z.string().optional(),
      }).safeParse({ productId: raw[`productId${i}`], quantity: raw[`quantity${i}`], unit: raw[`unit${i}`], unitCost: raw[`unitCost${i}`], marketRef: raw[`marketRef${i}`] });
      if (!it.success) flash("/admin/procurement/new", "error", `Line ${i + 1}: ${zErr(it.error)}`);
      items.push({ productId: it.data.productId, quantity: it.data.quantity, unit: it.data.unit, unitCostMinor: Math.round(it.data.unitCost * 100), marketReferenceMinor: it.data.marketRef ? Math.round(Number(it.data.marketRef) * 100) : null });
    }
    if (!items.length) flash("/admin/procurement/new", "error", "Add at least one item.");
    const count = await db.procurement.count();
    const proc = await db.procurement.create({
      data: { reference: `PRC-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`, producerId: head.data.producerId, notes: head.data.notes, isDemo: head.data.isDemo, items: { create: items } },
    });
    await audit(user.id, "create", "Procurement", proc.id, { reference: proc.reference, items: items.length });
    flash(`/admin/procurement/${proc.id}`, "ok", "Procurement planned. Mark it received when goods arrive to create batches.");
  });
}

function batchNumber(categorySlug: string, date: Date) {
  const y = String(date.getFullYear()).slice(2), m = String(date.getMonth() + 1).padStart(2, "0"), d = String(date.getDate()).padStart(2, "0");
  return `FTH-${categorySlug.slice(0, 3).toUpperCase()}-${y}${m}${d}-${randomInt(1000, 9999)}`;
}

export async function receiveProcurement(form: FormData) {
  await staffAction(async (user) => {
    const v = z.object({ id: cuid, receivedAt: optDate }).parse(fd(form));
    const back = `/admin/procurement/${v.id}`;
    const proc = await db.procurement.findUniqueOrThrow({ where: { id: v.id }, include: { producer: true, items: { include: { product: { include: { category: true } } } } } });
    if (proc.status !== "PLANNED") flash(back, "error", "Only planned procurements can be received.");
    const when = v.receivedAt ?? new Date();
    await db.$transaction(async (tx) => {
      await tx.procurement.update({ where: { id: proc.id }, data: { status: "RECEIVED", receivedAt: when } });
      for (const it of proc.items) {
        let number = batchNumber(it.product.category.slug, when);
        while (await tx.batch.findUnique({ where: { batchNumber: number } })) number = batchNumber(it.product.category.slug, when);
        await tx.batch.create({
          data: {
            batchNumber: number, productId: it.productId, producerId: proc.producerId, originId: proc.producer.originId, procurementItemId: it.id,
            collectedAt: when, receivedQuantity: it.quantity, quantityUnit: it.unit, status: "RECEIVED", isDemo: proc.isDemo,
            sourceNote: `Received from ${proc.producer.name} under ${proc.reference}.`,
          },
        });
      }
    });
    await audit(user.id, "receive", "Procurement", proc.id, { reference: proc.reference });
    revalidatePath("/admin/batches");
    flash(back, "ok", "Received. Batches created — inspect them before stocking.");
  });
}

export async function cancelProcurement(form: FormData) {
  await staffAction(async (user) => {
    const id = cuid.parse(form.get("id"));
    const proc = await db.procurement.findUniqueOrThrow({ where: { id } });
    if (proc.status !== "PLANNED") flash(`/admin/procurement/${id}`, "error", "Only planned procurements can be cancelled.");
    await db.procurement.update({ where: { id }, data: { status: "CANCELLED" } });
    await audit(user.id, "cancel", "Procurement", id);
    flash(`/admin/procurement/${id}`, "ok", "Procurement cancelled.");
  });
}

const batchSchema = z.object({
  id: cuid, status: z.enum(["RECEIVED", "INSPECTING", "APPROVED", "REJECTED", "PROCESSING", "PACKED", "ACTIVE", "DEPLETED", "RECALLED"]),
  collectedAt: optDate, processedAt: optDate, packedAt: optDate, bestBefore: optDate,
  rejectedQuantity: z.coerce.number().min(0), processingLoss: z.coerce.number().min(0), packagingLoss: z.coerce.number().min(0),
  qualityGrade: optStr, processingNotes: optStr, packagingNotes: optStr, storageNotes: optStr, sourceNote: optStr,
});

export async function updateBatch(form: FormData) {
  await staffAction(async (user) => {
    const raw = fd(form);
    const back = `/admin/batches/${raw.id}`;
    const v = batchSchema.safeParse(raw);
    if (!v.success) flash(back, "error", zErr(v.error));
    const { id, ...data } = v.data;
    const before = await db.batch.findUniqueOrThrow({ where: { id } });
    await db.batch.update({ where: { id }, data });
    await audit(user.id, "update", "Batch", id, { from: before.status, to: data.status });
    revalidatePath(`/trace/${before.batchNumber}`);
    flash(back, "ok", "Batch updated.");
  });
}

export async function addInspection(form: FormData) {
  await staffAction(async (user) => {
    const raw = fd(form);
    const back = `/admin/batches/${raw.batchId}`;
    const v = z.object({
      batchId: cuid, result: z.enum(["PASSED", "FAILED", "CONDITIONAL"]), grade: optStr, notes: optStr,
      visual: optStr, odour: optStr, moisture: optStr, foreignMatter: optStr,
    }).safeParse(raw);
    if (!v.success) flash(back, "error", zErr(v.error));
    const checks = { visual: v.data.visual, odour: v.data.odour, moisture: v.data.moisture, foreignMatter: v.data.foreignMatter };
    await db.$transaction(async (tx) => {
      await tx.qualityInspection.create({ data: { batchId: v.data.batchId, inspectorId: user.id, result: v.data.result, grade: v.data.grade, notes: v.data.notes, checks } });
      const batch = await tx.batch.findUniqueOrThrow({ where: { id: v.data.batchId } });
      const nextStatus = v.data.result === "FAILED" ? "REJECTED" : ["RECEIVED", "INSPECTING"].includes(batch.status) ? "APPROVED" : batch.status;
      await tx.batch.update({ where: { id: batch.id }, data: { status: nextStatus, qualityGrade: v.data.grade ?? batch.qualityGrade } });
    });
    await audit(user.id, `inspection.${v.data.result}`, "Batch", v.data.batchId, { grade: v.data.grade ?? null });
    flash(back, "ok", "Inspection recorded.");
  });
}

export async function addReport(form: FormData) {
  await staffAction(async (user) => {
    const raw = fd(form);
    const back = `/admin/batches/${raw.batchId}`;
    const v = z.object({ batchId: cuid, title: reqStr(160), laboratory: optStr, issuedAt: optDate, summary: optStr, isVerified: checkbox, isDemo: checkbox }).safeParse(raw);
    if (!v.success) flash(back, "error", zErr(v.error));
    if (v.data.isVerified && user.role !== "ADMIN") flash(back, "error", "Only an administrator can mark a report as verified.");
    let fileUrl: string | null = null;
    const file = form.get("file");
    if (file instanceof File && file.size > 0) {
      try { fileUrl = await storeUpload(file, "pdf"); } catch (e) { flash(back, "error", e instanceof UploadError ? e.message : "Upload failed"); }
    }
    if (v.data.isVerified && !fileUrl) flash(back, "error", "A verified report must have the laboratory PDF attached.");
    const r = await db.qualityReport.create({ data: { ...v.data, fileUrl } });
    await audit(user.id, "create", "QualityReport", r.id, { batchId: v.data.batchId, verified: v.data.isVerified });
    flash(back, "ok", "Report added.");
  });
}

const MOVEMENT_TYPES = ["QC_APPROVED", "PROCUREMENT_RECEIVED", "QC_REJECTED", "PROCESSING_LOSS", "PACKAGING_LOSS", "CUSTOMER_RETURN", "DAMAGED", "EXPIRED", "MANUAL_ADJUSTMENT"] as const;

export async function stockMovement(form: FormData) {
  await staffAction(async (user) => {
    const raw = fd(form);
    const back = raw.back?.startsWith("/admin") ? raw.back : "/admin/inventory";
    const v = z.object({ variantId: cuid, batchId: cuid, type: z.enum(MOVEMENT_TYPES), quantity: z.coerce.number().int().refine((n) => n !== 0, "quantity cannot be zero"), reason: reqStr(300) }).safeParse(raw);
    if (!v.success) flash(back, "error", zErr(v.error));
    const [variant, batch] = await Promise.all([db.productVariant.findUnique({ where: { id: v.data.variantId } }), db.batch.findUnique({ where: { id: v.data.batchId } })]);
    if (!variant || !batch || variant.productId !== batch.productId) flash(back, "error", "That batch does not belong to this product.");
    if (["QC_APPROVED", "PROCUREMENT_RECEIVED"].includes(v.data.type) && ["RECEIVED", "INSPECTING", "REJECTED", "RECALLED"].includes(batch!.status)) {
      flash(back, "error", "Stock can only be added from a batch that has passed inspection.");
    }
    try {
      await db.$transaction(async (tx) => {
        await adjustStock(tx, { ...v.data, actorId: user.id });
        if (v.data.type === "QC_APPROVED" && batch!.status !== "ACTIVE") await tx.batch.update({ where: { id: batch!.id }, data: { status: "ACTIVE", packedAt: batch!.packedAt ?? new Date() } });
      });
    } catch (e) {
      if (e instanceof StockError) flash(back, "error", "Adjustment would make on-hand stock lower than units already reserved for orders.");
      throw e;
    }
    await audit(user.id, `stock.${v.data.type}`, "Inventory", v.data.variantId, { batchId: v.data.batchId, quantity: v.data.quantity, reason: v.data.reason });
    revalidatePath("/", "layout");
    flash(back, "ok", "Stock movement recorded.");
  });
}
