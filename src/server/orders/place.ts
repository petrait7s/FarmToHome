import "server-only";
import { z } from "zod";
import { db, type Tx } from "@/lib/db";
import { hashToken, makeReference, randomToken } from "@/lib/crypto";
import { bdPhone, optionalEmail } from "@/lib/validation";
import { Prisma, type PaymentMethod } from "@/generated/prisma/client";
import { computeTotals, evaluatePromotion, type PricedLine } from "../pricing";
import { loadPromotionRule } from "../promotions";
import { reserveStock, StockError } from "../inventory/stock";
import { bookingWindow, findZoneFor, slotLabel } from "../delivery";
import { getProvider } from "../payments";
import { getSettings } from "../settings";

export const checkoutSchema = z.object({
  idempotencyKey: z.string().uuid(),
  name: z.string().trim().min(2, "required").max(80),
  phone: bdPhone,
  email: optionalEmail,
  addressId: z.string().optional().transform((v) => v || undefined),
  division: z.string().trim().min(2, "required").max(40),
  district: z.string().trim().min(2, "required").max(40),
  area: z.string().trim().min(2, "required").max(60),
  line1: z.string().trim().min(6, "address_short").max(200),
  landmark: z.string().trim().max(120).optional().transform((v) => v || undefined),
  instructions: z.string().trim().max(300).optional().transform((v) => v || undefined),
  slotId: z.string().min(10, "slot_invalid"),
  paymentMethod: z.enum(["CASH_ON_DELIVERY", "MOBILE_SIMULATED", "ONLINE_SIMULATED"]),
  note: z.string().trim().max(500).optional().transform((v) => v || undefined),
  saveAddress: z.boolean().optional(),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export class OrderError extends Error {
  constructor(public code: string, public meta: Record<string, string | number> = {}) {
    super(code);
  }
}

export type PlaceResult =
  | { ok: true; orderId: string; reference: string; guestToken: string | null; nextUrl: string | null; duplicate?: boolean }
  | { ok: false; error: string; meta?: Record<string, string | number> };

/**
 * Create an order transactionally from the customer's cart.
 * Prices, discounts, fees, stock and slot capacity are all re-validated here — nothing from the client is trusted
 * except the cart reference, contact/address details and choices.
 */
export async function placeOrder(input: CheckoutInput, ctx: { cartId: string; userId: string | null }): Promise<PlaceResult> {
  const existing = await db.order.findUnique({ where: { idempotencyKey: input.idempotencyKey }, select: { id: true, reference: true, userId: true } });
  if (existing) {
    if (existing.userId && existing.userId !== ctx.userId) return { ok: false, error: "forbidden" };
    return { ok: true, orderId: existing.id, reference: existing.reference, guestToken: null, nextUrl: null, duplicate: true };
  }
  const settings = await getSettings();
  const guestToken = ctx.userId ? null : randomToken(24);

  try {
    const order = await db.$transaction(
      async (tx) => {
        // 1. Cart
        const cart = await tx.cart.findUnique({
          where: { id: ctx.cartId },
          include: { items: { include: { variant: { include: { product: { select: { id: true, name: true, status: true, categoryId: true } } } } } } },
        });
        if (!cart || (ctx.userId && cart.userId !== ctx.userId) || (!ctx.userId && cart.userId)) throw new OrderError("cart_empty");
        if (cart.items.length === 0) throw new OrderError("cart_empty");
        for (const i of cart.items) {
          if (!i.variant.active || i.variant.product.status !== "ACTIVE") throw new OrderError("unavailable", { name: i.variant.product.name });
          if (i.quantity < 1 || i.quantity > 30) throw new OrderError("unavailable", { name: i.variant.product.name });
        }

        // 2. Address & zone
        if (input.addressId) {
          if (!ctx.userId) throw new OrderError("forbidden");
          const owned = await tx.address.findFirst({ where: { id: input.addressId, userId: ctx.userId } });
          if (!owned) throw new OrderError("forbidden");
        }
        const zone = await findZoneFor(input.district, input.area, tx);
        if (!zone) throw new OrderError("zone_invalid");

        // 3. Slot: must belong to the zone, be inside the booking window, and have capacity (conditional update).
        const slot = await tx.deliverySlot.findUnique({ where: { id: input.slotId } });
        const { first, last } = await bookingWindow();
        if (!slot || slot.zoneId !== zone.id || !slot.active || slot.date < first || slot.date > last) throw new OrderError("slot_invalid");
        const reserved = await tx.$executeRaw`UPDATE "DeliverySlot" SET "booked" = "booked" + 1 WHERE "id" = ${slot.id} AND "active" = true AND "booked" < "capacity"`;
        if (reserved !== 1) throw new OrderError("slot_full");

        // 4. Price every line from the database.
        const lines: (PricedLine & { name: string; label: string; sku: string; mode: "STOCK" | "SOURCED_TO_ORDER" })[] = cart.items.map((i) => ({
          variantId: i.variantId,
          productId: i.variant.product.id,
          categoryId: i.variant.product.categoryId,
          unitPriceMinor: i.variant.priceMinor,
          quantity: i.quantity,
          name: i.variant.product.name,
          label: i.variant.label,
          sku: i.variant.sku,
          mode: i.variant.fulfillmentMode,
        }));

        // 5. Promotion (validated and counted atomically).
        let discountMinor = 0;
        let perLine = new Map<string, number>();
        let promotionId: string | null = null;
        if (cart.promoCode) {
          const rule = await loadPromotionRule(cart.promoCode, { userId: ctx.userId, phone: input.phone }, tx);
          const r = evaluatePromotion(rule, lines);
          if (!r.ok) throw new OrderError(r.error, r.minSubtotalMinor ? { amount: r.minSubtotalMinor } : {});
          const promo = await tx.promotion.findUniqueOrThrow({ where: { code: cart.promoCode } });
          const counted = await tx.$executeRaw`UPDATE "Promotion" SET "usedCount" = "usedCount" + 1 WHERE "id" = ${promo.id} AND ("usageLimit" IS NULL OR "usedCount" < "usageLimit")`;
          if (counted !== 1) throw new OrderError("promo_limit");
          discountMinor = r.discountMinor;
          perLine = r.perLine;
          promotionId = promo.id;
        }

        // 6. Totals and minimum order.
        const totals = computeTotals(lines, { feeMinor: zone.feeMinor, freeThresholdMinor: zone.freeThresholdMinor }, discountMinor);
        if (totals.subtotalMinor < settings.minOrderMinor) throw new OrderError("min_order", { amount: settings.minOrderMinor });

        // 7. Order + items.
        const needsSourcing = lines.some((l) => l.mode === "SOURCED_TO_ORDER");
        const address = { division: input.division, district: zone.district, area: input.area, line1: input.line1, landmark: input.landmark, instructions: input.instructions };
        let addressId = input.addressId ?? null;
        if (ctx.userId && input.saveAddress && !addressId) {
          const count = await tx.address.count({ where: { userId: ctx.userId } });
          const saved = await tx.address.create({ data: { userId: ctx.userId, label: "Home", recipient: input.name, phone: input.phone, ...address, isDefault: count === 0 } });
          addressId = saved.id;
        }
        const created = await tx.order.create({
          data: {
            reference: makeReference("FTH"),
            idempotencyKey: input.idempotencyKey,
            userId: ctx.userId,
            guestAccessHash: guestToken ? hashToken(guestToken) : null,
            needsSourcing,
            marketMode: cart.mode,
            savedMarketId: cart.savedMarketId && ctx.userId && (await tx.savedMarket.count({ where: { id: cart.savedMarketId, userId: ctx.userId } })) ? cart.savedMarketId : null,
            contactName: input.name,
            contactPhone: input.phone,
            contactEmail: input.email ?? null,
            addressId,
            ...address,
            zoneId: zone.id,
            slotId: slot.id,
            deliveryDate: slot.date,
            slotLabel: slotLabel(slot),
            subtotalMinor: totals.subtotalMinor,
            discountMinor: totals.discountMinor,
            deliveryFeeMinor: totals.deliveryFeeMinor,
            totalMinor: totals.totalMinor,
            promoCode: promotionId ? cart.promoCode : null,
            customerNote: input.note ?? null,
            items: {
              create: lines.map((l) => ({
                variantId: l.variantId, productName: l.name, variantLabel: l.label, sku: l.sku,
                unitPriceMinor: l.unitPriceMinor, quantity: l.quantity, lineTotalMinor: l.unitPriceMinor * l.quantity,
                discountMinor: perLine.get(l.variantId) ?? 0, fulfillmentMode: l.mode,
              })),
            },
            statusHistory: { create: { status: "PLACED", note: "Order placed by customer", actorId: ctx.userId } },
            delivery: { create: {} },
          },
          include: { items: true },
        });

        // 8. Reserve stock against batches (FIFO) and record allocations.
        for (const item of created.items) {
          if (item.fulfillmentMode !== "STOCK") continue;
          const allocations = await reserveStock(tx, item.variantId, item.quantity, created.id, ctx.userId).catch((e) => {
            if (e instanceof StockError) throw new OrderError("out_of_stock", { name: item.productName });
            throw e;
          });
          await tx.orderItemAllocation.createMany({ data: allocations.map((a) => ({ orderItemId: item.id, batchId: a.batchId, quantity: a.quantity })) });
        }

        // 9. Payment record (provider boundary) and promotion redemption.
        const provider = getProvider(input.paymentMethod as PaymentMethod);
        const payment = await tx.payment.create({
          data: {
            orderId: created.id, method: provider.method, provider: provider.provider, isSimulated: provider.simulated,
            amountMinor: totals.totalMinor, idempotencyKey: `${input.idempotencyKey}:pay`,
            events: { create: { status: "PENDING", note: provider.simulated ? "Simulated payment created (development)" : "Cash on delivery" } },
          },
        });
        if (promotionId) {
          await tx.promotionRedemption.create({ data: { promotionId, orderId: created.id, userId: ctx.userId, phone: input.phone, amountMinor: totals.discountMinor } });
        }

        // 10. Empty the cart.
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        await tx.cart.update({ where: { id: cart.id }, data: { promoCode: null, savedMarketId: null } });

        if (ctx.userId) {
          await tx.notification.create({ data: { userId: ctx.userId, type: "order", title: `Order ${created.reference} placed`, body: `Delivery ${slot.date.toISOString().slice(0, 10)}, ${slotLabel(slot)}.`, href: `/orders/${created.reference}` } });
        }
        return { id: created.id, reference: created.reference, paymentId: payment.id, provider };
      },
      { timeout: 20000, isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
    const q = guestToken ? `?t=${guestToken}` : "";
    return { ok: true, orderId: order.id, reference: order.reference, guestToken, nextUrl: order.provider.nextStepUrl(order.paymentId, order.reference, q) };
  } catch (e) {
    if (e instanceof OrderError) return { ok: false, error: e.code, meta: e.meta };
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      // Concurrent duplicate submit with the same idempotency key.
      const dup = await db.order.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
      if (dup) return { ok: true, orderId: dup.id, reference: dup.reference, guestToken: null, nextUrl: null, duplicate: true };
    }
    throw e;
  }
}

export async function notify(tx: Tx, userId: string | null, title: string, body: string, href: string) {
  if (!userId) return;
  await tx.notification.create({ data: { userId, type: "order", title, body, href } });
}
