"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { checkbox, fd, flash, optDate, optStr, reqStr, slug, staffAction, zErr } from "@/server/admin";
import { audit } from "@/server/audit";
import { hashPassword } from "@/server/auth/password";
import { destroyAllSessions } from "@/server/auth/session";
import { bdPhone, cuid, optionalEmail, password } from "@/lib/validation";

// ───────── Content sections ─────────
export async function saveSection(form: FormData) {
  await staffAction(async (user) => {
    const v = z.object({ key: z.string().trim().min(2).max(60).regex(/^[a-z0-9.\-_]+$/), eyebrow: optStr, eyebrowBn: optStr, title: reqStr(200), titleBn: optStr, body: optStr, bodyBn: optStr, ctaLabel: optStr, ctaLabelBn: optStr, ctaHref: optStr, active: checkbox }).safeParse(fd(form));
    if (!v.success) flash("/admin/content", "error", zErr(v.error));
    if (v.data.ctaHref && !v.data.ctaHref.startsWith("/")) flash("/admin/content", "error", "Links must be internal paths starting with /");
    const row = await db.contentSection.upsert({ where: { key: v.data.key }, create: v.data, update: v.data });
    await audit(user.id, "upsert", "ContentSection", row.id, { key: row.key });
    revalidatePath("/");
    flash("/admin/content", "ok", `Section ${row.key} saved.`);
  });
}

export async function saveFaq(form: FormData) {
  await staffAction(async (user) => {
    const raw = fd(form);
    const v = z.object({ question: reqStr(300), questionBn: optStr, answer: reqStr(3000), answerBn: optStr, position: z.coerce.number().int().min(0), active: checkbox }).safeParse(raw);
    if (!v.success) flash("/admin/content", "error", zErr(v.error));
    const id = raw.id ? cuid.parse(raw.id) : null;
    const row = id ? await db.faqItem.update({ where: { id }, data: v.data }) : await db.faqItem.create({ data: v.data });
    await audit(user.id, id ? "update" : "create", "FaqItem", row.id);
    revalidatePath("/faq");
    flash("/admin/content", "ok", "FAQ saved.");
  });
}

export async function savePage(form: FormData) {
  await staffAction(async (user) => {
    const raw = fd(form);
    const v = z.object({ slug, title: reqStr(160), titleBn: optStr, body: reqStr(20000), bodyBn: optStr, published: checkbox }).safeParse(raw);
    if (!v.success) flash("/admin/content", "error", zErr(v.error));
    const id = raw.id ? cuid.parse(raw.id) : null;
    const row = id ? await db.page.update({ where: { id }, data: v.data }) : await db.page.create({ data: v.data });
    await audit(user.id, id ? "update" : "create", "Page", row.id, { slug: row.slug });
    revalidatePath(`/pages/${row.slug}`);
    flash("/admin/content", "ok", `Page ${row.slug} saved.`);
  });
}

export async function saveCollection(form: FormData) {
  await staffAction(async (user) => {
    const raw = fd(form);
    const v = z.object({ slug, title: reqStr(120), titleBn: optStr, description: optStr, descriptionBn: optStr, startsAt: optDate, endsAt: optDate, featured: checkbox, active: checkbox, position: z.coerce.number().int().min(0) }).safeParse(raw);
    if (!v.success) flash("/admin/content", "error", zErr(v.error));
    const productIds = form.getAll("productIds").map(String).filter(Boolean);
    const id = raw.id ? cuid.parse(raw.id) : null;
    const row = await db.$transaction(async (tx) => {
      const c = id ? await tx.collection.update({ where: { id }, data: v.data }) : await tx.collection.create({ data: v.data });
      await tx.collectionProduct.deleteMany({ where: { collectionId: c.id } });
      if (productIds.length) await tx.collectionProduct.createMany({ data: productIds.map((productId, i) => ({ collectionId: c.id, productId, position: i })) });
      return c;
    });
    await audit(user.id, id ? "update" : "create", "Collection", row.id, { slug: row.slug, products: productIds.length });
    revalidatePath("/");
    flash("/admin/content", "ok", `Collection ${row.title} saved.`);
  });
}

// ───────── Settings (admin only) ─────────
export async function saveSettings(form: FormData) {
  await staffAction(async (user) => {
    const v = z.object({
      siteName: reqStr(60), currency: z.literal("BDT"), defaultLanguage: z.enum(["EN", "BN"]),
      minOrder: z.coerce.number().min(0).max(1_000_000), requireEmail: checkbox,
      orderCutoffHour: z.coerce.number().int().min(0).max(23), bookingWindowDays: z.coerce.number().int().min(1).max(60),
      taxRatePercent: z.coerce.number().min(0).max(50), contactPhone: optStr, contactEmail: optStr, contactAddress: optStr, conciergeHours: optStr,
      o1: optStr, o2: optStr, o3: optStr, demoMode: checkbox,
    }).safeParse(fd(form));
    if (!v.success) flash("/admin/settings", "error", zErr(v.error));
    const { minOrder, o1, o2, o3, ...rest } = v.data;
    await db.siteSettings.upsert({
      where: { id: 1 },
      create: { id: 1, ...rest, minOrderMinor: Math.round(minOrder * 100), originClassDefinitions: { O1: o1 ?? "", O2: o2 ?? "", O3: o3 ?? "" } },
      update: { ...rest, minOrderMinor: Math.round(minOrder * 100), originClassDefinitions: { O1: o1 ?? "", O2: o2 ?? "", O3: o3 ?? "" } },
    });
    await audit(user.id, "update", "SiteSettings", "1", { minOrderMinor: Math.round(minOrder * 100), demoMode: rest.demoMode });
    revalidatePath("/", "layout");
    flash("/admin/settings", "ok", "Settings saved.");
  }, { admin: true });
}

// ───────── Team (admin only) ─────────
export async function createStaff(form: FormData) {
  await staffAction(async (user) => {
    const v = z.object({ name: reqStr(80), phone: bdPhone, email: optionalEmail, role: z.enum(["STAFF", "ADMIN"]), password }).safeParse(fd(form));
    if (!v.success) flash("/admin/team", "error", zErr(v.error));
    const exists = await db.user.findFirst({ where: { OR: [{ phone: v.data.phone }, ...(v.data.email ? [{ email: v.data.email }] : [])] } });
    if (exists) flash("/admin/team", "error", "A user with this phone or email already exists. Change their role instead.");
    const row = await db.user.create({ data: { name: v.data.name, phone: v.data.phone, email: v.data.email ?? null, role: v.data.role, passwordHash: await hashPassword(v.data.password), profile: { create: {} } } });
    await audit(user.id, "create", "User", row.id, { role: row.role });
    flash("/admin/team", "ok", `${row.name} added as ${row.role}.`);
  }, { admin: true });
}

export async function setRole(form: FormData) {
  await staffAction(async (user) => {
    const v = z.object({ id: cuid, role: z.enum(["CUSTOMER", "STAFF", "ADMIN"]) }).parse(fd(form));
    if (v.id === user.id) flash("/admin/team", "error", "You cannot change your own role.");
    if (v.role !== "ADMIN") {
      const admins = await db.user.count({ where: { role: "ADMIN", status: "ACTIVE", id: { not: v.id } } });
      if (admins === 0) flash("/admin/team", "error", "At least one active administrator is required.");
    }
    await db.user.update({ where: { id: v.id }, data: { role: v.role } });
    await destroyAllSessions(v.id);
    await audit(user.id, "role", "User", v.id, { role: v.role });
    flash("/admin/team", "ok", "Role updated. The user was signed out everywhere.");
  }, { admin: true });
}
