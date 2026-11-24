import "server-only";
import type { Tx } from "@/lib/db";
import type { MovementType } from "@/generated/prisma/client";

export class StockError extends Error {
  constructor(public code: "out_of_stock" | "invalid_adjustment", public variantId: string, public available = 0) {
    super(code);
  }
}

/**
 * Reserve `quantity` units of a variant across batches, oldest packed first (FIFO).
 * Each step is a conditional UPDATE, so concurrent orders can never oversell.
 * Returns batch allocations. Throws StockError if not enough is available.
 */
export async function reserveStock(tx: Tx, variantId: string, quantity: number, orderId: string, actorId: string | null) {
  const rows = await tx.$queryRaw<{ id: string; batchId: string; free: number }[]>`
    SELECT i."id", i."batchId", (i."onHand" - i."reserved") AS free
    FROM "Inventory" i JOIN "Batch" b ON b."id" = i."batchId"
    WHERE i."variantId" = ${variantId} AND i."onHand" - i."reserved" > 0 AND b."status" IN ('ACTIVE', 'PACKED', 'APPROVED')
    ORDER BY b."packedAt" ASC NULLS LAST, b."collectedAt" ASC NULLS LAST
    FOR UPDATE OF i`;
  let need = quantity;
  const allocations: { batchId: string; quantity: number }[] = [];
  for (const r of rows) {
    if (need <= 0) break;
    const take = Math.min(need, Number(r.free));
    const updated = await tx.$executeRaw`
      UPDATE "Inventory" SET "reserved" = "reserved" + ${take}, "updatedAt" = now()
      WHERE "id" = ${r.id} AND "onHand" - "reserved" >= ${take}`;
    if (updated !== 1) continue;
    const inv = await tx.inventory.findUniqueOrThrow({ where: { id: r.id } });
    await tx.inventoryMovement.create({
      data: { variantId, batchId: r.batchId, type: "ORDER_RESERVED", quantity: take, onHandAfter: inv.onHand, reservedAfter: inv.reserved, orderId, actorId, reason: "Reserved for order" },
    });
    allocations.push({ batchId: r.batchId, quantity: take });
    need -= take;
  }
  if (need > 0) {
    const available = rows.reduce((s, r) => s + Number(r.free), 0);
    throw new StockError("out_of_stock", variantId, available);
  }
  return allocations;
}

/** Release a reservation (order cancelled). */
export async function releaseStock(tx: Tx, variantId: string, batchId: string, quantity: number, orderId: string, actorId: string | null) {
  await tx.$executeRaw`UPDATE "Inventory" SET "reserved" = GREATEST(0, "reserved" - ${quantity}), "updatedAt" = now() WHERE "variantId" = ${variantId} AND "batchId" = ${batchId}`;
  const inv = await tx.inventory.findUnique({ where: { variantId_batchId: { variantId, batchId } } });
  await tx.inventoryMovement.create({ data: { variantId, batchId, type: "ORDER_RELEASED", quantity, onHandAfter: inv?.onHand, reservedAfter: inv?.reserved, orderId, actorId, reason: "Reservation released" } });
}

/** Goods leave the warehouse: convert reservation into an on-hand deduction. */
export async function fulfillStock(tx: Tx, variantId: string, batchId: string, quantity: number, orderId: string, actorId: string | null) {
  await tx.$executeRaw`UPDATE "Inventory" SET "onHand" = GREATEST(0, "onHand" - ${quantity}), "reserved" = GREATEST(0, "reserved" - ${quantity}), "updatedAt" = now() WHERE "variantId" = ${variantId} AND "batchId" = ${batchId}`;
  const inv = await tx.inventory.findUnique({ where: { variantId_batchId: { variantId, batchId } } });
  await tx.inventoryMovement.create({ data: { variantId, batchId, type: "ORDER_FULFILLED", quantity: -quantity, onHandAfter: inv?.onHand, reservedAfter: inv?.reserved, orderId, actorId, reason: "Dispatched to customer" } });
}

const SIGN: Partial<Record<MovementType, 1 | -1>> = {
  PROCUREMENT_RECEIVED: 1, QC_APPROVED: 1, CUSTOMER_RETURN: 1,
  QC_REJECTED: -1, PROCESSING_LOSS: -1, PACKAGING_LOSS: -1, DAMAGED: -1, EXPIRED: -1,
};

/**
 * Staff stock adjustment against a batch. Positive types add stock, negative types remove it,
 * MANUAL_ADJUSTMENT takes a signed quantity. On-hand can never drop below what is reserved.
 */
export async function adjustStock(tx: Tx, input: { variantId: string; batchId: string; type: MovementType; quantity: number; reason: string; actorId: string }) {
  const sign = input.type === "MANUAL_ADJUSTMENT" ? 1 : SIGN[input.type];
  if (!sign || !Number.isInteger(input.quantity) || input.quantity === 0) throw new StockError("invalid_adjustment", input.variantId);
  const delta = sign * (input.type === "MANUAL_ADJUSTMENT" ? input.quantity : Math.abs(input.quantity));
  await tx.inventory.upsert({
    where: { variantId_batchId: { variantId: input.variantId, batchId: input.batchId } },
    create: { variantId: input.variantId, batchId: input.batchId, onHand: 0, reserved: 0 },
    update: {},
  });
  const updated = await tx.$executeRaw`
    UPDATE "Inventory" SET "onHand" = "onHand" + ${delta}, "updatedAt" = now()
    WHERE "variantId" = ${input.variantId} AND "batchId" = ${input.batchId} AND "onHand" + ${delta} >= "reserved"`;
  if (updated !== 1) throw new StockError("invalid_adjustment", input.variantId);
  const inv = await tx.inventory.findUniqueOrThrow({ where: { variantId_batchId: { variantId: input.variantId, batchId: input.batchId } } });
  return tx.inventoryMovement.create({
    data: { variantId: input.variantId, batchId: input.batchId, type: input.type, quantity: delta, onHandAfter: inv.onHand, reservedAfter: inv.reserved, reason: input.reason, actorId: input.actorId },
  });
}
