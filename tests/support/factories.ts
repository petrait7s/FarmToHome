import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { availableSlots } from "@/server/delivery";
import type { CheckoutInput } from "@/server/orders/place";

export async function variantOf(productSlug: string, index = 0) {
  return db.productVariant.findFirstOrThrow({ where: { product: { slug: productSlug } }, orderBy: { position: "asc" }, skip: index });
}

export async function stockOf(variantId: string) {
  const rows = await db.inventory.findMany({ where: { variantId } });
  return { onHand: rows.reduce((s, r) => s + r.onHand, 0), reserved: rows.reduce((s, r) => s + r.reserved, 0) };
}

export async function makeUser(phone: string) {
  return db.user.upsert({ where: { phone }, update: {}, create: { phone, name: `Test ${phone}`, passwordHash: "x", profile: { create: {} } } });
}

export async function makeCart(userId: string | null, items: { variantId: string; quantity: number }[], promoCode?: string) {
  return db.cart.create({ data: { userId, promoCode: promoCode ?? null, items: { create: items } } });
}

export async function pilotZone() {
  return db.deliveryZone.findFirstOrThrow({ where: { areas: { has: "Gulshan" } } });
}

export async function openSlot(minRemaining = 1) {
  const zone = await pilotZone();
  const slots = await availableSlots(zone.id);
  const slot = slots.find((s) => s.remaining >= minRemaining);
  if (!slot) throw new Error("no open slot in test data");
  return slot;
}

export async function checkoutInput(overrides: Partial<CheckoutInput> = {}): Promise<CheckoutInput> {
  const slot = await openSlot();
  return {
    idempotencyKey: randomUUID(),
    name: "Test Household",
    phone: "01811111111",
    email: undefined,
    addressId: undefined,
    division: "Dhaka",
    district: "Dhaka",
    area: "Gulshan",
    line1: "House 9, Road 3, Gulshan 1",
    landmark: undefined,
    instructions: undefined,
    slotId: slot.id,
    paymentMethod: "CASH_ON_DELIVERY",
    note: undefined,
    saveAddress: false,
    ...overrides,
  };
}
