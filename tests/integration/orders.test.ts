import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { placeOrder } from "@/server/orders/place";
import { changeOrderStatus, allocateSourcedBatch } from "@/server/orders/manage";
import { checkoutInput, makeCart, makeUser, openSlot, pilotZone, stockOf, variantOf } from "../support/factories";

describe("order placement", () => {
  it("creates an order, reserves stock against batches, books the slot and empties the cart", async () => {
    const rice = await variantOf("miniket-rice");
    const before = await stockOf(rice.id);
    const user = await makeUser("01900000001");
    const cart = await makeCart(user.id, [{ variantId: rice.id, quantity: 2 }]);
    const input = await checkoutInput();
    const slotBefore = await db.deliverySlot.findUniqueOrThrow({ where: { id: input.slotId } });

    const r = await placeOrder(input, { cartId: cart.id, userId: user.id });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const order = await db.order.findUniqueOrThrow({ where: { id: r.orderId }, include: { items: { include: { allocations: true } }, payments: true, statusHistory: true } });
    expect(order.subtotalMinor).toBe(rice.priceMinor * 2);
    expect(order.items[0].allocations.reduce((s, a) => s + a.quantity, 0)).toBe(2);
    expect(order.payments[0]).toMatchObject({ method: "CASH_ON_DELIVERY", status: "PENDING", isSimulated: false, amountMinor: order.totalMinor });
    expect(order.statusHistory.map((h) => h.status)).toEqual(["PLACED"]);
    expect(order.needsSourcing).toBe(false);

    const after = await stockOf(rice.id);
    expect(after.reserved - before.reserved).toBe(2);
    expect(after.onHand).toBe(before.onHand);
    expect((await db.deliverySlot.findUniqueOrThrow({ where: { id: input.slotId } })).booked).toBe(slotBefore.booked + 1);
    expect(await db.cartItem.count({ where: { cartId: cart.id } })).toBe(0);
    expect(await db.inventoryMovement.count({ where: { orderId: order.id, type: "ORDER_RESERVED" } })).toBeGreaterThan(0);
  });

  it("is idempotent: the same key never creates a second order", async () => {
    const rice = await variantOf("miniket-rice");
    const user = await makeUser("01900000002");
    const cart = await makeCart(user.id, [{ variantId: rice.id, quantity: 2 }]);
    const input = await checkoutInput();
    const first = await placeOrder(input, { cartId: cart.id, userId: user.id });
    await db.cartItem.create({ data: { cartId: cart.id, variantId: rice.id, quantity: 2 } });
    const second = await placeOrder(input, { cartId: cart.id, userId: user.id });
    expect(first.ok && second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(second.orderId).toBe(first.orderId);
      expect(second.duplicate).toBe(true);
    }
    expect(await db.order.count({ where: { idempotencyKey: input.idempotencyKey } })).toBe(1);
  });

  it("prices from the database, not from anything the client saw", async () => {
    const chira = await variantOf("new-aman-chira");
    const user = await makeUser("01900000003");
    const cart = await makeCart(user.id, [{ variantId: chira.id, quantity: 6 }]);
    await db.productVariant.update({ where: { id: chira.id }, data: { priceMinor: chira.priceMinor + 1000 } });
    const r = await placeOrder(await checkoutInput(), { cartId: cart.id, userId: user.id });
    await db.productVariant.update({ where: { id: chira.id }, data: { priceMinor: chira.priceMinor } });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const order = await db.order.findUniqueOrThrow({ where: { id: r.orderId }, include: { items: true } });
    expect(order.items[0].unitPriceMinor).toBe(chira.priceMinor + 1000);
  });

  it("refuses to oversell and rolls back the slot booking", async () => {
    const ghee = await variantOf("pure-cow-ghee", 1);
    const { onHand, reserved } = await stockOf(ghee.id);
    const user = await makeUser("01900000004");
    const input = await checkoutInput();
    const slotBefore = await db.deliverySlot.findUniqueOrThrow({ where: { id: input.slotId } });
    const cart = await makeCart(user.id, [{ variantId: ghee.id, quantity: Math.min(30, onHand - reserved + 1) }]);
    if (onHand - reserved + 1 > 30) return; // seed stock too large for this check
    const r = await placeOrder(input, { cartId: cart.id, userId: user.id });
    expect(r).toMatchObject({ ok: false, error: "out_of_stock" });
    expect((await db.deliverySlot.findUniqueOrThrow({ where: { id: input.slotId } })).booked).toBe(slotBefore.booked);
    expect(await stockOf(ghee.id)).toEqual({ onHand, reserved });
  });

  it("enforces slot capacity under concurrent checkouts", async () => {
    const zone = await pilotZone();
    const slotView = await openSlot();
    const slot = await db.deliverySlot.update({ where: { id: slotView.id }, data: { capacity: (await db.deliverySlot.findUniqueOrThrow({ where: { id: slotView.id } })).booked + 1 } });
    expect(slot.zoneId).toBe(zone.id);
    const rice = await variantOf("miniket-rice");
    const users = await Promise.all([makeUser("01900000005"), makeUser("01900000006"), makeUser("01900000007")]);
    const carts = await Promise.all(users.map((u) => makeCart(u.id, [{ variantId: rice.id, quantity: 2 }])));
    const results = await Promise.all(carts.map(async (c, i) => placeOrder({ ...(await checkoutInput()), slotId: slot.id }, { cartId: c.id, userId: users[i].id })));
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.filter((r) => !r.ok).every((r) => !r.ok && r.error === "slot_full")).toBe(true);
    const final = await db.deliverySlot.findUniqueOrThrow({ where: { id: slot.id } });
    expect(final.booked).toBe(final.capacity);
  });

  it("rejects areas outside delivery zones and slots from another zone", async () => {
    const rice = await variantOf("miniket-rice");
    const user = await makeUser("01900000008");
    const cart = await makeCart(user.id, [{ variantId: rice.id, quantity: 2 }]);
    expect(await placeOrder(await checkoutInput({ area: "Mirpur" }), { cartId: cart.id, userId: user.id })).toMatchObject({ ok: false, error: "zone_invalid" });
    const otherZoneSlot = await db.deliverySlot.findFirstOrThrow({ where: { zone: { areas: { has: "Uttara" } } } });
    expect(await placeOrder(await checkoutInput({ slotId: otherZoneSlot.id }), { cartId: cart.id, userId: user.id })).toMatchObject({ ok: false, error: "slot_invalid" });
  });

  it("enforces the minimum order", async () => {
    const turmeric = await variantOf("hill-turmeric");
    const user = await makeUser("01900000009");
    const cart = await makeCart(user.id, [{ variantId: turmeric.id, quantity: 1 }]);
    expect(await placeOrder(await checkoutInput(), { cartId: cart.id, userId: user.id })).toMatchObject({ ok: false, error: "min_order" });
  });

  it("validates and counts promotions server-side, once per customer", async () => {
    const rice = await variantOf("miniket-rice", 1);
    const user = await makeUser("01900000010");
    const cart1 = await makeCart(user.id, [{ variantId: rice.id, quantity: 2 }], "WELCOME10");
    const promoBefore = await db.promotion.findUniqueOrThrow({ where: { code: "WELCOME10" } });
    const r1 = await placeOrder(await checkoutInput({ phone: "01900000010" }), { cartId: cart1.id, userId: user.id });
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    const o1 = await db.order.findUniqueOrThrow({ where: { id: r1.orderId } });
    expect(o1.discountMinor).toBe(16400); // 10% of ৳1,640 (under the ৳300 cap)
    expect((await db.promotion.findUniqueOrThrow({ where: { code: "WELCOME10" } })).usedCount).toBe(promoBefore.usedCount + 1);
    const cart2 = await makeCart(user.id, [{ variantId: rice.id, quantity: 2 }], "WELCOME10");
    expect(await placeOrder(await checkoutInput({ phone: "01900000010" }), { cartId: cart2.id, userId: user.id })).toMatchObject({ ok: false, error: "promo_limit" });
    const user2 = await makeUser("01900000013");
    const cart4 = await makeCart(user2.id, [{ variantId: rice.id, quantity: 4 }], "WELCOME10");
    const r4 = await placeOrder(await checkoutInput({ phone: "01900000013" }), { cartId: cart4.id, userId: user2.id });
    expect(r4.ok && (await db.order.findUniqueOrThrow({ where: { id: r4.orderId } })).discountMinor).toBe(30000); // 10% of ৳3,280 capped at ৳300
    const cart3 = await makeCart(user.id, [{ variantId: rice.id, quantity: 2 }], "OLD50");
    expect(await placeOrder(await checkoutInput(), { cartId: cart3.id, userId: user.id })).toMatchObject({ ok: false, error: "promo_expired" });
  });

  it("will not let a guest check out someone else's cart", async () => {
    const rice = await variantOf("miniket-rice");
    const owner = await makeUser("01900000011");
    const cart = await makeCart(owner.id, [{ variantId: rice.id, quantity: 2 }]);
    expect(await placeOrder(await checkoutInput(), { cartId: cart.id, userId: null })).toMatchObject({ ok: false, error: "cart_empty" });
    const intruder = await makeUser("01900000012");
    expect(await placeOrder(await checkoutInput(), { cartId: cart.id, userId: intruder.id })).toMatchObject({ ok: false, error: "cart_empty" });
  });
});

