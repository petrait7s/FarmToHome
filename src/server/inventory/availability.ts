import "server-only";
import { db, type Tx } from "@/lib/db";

/** Units available to sell per variant (onHand − reserved across batches). Sourced-to-order variants are unlimited (null). */
export async function availableByVariant(variantIds: string[], tx?: Tx): Promise<Map<string, number | null>> {
  const client = tx ?? db;
  const out = new Map<string, number | null>();
  if (variantIds.length === 0) return out;
  const variants = await client.productVariant.findMany({
    where: { id: { in: variantIds } },
    select: { id: true, fulfillmentMode: true },
  });
  const stockIds = variants.filter((v) => v.fulfillmentMode === "STOCK").map((v) => v.id);
  for (const v of variants) if (v.fulfillmentMode === "SOURCED_TO_ORDER") out.set(v.id, null);
  if (stockIds.length) {
    const sums = await client.inventory.groupBy({
      by: ["variantId"],
      where: { variantId: { in: stockIds } },
      _sum: { onHand: true, reserved: true },
    });
    for (const id of stockIds) out.set(id, 0);
    for (const s of sums) out.set(s.variantId, Math.max(0, (s._sum.onHand ?? 0) - (s._sum.reserved ?? 0)));
  }
  return out;
}
