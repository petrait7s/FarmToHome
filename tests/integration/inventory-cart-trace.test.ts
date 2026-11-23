import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { adjustStock, StockError } from "@/server/inventory/stock";
import { availableByVariant } from "@/server/inventory/availability";
import { addLinesToCart, loadCart, setCartQuantity } from "@/server/cart";
import { getBatchJourney } from "@/server/traceability";
import { rateLimit } from "@/server/rate-limit";
import { setPaymentStatus } from "@/server/payments";
import { productsForMarket, searchProducts } from "@/server/catalog";
import { makeCart, stockOf, variantOf } from "../support/factories";

describe("inventory movements", () => {
  it("records every adjustment and never lets on-hand drop below reserved", async () => {
    const oil = await variantOf("cold-pressed-mustard-oil");
    const inv = await db.inventory.findFirstOrThrow({ where: { variantId: oil.id } });
    const admin = await db.user.findFirstOrThrow({ where: { role: "ADMIN" } });
    const before = await stockOf(oil.id);
    await db.$transaction((tx) => adjustStock(tx, { variantId: oil.id, batchId: inv.batchId, type: "DAMAGED", quantity: 2, reason: "test", actorId: admin.id }));
    expect((await stockOf(oil.id)).onHand).toBe(before.onHand - 2);
    const m = await db.inventoryMovement.findFirstOrThrow({ where: { variantId: oil.id, type: "DAMAGED" }, orderBy: { createdAt: "desc" } });
    expect(m).toMatchObject({ quantity: -2, onHandAfter: before.onHand - 2, actorId: admin.id });

    await db.inventory.update({ where: { id: inv.id }, data: { reserved: inv.onHand - 2 } });
    await expect(db.$transaction((tx) => adjustStock(tx, { variantId: oil.id, batchId: inv.batchId, type: "EXPIRED", quantity: 5, reason: "test", actorId: admin.id }))).rejects.toBeInstanceOf(StockError);
    await db.inventory.update({ where: { id: inv.id }, data: { reserved: inv.reserved } });
  });

  it("treats sourced-to-order variants as unlimited and sums batches for stock variants", async () => {
    const rui = await variantOf("rui-rohu");
    const rice = await variantOf("miniket-rice");
    const a = await availableByVariant([rui.id, rice.id]);
    expect(a.get(rui.id)).toBeNull();
    const s = await stockOf(rice.id);
    expect(a.get(rice.id)).toBe(s.onHand - s.reserved);
  });
});

describe("cart", () => {
  it("validates quantities against stock and product state", async () => {
    const ghee = await variantOf("pure-cow-ghee", 1);
    const cart = await makeCart(null, []);
    const avail = (await availableByVariant([ghee.id])).get(ghee.id) as number;
    expect(await setCartQuantity(cart.id, ghee.id, 1)).toBeNull();
    expect(await setCartQuantity(cart.id, ghee.id, avail + 1)).toMatchObject({ error: avail + 1 > 30 ? "limit" : "out_of_stock" });
    expect(await setCartQuantity(cart.id, ghee.id, 0)).toBeNull();
    expect((await loadCart(cart.id)).lines).toHaveLength(0);
  });

  it("skips archived products when repeating a saved list", async () => {
    const rice = await variantOf("miniket-rice");
    const atta = await variantOf("lal-atta");
    await db.product.update({ where: { id: atta.productId }, data: { status: "ARCHIVED" } });
    const cart = await makeCart(null, []);
    const r = await addLinesToCart(cart.id, [{ variantId: rice.id, quantity: 1 }, { variantId: atta.id, quantity: 1 }], "replace");
    await db.product.update({ where: { id: atta.productId }, data: { status: "ACTIVE" } });
    expect(r).toEqual({ added: 1, skipped: 1 });
  });

  it("computes cart totals from current prices", async () => {
    const rice = await variantOf("miniket-rice");
    const cart = await makeCart(null, [{ variantId: rice.id, quantity: 2 }]);
    const view = await loadCart(cart.id);
    expect(view.subtotalMinor).toBe(rice.priceMinor * 2);
    expect(view.itemCount).toBe(2);
  });
});

describe("catalogue and search", () => {
  it("separates weekly and monthly assortments", async () => {
    const weekly = await productsForMarket(["WEEKLY", "BOTH"]);
    const monthly = await productsForMarket(["MONTHLY", "BOTH"]);
    expect(weekly.some((p) => p.slug === "rui-rohu")).toBe(true);
    expect(monthly.some((p) => p.slug === "rui-rohu")).toBe(false);
    expect(monthly.some((p) => p.slug === "lal-atta")).toBe(true);
  });
  it("searches by district and filters by category", async () => {
    const r = await searchProducts({ q: "bogura" });
    expect(r.items.map((p) => p.slug).sort()).toEqual(["bogura-mishti-doi", "red-chili-powder"]);
    const c = await searchProducts({ category: "pulses-lentils" });
    expect(c.items.every((p) => p.categorySlug === "pulses-lentils")).toBe(true);
    const sorted = await searchProducts({ sort: "price_asc", pageSize: 48 });
    const mins = sorted.items.map((p) => Math.min(...p.variants.map((v) => v.priceMinor)));
    expect([...mins].sort((a, b) => a - b)).toEqual(mins);
  });
});

describe("traceability", () => {
  it("reports missing stages as not recorded instead of inventing them", async () => {
    const batch = await db.batch.findFirstOrThrow({ where: { product: { slug: "rui-rohu" } } });
    const j = await getBatchJourney(batch.batchNumber.toLowerCase());
    expect(j).not.toBeNull();
    const byKey = Object.fromEntries(j!.stages.map((s) => [s.key, s]));
    expect(byKey.source.recorded).toBe(true);
    expect(byKey.inspection.recorded).toBe(true);
    expect(byKey.packaging.recorded).toBe(false);
    expect(byKey.farmtohome.recorded).toBe(false);
  });
  it("returns null for unknown batches", async () => {
    expect(await getBatchJourney("FTH-NOPE-000000-0000")).toBeNull();
  });
});

describe("rate limiting and payments", () => {
  it("blocks after the limit within the window", async () => {
    const key = `test:${Date.now()}`;
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await rateLimit(key, 3, 60));
    expect(results).toEqual([true, true, true, false]);
  });
  it("only allows valid payment transitions and records events", async () => {
    const p = await db.payment.findFirst({ where: { status: "PENDING" } });
    if (!p) return;
    expect(await setPaymentStatus(p.id, "REFUNDED", "invalid")).toBe(false);
    expect(await setPaymentStatus(p.id, "FAILED", "test failure")).toBe(true);
    expect(await setPaymentStatus(p.id, "PENDING", "retry")).toBe(true);
    expect(await db.paymentEvent.count({ where: { paymentId: p.id } })).toBeGreaterThanOrEqual(3);
  });
});
