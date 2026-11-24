import "server-only";
import { timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { hashToken } from "@/lib/crypto";
import { getCurrentUser } from "../auth/session";
import { isStaff } from "../auth/guards";

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * Load an order only if the viewer may see it: its owner, staff, or a guest holding the order's secret link token.
 * Returns null otherwise (callers render 404 so order references cannot be probed).
 */
export async function getOrderForViewer(reference: string, guestToken?: string | null) {
  const order = await db.order.findUnique({
    where: { reference },
    include: {
      items: { include: { allocations: { include: { batch: { select: { batchNumber: true } } } }, variant: { select: { product: { select: { slug: true, artKey: true } } } } } },
      statusHistory: { orderBy: { createdAt: "asc" } },
      payments: { orderBy: { createdAt: "asc" } },
      zone: { select: { name: true } },
    },
  });
  if (!order) return null;
  const user = await getCurrentUser();
  const owner = !!user && order.userId === user.id;
  const staff = isStaff(user);
  const guest = !order.userId && !!guestToken && !!order.guestAccessHash && safeEqual(hashToken(guestToken), order.guestAccessHash);
  if (!owner && !staff && !guest) return null;
  return { order, viewer: { owner, staff, guest, userId: user?.id ?? null } };
}
