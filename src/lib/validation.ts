import { z } from "zod";

/** Bangladesh mobile number. Accepts 01XXXXXXXXX, +8801XXXXXXXXX or 8801XXXXXXXXX; normalises to 01XXXXXXXXX. */
export const bdPhone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .refine((v) => /^(?:\+?88)?01[3-9]\d{8}$/.test(v), { message: "invalid_phone" })
  .transform((v) => v.replace(/^\+?88/, ""));

export const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .max(200)
  .optional()
  .transform((v) => (v ? v : undefined))
  .refine((v) => v === undefined || z.email().safeParse(v).success, { message: "invalid_email" });

export const password = z.string().min(8, "password_short").max(128);

export const cuid = z.string().min(10).max(40).regex(/^[a-z0-9]+$/i);

export function formDataObject(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") out[k] = v;
  return out;
}

export type FieldErrors = Record<string, string>;

export function zodFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
