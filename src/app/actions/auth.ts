"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { bdPhone, optionalEmail, password, formDataObject, zodFieldErrors, type FieldErrors } from "@/lib/validation";
import { hashToken, randomToken } from "@/lib/crypto";
import { env, isProd } from "@/lib/env";
import { hashPassword, verifyPassword, burnPasswordCheck } from "@/server/auth/password";
import { clientIp, createSession, destroyAllSessions, destroySession } from "@/server/auth/session";
import { mergeAnonymousCart } from "@/server/cart";
import { rateLimit } from "@/server/rate-limit";
import { getMailer } from "@/server/mail";

export type AuthState = { errors?: FieldErrors; ok?: boolean; message?: string; devLink?: string } | undefined;

function safeNext(next: unknown, fallback = "/account"): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}

async function ipKey(prefix: string) {
  return `${prefix}:${clientIp(await headers()) ?? "unknown"}`;
}

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "required").max(80),
    phone: bdPhone,
    email: optionalEmail,
    password,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "password_mismatch" });

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const raw = formDataObject(formData);
  if (!(await rateLimit(await ipKey("register"), 8, 60 * 15))) return { errors: { _form: "too_many" } };
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return { errors: zodFieldErrors(parsed.error) };
  const { name, phone, email } = parsed.data;

  const [phoneUser, emailUser] = await Promise.all([
    db.user.findUnique({ where: { phone } }),
    email ? db.user.findUnique({ where: { email } }) : null,
  ]);
  if (phoneUser) return { errors: { phone: "phone_taken" } };
  if (emailUser) return { errors: { email: "email_taken" } };

  const user = await db.user.create({
    data: { name, phone, email: email ?? null, passwordHash: await hashPassword(parsed.data.password), profile: { create: {} } },
  });
  await createSession(user.id);
  await mergeAnonymousCart(user.id);
  redirect(safeNext(raw.next));
}

const loginSchema = z.object({ identifier: z.string().trim().min(3, "required").max(200), password: z.string().min(1, "required").max(128) });

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const raw = formDataObject(formData);
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return { errors: zodFieldErrors(parsed.error) };
  const identifier = parsed.data.identifier.toLowerCase();
  const ipAllowed = await rateLimit(await ipKey("login"), 20, 60 * 15);
  const idAllowed = await rateLimit(`login-id:${hashToken(identifier)}`, 8, 60 * 15);
  if (!ipAllowed || !idAllowed) return { errors: { _form: "too_many" } };

  const phone = bdPhone.safeParse(identifier);
  const user = phone.success
    ? await db.user.findUnique({ where: { phone: phone.data } })
    : await db.user.findUnique({ where: { email: identifier } });
  if (!user) {
    await burnPasswordCheck(parsed.data.password);
    return { errors: { _form: "invalid_credentials" } };
  }
  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok || user.status !== "ACTIVE") return { errors: { _form: "invalid_credentials" } };

  await createSession(user.id);
  await mergeAnonymousCart(user.id);
  const fallback = user.role === "CUSTOMER" ? "/account" : "/admin";
  redirect(safeNext(raw.next, fallback));
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}

export async function requestResetAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const identifier = String(formData.get("identifier") ?? "").trim().toLowerCase();
  if (identifier.length < 3) return { errors: { identifier: "required" } };
  if (!(await rateLimit(await ipKey("reset"), 5, 60 * 15))) return { errors: { _form: "too_many" } };

  const phone = bdPhone.safeParse(identifier);
  const user = phone.success ? await db.user.findUnique({ where: { phone: phone.data } }) : await db.user.findUnique({ where: { email: identifier } });
  let devLink: string | undefined;
  if (user && user.status === "ACTIVE") {
    const token = randomToken();
    await db.passwordResetToken.create({ data: { tokenHash: hashToken(token), userId: user.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });
    const link = `${env.APP_URL}/account/reset/${token}`;
    await getMailer().send({ to: user.email ?? user.phone, subject: "Reset your FarmToHome password", text: `Use this link within one hour to choose a new password:\n${link}` });
    if (!isProd) devLink = link;
  }
  // Same response whether or not the account exists.
  return { ok: true, devLink };
}

const resetSchema = z
  .object({ token: z.string().min(20).max(200), password, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "password_mismatch" });

export async function resetPasswordAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = resetSchema.safeParse(formDataObject(formData));
  if (!parsed.success) return { errors: zodFieldErrors(parsed.error) };
  const record = await db.passwordResetToken.findUnique({ where: { tokenHash: hashToken(parsed.data.token) } });
  if (!record || record.usedAt || record.expiresAt < new Date()) return { errors: { _form: "reset_invalid" } };
  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { passwordHash: await hashPassword(parsed.data.password) } }),
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
  await destroyAllSessions(record.userId);
  redirect("/account/login?reset=1");
}
