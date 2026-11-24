"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { bdPhone, cuid, formDataObject, optionalEmail, zodFieldErrors, type FieldErrors } from "@/lib/validation";
import { clientIp, getCurrentUser } from "@/server/auth/session";
import { requireUser } from "@/server/auth/guards";
import { rateLimit } from "@/server/rate-limit";
import { createConciergeRequest } from "@/server/concierge";

export type ConciergeState = { ok?: boolean; reference?: string; errors?: FieldErrors } | undefined;

const schema = z.object({
  name: z.string().trim().min(2, "required").max(80),
  phone: bdPhone,
  email: optionalEmail,
  topic: z.enum(["SHOPPING_HELP", "BUILD_MARKET", "SOURCING", "AVAILABILITY", "SPECIAL_PRODUCT", "DELIVERY", "SUPPORT"]),
  message: z.string().trim().min(5, "required").max(2000),
  orderRef: z.string().trim().max(20).optional().transform((v) => v || null),
  productSlug: z.string().trim().max(80).optional().transform((v) => v || null),
  website: z.string().max(0).optional(), // honeypot
});

export async function submitConciergeAction(_p: ConciergeState, fd: FormData): Promise<ConciergeState> {
  const user = await getCurrentUser();
  const ip = clientIp(await headers()) ?? "unknown";
  if (!(await rateLimit(`concierge:${user?.id ?? ip}`, 5, 3600))) return { errors: { _form: "too_many" } };
  const parsed = schema.safeParse(formDataObject(fd));
  if (!parsed.success) return { errors: zodFieldErrors(parsed.error) };
  const { website: _hp, ...data } = parsed.data;
  const req = await createConciergeRequest({ ...data, userId: user?.id ?? null });
  revalidatePath("/account/concierge");
  return { ok: true, reference: req.reference };
}

export async function customerReplyAction(fd: FormData): Promise<void> {
  const user = await requireUser();
  const requestId = cuid.parse(fd.get("requestId"));
  const body = z.string().trim().min(1).max(2000).parse(fd.get("body"));
  const req = await db.conciergeRequest.findFirst({ where: { id: requestId, userId: user.id } });
  if (!req) return;
  if (!(await rateLimit(`concierge-reply:${user.id}`, 20, 3600))) return;
  await db.$transaction([
    db.conciergeMessage.create({ data: { requestId, authorId: user.id, fromStaff: false, body } }),
    db.conciergeRequest.update({ where: { id: requestId }, data: { status: req.status === "RESOLVED" || req.status === "CLOSED" ? "OPEN" : req.status } }),
  ]);
  revalidatePath("/account/concierge");
}
