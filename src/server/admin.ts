import "server-only";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin, requireStaff } from "./auth/guards";
import type { SessionUser } from "./auth/session";

/** Redirect back to an admin page with a flash message (rendered by <Flash/>). */
export function flash(path: string, kind: "ok" | "error", message: string): never {
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}${kind}=${encodeURIComponent(message)}`);
}

export function zErr(e: z.ZodError): string {
  return e.issues.map((i) => `${i.path.join(".") || "form"}: ${i.message}`).join("; ");
}

/** Run an admin mutation with role check. Admin-only actions pass { admin: true }. */
export async function staffAction<T>(fn: (user: SessionUser) => Promise<T>, opts: { admin?: boolean } = {}): Promise<T> {
  const user = opts.admin ? await requireAdmin() : await requireStaff();
  return fn(user);
}

export const optStr = z.string().trim().max(5000).optional().transform((v) => (v ? v : null));
export const reqStr = (max = 200) => z.string().trim().min(1, "required").max(max);
export const money = z.coerce.number().min(0).max(10_000_000).transform((v) => Math.round(v * 100));
export const optMoney = z.string().trim().optional().transform((v) => (v ? Math.round(Number(v) * 100) : null)).refine((v) => v === null || (Number.isFinite(v) && v >= 0), "invalid amount");
export const optDate = z.string().trim().optional().transform((v) => (v ? new Date(v) : null)).refine((v) => v === null || !Number.isNaN(v.getTime()), "invalid date");
export const checkbox = z.string().optional().transform((v) => v === "on" || v === "true");
export const slug = z.string().trim().toLowerCase().min(2).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "use lowercase letters, numbers and hyphens");

export function fd(form: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of form.entries()) if (typeof v === "string") out[k] = v;
  return out;
}
