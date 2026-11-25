import { describe, expect, it } from "vitest";
import { applicableStages, canTransition, customerCanCancel, nextStatuses } from "@/server/orders/workflow";
import { bdPhone } from "@/lib/validation";
import { formatMoney, packSaving, toBanglaDigits, unitPrice } from "@/lib/money";
import { slotTime } from "@/lib/slots";
import { householdNeed, suggestPick } from "@/components/market/types";
import { parseArtKey, artSvg } from "@/components/ui/productArt";
import type { ProductDTO } from "@/server/catalog";
import { en } from "@/i18n/en";
import { bn } from "@/i18n/bn";
import { translate } from "@/i18n/shared";

describe("order workflow", () => {
  it("skips sourcing stages for in-stock orders", () => {
    expect(applicableStages(false)).not.toContain("PROCUREMENT");
    expect(applicableStages(true)).toContain("QUALITY_CHECK");
  });
  it("only moves forward, and allows cancelling before dispatch", () => {
    expect(canTransition("CONFIRMED", "PLACED", false)).toBe(false);
    expect(canTransition("PLACED", "CONFIRMED", false)).toBe(true);
    expect(canTransition("PLACED", "PROCUREMENT", false)).toBe(false);
    expect(nextStatuses("PACKAGING", false)).toContain("CANCELLED");
    expect(nextStatuses("OUT_FOR_DELIVERY", false)).toEqual(["DELIVERED"]);
    expect(nextStatuses("DELIVERED", true)).toEqual([]);
  });
  it("lets customers cancel only before confirmation", () => {
    expect(customerCanCancel("PLACED")).toBe(true);
    expect(customerCanCancel("CONFIRMED")).toBe(false);
  });
});

describe("validation and formatting", () => {
  it("normalises Bangladesh mobile numbers", () => {
    expect(bdPhone.parse("+8801712345678")).toBe("01712345678");
    expect(bdPhone.parse("017-1234 5678")).toBe("01712345678");
    expect(bdPhone.safeParse("01212345678").success).toBe(false);
    expect(bdPhone.safeParse("12345").success).toBe(false);
  });
  it("formats taka in English and Bangla digits", () => {
    expect(formatMoney(125000)).toBe("৳ 1,250");
    expect(formatMoney(125050)).toBe("৳ 1,250.50");
    expect(formatMoney(125000, "bn")).toBe("৳ ১,২৫০");
    expect(toBanglaDigits("2026")).toBe("২০২৬");
    expect(unitPrice(42000, 5, "kg")).toBe("৳ 84 / kg");
    expect(unitPrice(38000, 500, "g")).toBe("৳ 760 / kg");
  });
});

describe("household suggestions", () => {
  const rice = {
    householdUsePerPersonWeek: 1.5, householdUseUnit: "kg",
    variants: [
      { id: "a", label: "5 kg", labelBn: null, netQuantity: 5, unit: "kg", priceMinor: 42000, fulfillmentMode: "STOCK", available: 10 },
      { id: "b", label: "10 kg", labelBn: null, netQuantity: 10, unit: "kg", priceMinor: 82000, fulfillmentMode: "STOCK", available: 10 },
      { id: "c", label: "25 kg", labelBn: null, netQuantity: 25, unit: "kg", priceMinor: 199000, fulfillmentMode: "STOCK", available: 10 },
    ],
  } as unknown as ProductDTO;
  it("computes weekly and monthly need", () => {
    expect(householdNeed(rice, 4, "WEEKLY")).toBe(6);
    expect(householdNeed(rice, 4, "MONTHLY")).toBeCloseTo(25.8);
  });
  it("picks the pack combination closest to the need", () => {
    expect(suggestPick(rice, 4, "WEEKLY")).toMatchObject({ variant: { id: "a" }, quantity: 1 });
    expect(suggestPick(rice, 4, "MONTHLY")).toMatchObject({ variant: { id: "c" }, quantity: 1 });
    expect(suggestPick(rice, 8, "WEEKLY")).toMatchObject({ variant: { id: "b" }, quantity: 1 });
  });
});

describe("product art fallback", () => {
  it("only accepts whitelisted types and bounded variants", () => {
    expect(parseArtKey("rice:2")).toEqual(["rice", 2]);
    expect(parseArtKey("<script>:99")).toEqual(["grain", 5]);
    expect(artSvg('"><img onerror=alert(1)>')).not.toContain("onerror");
  });
});

describe("i18n dictionaries", () => {
  const keys = (o: object, prefix = ""): string[] =>
    Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]));
  it("Bangla has every English key", () => {
    expect(keys(bn).sort()).toEqual(keys(en).sort());
  });
  it("interpolates and converts numbers to Bangla digits", () => {
    expect(translate(en, "common.products", { n: 3 })).toBe("3 products");
    expect(translate(bn, "common.products", { n: 3 })).toBe("৩টি পণ্য");
    expect(translate(en, "does.not.exist")).toBe("does.not.exist");
  });
});

describe("pack value comparison", () => {
  const v = (label: string, netQuantity: number, unit: string, priceMinor: number) => ({ label, netQuantity, unit, priceMinor });
  const small = v("500 g", 500, "g", 38000), big = v("1 kg", 1, "kg", 70000), pc = v("1 pc", 1, "pc", 5000);
  it("reports the saving per kg against the dearest comparable pack", () => {
    const s = packSaving(big, [small, big]);
    expect(s?.perUnitMinor).toBe(6000);
    expect(s?.unit).toBe("kg");
    expect(s?.against.label).toBe("500 g");
  });
  it("returns null for the dearest pack, pieces, or incomparable units", () => {
    expect(packSaving(small, [small, big])).toBeNull();
    expect(packSaving(pc, [pc, v("2 pc", 2, "pc", 9000)])).toBeNull();
    expect(packSaving(v("1 L", 1, "L", 20000), [v("1 L", 1, "L", 20000), small])).toBeNull();
  });
});

describe("slot time labels", () => {
  it("formats times in English and Bangla digits", () => {
    expect(slotTime({ startTime: "08:00", endTime: "10:30" }, "en")).toBe("8 AM – 10:30 AM");
    expect(slotTime({ startTime: "16:00", endTime: "18:00" }, "bn")).toBe("৪ PM – ৬ PM");
  });
});
