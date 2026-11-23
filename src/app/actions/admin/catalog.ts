"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { checkbox, fd, flash, optStr, reqStr, slug, staffAction, zErr } from "@/server/admin";
import { audit } from "@/server/audit";
import { storeUpload, UploadError } from "@/server/storage";
import { ART_TYPES } from "@/components/ui/productArt";
import { cuid } from "@/lib/validation";

// ───────── Categories ─────────
const categorySchema = z.object({
  slug, name: reqStr(80), nameBn: optStr, description: optStr, descriptionBn: optStr, story: optStr, storyBn: optStr,
  position: z.coerce.number().int().min(0).max(999), active: checkbox,
});

export async function saveCategory(form: FormData) {
  await staffAction(async (user) => {
    const raw = fd(form);
    const parsed = categorySchema.safeParse(raw);
    if (!parsed.success) flash("/admin/categories", "error", zErr(parsed.error));
    const id = raw.id ? cuid.parse(raw.id) : null;
    const dup = await db.category.findFirst({ where: { slug: parsed.data.slug, id: id ? { not: id } : undefined } });
    if (dup) flash("/admin/categories", "error", "Slug already in use.");
    const row = id ? await db.category.update({ where: { id }, data: parsed.data }) : await db.category.create({ data: parsed.data });
    await audit(user.id, id ? "update" : "create", "Category", row.id, { name: row.name });
    revalidatePath("/", "layout");
    flash("/admin/categories", "ok", `Category “${row.name}” saved.`);
  });
}

// ───────── Producers ─────────
const producerSchema = z.object({
  slug, name: reqStr(80), nameBn: optStr, craft: optStr, village: optStr, originId: cuid, story: optStr, storyBn: optStr, quote: optStr,
  verificationStatus: z.enum(["UNVERIFIED", "PENDING", "VERIFIED"]), contactPhone: optStr, contactNotes: optStr, active: checkbox, isDemo: checkbox,
});

export async function saveProducer(form: FormData) {
  await staffAction(async (user) => {
    const raw = fd(form);
    const id = raw.id ? cuid.parse(raw.id) : null;
    const back = id ? `/admin/producers/${id}` : "/admin/producers/new";
    const parsed = producerSchema.safeParse(raw);
    if (!parsed.success) flash(back, "error", zErr(parsed.error));
    const dup = await db.producer.findFirst({ where: { slug: parsed.data.slug, id: id ? { not: id } : undefined } });
    if (dup) flash(back, "error", "Slug already in use.");
    let photoUrl: string | undefined;
    const photo = form.get("photo");
    if (photo instanceof File && photo.size > 0) {
      try { photoUrl = await storeUpload(photo, "image"); } catch (e) { flash(back, "error", e instanceof UploadError ? e.message : "Upload failed"); }
    }
    const row = id
      ? await db.producer.update({ where: { id }, data: { ...parsed.data, ...(photoUrl ? { photoUrl } : {}) } })
      : await db.producer.create({ data: { ...parsed.data, photoUrl } });
    await audit(user.id, id ? "update" : "create", "Producer", row.id, { name: row.name, verification: row.verificationStatus });
    revalidatePath("/producers");
    flash(`/admin/producers/${row.id}`, "ok", "Producer saved.");
  });
}

export async function saveOrigin(form: FormData) {
  await staffAction(async (user) => {
    const v = z.object({ slug, district: reqStr(60), division: reqStr(60), region: optStr, description: optStr }).safeParse(fd(form));
    if (!v.success) flash("/admin/producers", "error", zErr(v.error));
    const row = await db.origin.upsert({ where: { slug: v.data.slug }, create: v.data, update: v.data });
    await audit(user.id, "upsert", "Origin", row.id, { district: row.district });
    flash("/admin/producers", "ok", `Origin ${row.district} saved.`);
  });
}

// ───────── Products ─────────
const productSchema = z.object({
  slug, name: reqStr(120), nameBn: optStr, summary: reqStr(200), summaryBn: optStr, description: reqStr(5000), descriptionBn: optStr, story: optStr, storyBn: optStr,
  categoryId: cuid, producerId: z.string().optional().transform((v) => v || null), originId: z.string().optional().transform((v) => v || null),
  originClass: optStr, qualityGrade: optStr, processingInfo: optStr, packagingInfo: optStr, storageInfo: optStr, handlingInfo: optStr,
  artKey: z.string().optional().transform((v) => (v && ART_TYPES.includes(v.split(":")[0] as (typeof ART_TYPES)[number]) ? v : null)),
  marketFit: z.enum(["WEEKLY", "MONTHLY", "BOTH"]), status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  isEssential: checkbox, isSeasonal: checkbox, isNew: checkbox, isFeatured: checkbox, isPerishable: checkbox, isDemo: checkbox,
  householdUsePerPersonWeek: z.string().optional().transform((v) => (v ? Number(v) : null)).refine((v) => v === null || (v >= 0 && v < 100), "invalid"),
  householdUseUnit: optStr,
});

