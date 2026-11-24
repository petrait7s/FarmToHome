import "server-only";
import { db } from "@/lib/db";
import type { MarketMode } from "@/generated/prisma/client";

/** Latest traceable batch per product (for "Know your origin" in the builder). */
export async function latestBatchByProduct(productIds: string[]) {
  const batches = await db.batch.findMany({
    where: { productId: { in: productIds }, status: { in: ["ACTIVE", "APPROVED", "PACKED"] } },
    orderBy: [{ collectedAt: "desc" }],
    select: { productId: true, batchNumber: true, collectedAt: true, packedAt: true, isDemo: true },
  });
  const map = new Map<string, { batchNumber: string; collectedAt: string | null; packedAt: string | null; isDemo: boolean }>();
  for (const b of batches) {
    if (!map.has(b.productId)) map.set(b.productId, { batchNumber: b.batchNumber, collectedAt: b.collectedAt?.toISOString() ?? null, packedAt: b.packedAt?.toISOString() ?? null, isDemo: b.isDemo });
  }
  return Object.fromEntries(map);
}

/** Variants a signed-in customer buys most often (weekly) or bought in their last monthly order (monthly). */
export async function historySuggestions(userId: string, mode: MarketMode): Promise<{ variantId: string; quantity: number }[]> {
  if (mode === "MONTHLY") {
    const last = await db.order.findFirst({
      where: { userId, marketMode: "MONTHLY", status: { not: "CANCELLED" } },
      orderBy: { createdAt: "desc" },
      include: { items: { select: { variantId: true, quantity: true } } },
    });
    return last?.items ?? [];
  }
  const rows = await db.orderItem.groupBy({
    by: ["variantId"],
    where: { order: { userId, status: { not: "CANCELLED" } } },
    _count: { variantId: true },
    _max: { quantity: true },
    orderBy: { _count: { variantId: "desc" } },
    take: 8,
  });
  return rows.filter((r) => r._count.variantId >= 2).map((r) => ({ variantId: r.variantId, quantity: r._max.quantity ?? 1 }));
}

export async function defaultZoneRule() {
  const zone = await db.deliveryZone.findFirst({ where: { active: true }, orderBy: { feeMinor: "asc" } });
  return zone ? { feeMinor: zone.feeMinor, freeThresholdMinor: zone.freeThresholdMinor } : null;
}

export async function listSavedMarkets(userId: string) {
  return db.savedMarket.findMany({
    where: { userId },
    orderBy: [{ lastUsedAt: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }],
    include: {
      items: {
        orderBy: { position: "asc" },
        include: { variant: { include: { product: { select: { name: true, nameBn: true, slug: true, artKey: true, status: true } } } } },
      },
      _count: { select: { orders: true } },
    },
  });
}
