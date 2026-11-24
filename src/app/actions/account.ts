"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/server/auth/guards";
import { createSession, destroyAllSessions } from "@/server/auth/session";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { rateLimit } from "@/server/rate-limit";
import { bdPhone, cuid, formDataObject, optionalEmail, password, zodFieldErrors, type FieldErrors } from "@/lib/validation";
import { LOCALE_COOKIE } from "@/i18n/shared";
import { isProd } from "@/lib/env";

export type FormState = { ok?: boolean; errors?: FieldErrors } | undefined;

export async function updateProfileAction(_p: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = z.object({ name: z.string().trim().min(2, "required").max(80), email: optionalEmail }).safeParse(formDataObject(fd));
  if (!parsed.success) return { errors: zodFieldErrors(parsed.error) };
  if (parsed.data.email) {
    const taken = await db.user.findFirst({ where: { email: parsed.data.email, id: { not: user.id } } });
    if (taken) return { errors: { email: "email_taken" } };
  }
  await db.user.update({ where: { id: user.id }, data: { name: parsed.data.name, email: parsed.data.email ?? null } });
  revalidatePath("/account", "layout");
  return { ok: true };
}

export async function changePasswordAction(_p: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!(await rateLimit(`pwchange:${user.id}`, 6, 900))) return { errors: { _form: "too_many" } };
  const parsed = z
    .object({ current: z.string().min(1, "required"), password, confirm: z.string() })
    .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "password_mismatch" })
    .safeParse(formDataObject(fd));
  if (!parsed.success) return { errors: zodFieldErrors(parsed.error) };
  const row = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await verifyPassword(parsed.data.current, row.passwordHash))) return { errors: { current: "wrong_password" } };
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.password) } });
  await destroyAllSessions(user.id);
  await createSession(user.id); // keep this device signed in
  return { ok: true };
}

const addressSchema = z.object({
  label: z.string().trim().min(1, "required").max(30),
  recipient: z.string().trim().min(2, "required").max(80),
  phone: bdPhone,
  division: z.string().trim().min(2, "required").max(40),
  district: z.string().trim().min(2, "required").max(40),
  area: z.string().trim().min(2, "required").max(60),
  line1: z.string().trim().min(6, "address_short").max(200),
  landmark: z.string().trim().max(120).optional().transform((v) => v || null),
  instructions: z.string().trim().max(300).optional().transform((v) => v || null),
});

export async function saveAddressAction(_p: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const raw = formDataObject(fd);
  const parsed = addressSchema.safeParse(raw);
  if (!parsed.success) return { errors: zodFieldErrors(parsed.error) };
  const id = raw.id ? cuid.parse(raw.id) : null;
  if (id) {
    const owned = await db.address.findFirst({ where: { id, userId: user.id } });
    if (!owned) return { errors: { _form: "forbidden" } };
    await db.address.update({ where: { id }, data: parsed.data });
  } else {
    const count = await db.address.count({ where: { userId: user.id } });
    if (count >= 10) return { errors: { _form: "generic" } };
    await db.address.create({ data: { ...parsed.data, userId: user.id, isDefault: count === 0 } });
  }
  revalidatePath("/account/addresses");
  return { ok: true };
}

export async function deleteAddressAction(fd: FormData): Promise<void> {
  const user = await requireUser();
  const id = cuid.parse(fd.get("id"));
  const owned = await db.address.findFirst({ where: { id, userId: user.id } });
  if (!owned) return;
  await db.address.delete({ where: { id } });
  if (owned.isDefault) {
    const next = await db.address.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });
    if (next) await db.address.update({ where: { id: next.id }, data: { isDefault: true } });
  }
  revalidatePath("/account/addresses");
}

export async function setDefaultAddressAction(fd: FormData): Promise<void> {
  const user = await requireUser();
  const id = cuid.parse(fd.get("id"));
  const owned = await db.address.findFirst({ where: { id, userId: user.id } });
  if (!owned) return;
  await db.$transaction([
    db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } }),
    db.address.update({ where: { id }, data: { isDefault: true } }),
  ]);
  revalidatePath("/account/addresses");
}

export async function savePreferencesAction(_p: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const lang = fd.get("language") === "BN" ? "BN" : "EN";
  const hh = Number(fd.get("householdSize"));
  const data = {
    preferredLanguage: lang as "EN" | "BN",
    householdSize: Number.isInteger(hh) && hh >= 1 && hh <= 20 ? hh : null,
    notifyOrderUpdates: fd.get("notifyOrderUpdates") === "on",
    notifyHarvestNews: fd.get("notifyHarvestNews") === "on",
    notifyBySms: fd.get("notifyBySms") === "on",
    notifyByEmail: fd.get("notifyByEmail") === "on",
  };
  await db.customerProfile.upsert({ where: { userId: user.id }, create: { userId: user.id, ...data }, update: data });
  (await cookies()).set(LOCALE_COOKIE, lang === "BN" ? "bn" : "en", { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", secure: isProd });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function markNotificationsReadAction(): Promise<void> {
  const user = await requireUser();
  await db.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/account/notifications");
}