export async function saveProduct(form: FormData) {
  await staffAction(async (user) => {
    const raw = fd(form);
    const id = raw.id ? cuid.parse(raw.id) : null;
    const back = id ? `/admin/products/${id}` : "/admin/products/new";
    const parsed = productSchema.safeParse(raw);
    if (!parsed.success) flash(back, "error", zErr(parsed.error));
    const dup = await db.product.findFirst({ where: { slug: parsed.data.slug, id: id ? { not: id } : undefined } });
    if (dup) flash(back, "error", "Slug already in use.");
    const row = id ? await db.product.update({ where: { id }, data: parsed.data }) : await db.product.create({ data: parsed.data });
    await audit(user.id, id ? "update" : "create", "Product", row.id, { name: row.name, status: row.status });
    revalidatePath("/", "layout");
    flash(`/admin/products/${row.id}`, "ok", id ? "Product saved." : "Product created. Add at least one variant to make it purchasable.");
  });
}

export async function deleteProduct(form: FormData) {
  await staffAction(async (user) => {
    const id = cuid.parse(form.get("id"));
    const used = await db.orderItem.count({ where: { variant: { productId: id } } }) + await db.batch.count({ where: { productId: id } });
    if (used) {
      await db.product.update({ where: { id }, data: { status: "ARCHIVED" } });
      await audit(user.id, "archive", "Product", id);
      revalidatePath("/", "layout");
      flash(`/admin/products/${id}`, "ok", "Product has orders or batches, so it was archived instead of deleted (history is preserved).");
    }
    await db.product.delete({ where: { id } });
    await audit(user.id, "delete", "Product", id);
    revalidatePath("/", "layout");
    flash("/admin/products", "ok", "Product deleted.");
  }, { admin: true });
}

const variantSchema = z.object({
  productId: cuid, sku: z.string().trim().toUpperCase().min(3).max(40).regex(/^[A-Z0-9-]+$/), label: reqStr(40), labelBn: optStr,
  netQuantity: z.coerce.number().positive().max(100000), unit: z.enum(["g", "kg", "ml", "L", "pc"]),
  price: z.coerce.number().positive().max(1_000_000), compareAt: z.string().optional(),
  position: z.coerce.number().int().min(0).max(99), fulfillmentMode: z.enum(["STOCK", "SOURCED_TO_ORDER"]),
  lowStockThreshold: z.coerce.number().int().min(0).max(10000), active: checkbox,
});

export async function saveVariant(form: FormData) {
  await staffAction(async (user) => {
    const raw = fd(form);
    const back = `/admin/products/${raw.productId}`;
    const parsed = variantSchema.safeParse(raw);
    if (!parsed.success) flash(back, "error", zErr(parsed.error));
    const { price, compareAt, ...v } = parsed.data;
    const data = { ...v, priceMinor: Math.round(price * 100), compareAtMinor: compareAt ? Math.round(Number(compareAt) * 100) : null };
    const id = raw.id ? cuid.parse(raw.id) : null;
    const dup = await db.productVariant.findFirst({ where: { sku: data.sku, id: id ? { not: id } : undefined } });
    if (dup) flash(back, "error", "SKU already in use.");
    const before = id ? await db.productVariant.findUnique({ where: { id } }) : null;
    const row = id ? await db.productVariant.update({ where: { id }, data }) : await db.productVariant.create({ data });
    await audit(user.id, id ? "update" : "create", "ProductVariant", row.id, { sku: row.sku, priceMinor: row.priceMinor, previousPriceMinor: before?.priceMinor ?? null });
    revalidatePath("/", "layout");
    flash(back, "ok", `Variant ${row.label} saved.`);
  });
}

export async function addProductImage(form: FormData) {
  await staffAction(async (user) => {
    const productId = cuid.parse(form.get("productId"));
    const back = `/admin/products/${productId}`;
    const alt = z.string().trim().min(2).max(160).safeParse(form.get("alt"));
    if (!alt.success) flash(back, "error", "Describe the image (alt text) for accessibility.");
    const file = form.get("file");
    let url: string;
    try {
      url = await storeUpload(file as File, "image");
    } catch (e) {
      flash(back, "error", e instanceof UploadError ? e.message : "Upload failed");
    }
    const count = await db.productImage.count({ where: { productId } });
    const img = await db.productImage.create({ data: { productId, url: url!, alt: alt.data, position: count } });
    await audit(user.id, "create", "ProductImage", img.id, { productId });
    revalidatePath("/", "layout");
    flash(back, "ok", "Image uploaded.");
  });
}

export async function removeProductImage(form: FormData) {
  await staffAction(async (user) => {
    const id = cuid.parse(form.get("id"));
    const img = await db.productImage.delete({ where: { id } });
    await audit(user.id, "delete", "ProductImage", id, { productId: img.productId });
    revalidatePath("/", "layout");
    flash(`/admin/products/${img.productId}`, "ok", "Image removed.");
  });
}