describe("fulfilment workflow", () => {
  async function order(slug: string, qty: number, phone: string, promo?: string) {
    const v = await variantOf(slug);
    const user = await makeUser(phone);
    const cart = await makeCart(user.id, [{ variantId: v.id, quantity: qty }], promo);
    const r = await placeOrder(await checkoutInput({ idempotencyKey: randomUUID(), phone }), { cartId: cart.id, userId: user.id });
    if (!r.ok) throw new Error(r.error);
    return { v, orderId: r.orderId, user };
  }

  it("cancellation releases stock, the slot and the payment", async () => {
    const { v, orderId, user } = await order("miniket-rice", 2, "01900000020");
    const mid = await stockOf(v.id);
    const o = await db.order.findUniqueOrThrow({ where: { id: orderId } });
    const slotMid = await db.deliverySlot.findUniqueOrThrow({ where: { id: o.slotId } });
    expect(await changeOrderStatus(orderId, "CANCELLED", user.id, "test", { asCustomer: true })).toEqual({ ok: true });
    const after = await stockOf(v.id);
    expect(mid.reserved - after.reserved).toBe(2);
    expect((await db.deliverySlot.findUniqueOrThrow({ where: { id: o.slotId } })).booked).toBe(slotMid.booked - 1);
    expect((await db.payment.findFirstOrThrow({ where: { orderId } })).status).toBe("CANCELLED");
    expect(await db.notification.count({ where: { userId: user.id } })).toBeGreaterThan(0);
  });

  it("customers cannot cancel once confirmed, and staff cannot move backwards", async () => {
    const { orderId, user } = await order("miniket-rice", 2, "01900000021");
    expect(await changeOrderStatus(orderId, "CONFIRMED", null)).toEqual({ ok: true });
    expect(await changeOrderStatus(orderId, "CANCELLED", user.id, undefined, { asCustomer: true })).toEqual({ ok: false, error: "invalid_transition" });
    expect(await changeOrderStatus(orderId, "PLACED", null)).toEqual({ ok: false, error: "invalid_transition" });
  });

  it("dispatch converts reservations into on-hand deductions; delivery marks COD paid", async () => {
    const { v, orderId } = await order("miniket-rice", 3, "01900000022");
    const mid = await stockOf(v.id);
    await changeOrderStatus(orderId, "CONFIRMED", null);
    expect(await changeOrderStatus(orderId, "OUT_FOR_DELIVERY", null)).toEqual({ ok: true });
    const after = await stockOf(v.id);
    expect(mid.onHand - after.onHand).toBe(3);
    expect(mid.reserved - after.reserved).toBe(3);
    expect(await changeOrderStatus(orderId, "DELIVERED", null)).toEqual({ ok: true });
    expect((await db.payment.findFirstOrThrow({ where: { orderId } })).status).toBe("PAID");
    expect((await db.order.findUniqueOrThrow({ where: { id: orderId }, include: { statusHistory: true } })).statusHistory.map((h) => h.status)).toEqual(["PLACED", "CONFIRMED", "OUT_FOR_DELIVERY", "DELIVERED"]);
  });

  it("sourced-to-order items need a batch before dispatch, and keep it for traceability", async () => {
    const { v, orderId } = await order("rui-rohu", 2, "01900000023");
    const o = await db.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
    expect(o.needsSourcing).toBe(true);
    await changeOrderStatus(orderId, "CONFIRMED", null);
    expect(await changeOrderStatus(orderId, "OUT_FOR_DELIVERY", null)).toEqual({ ok: false, error: "unallocated" });
    const batch = await db.batch.findFirstOrThrow({ where: { productId: v.productId } });
    const wrongBatch = await db.batch.findFirstOrThrow({ where: { productId: { not: v.productId } } });
    expect(await allocateSourcedBatch(o.items[0].id, wrongBatch.id)).toMatchObject({ ok: false });
    expect(await allocateSourcedBatch(o.items[0].id, batch.id)).toEqual({ ok: true });
    expect(await changeOrderStatus(orderId, "OUT_FOR_DELIVERY", null)).toEqual({ ok: true });
    const alloc = await db.orderItemAllocation.findFirstOrThrow({ where: { orderItemId: o.items[0].id } });
    expect(alloc).toMatchObject({ batchId: batch.id, quantity: 2, fulfilled: true });
  });
});
