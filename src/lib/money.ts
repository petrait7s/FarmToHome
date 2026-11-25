/** Money is stored as integer minor units (poisha). 100 poisha = 1 BDT. */

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export function toBanglaDigits(input: string): string {
  return input.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

export function formatMoney(minor: number, locale: "en" | "bn" = "en"): string {
  const taka = minor / 100;
  const hasFraction = Math.round(taka) !== taka;
  const formatted = taka.toLocaleString("en-IN", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  });
  const text = `৳ ${formatted}`;
  return locale === "bn" ? toBanglaDigits(text) : text;
}

export function formatNumber(n: number, locale: "en" | "bn" = "en"): string {
  const text = n.toLocaleString("en-IN");
  return locale === "bn" ? toBanglaDigits(text) : text;
}

export function takaToMinor(taka: number): number {
  return Math.round(taka * 100);
}

/** Per-unit price label, e.g. "৳ 84 / kg". */
export function unitPrice(priceMinor: number, netQuantity: number, unit: string, locale: "en" | "bn" = "en") {
  if (!netQuantity) return "";
  const u = unit === "g" ? "kg" : unit === "ml" ? "L" : unit;
  const qty = unit === "g" || unit === "ml" ? netQuantity / 1000 : netQuantity;
  return `${formatMoney(Math.round(priceMinor / qty), locale)} / ${u}`;
}

/** Price per base unit (kg, L or the unit itself) in minor units, for comparing pack sizes. */
export function perBaseUnit(priceMinor: number, netQuantity: number, unit: string): { minor: number; unit: string } | null {
  if (!netQuantity) return null;
  const base = unit === "g" ? "kg" : unit === "ml" ? "L" : unit;
  const qty = unit === "g" || unit === "ml" ? netQuantity / 1000 : netQuantity;
  return { minor: priceMinor / qty, unit: base };
}

/**
 * Saving per base unit of one pack against the dearest comparable pack (same base unit).
 * Returns null when there is nothing to compare or no saving. Calculated only from listed prices.
 */
export function packSaving<V extends { priceMinor: number; netQuantity: number; unit: string; label: string }>(variant: V, all: V[]): { perUnitMinor: number; unit: string; against: V } | null {
  const mine = perBaseUnit(variant.priceMinor, variant.netQuantity, variant.unit);
  if (!mine || mine.unit === "pc") return null;
  let dearest: { v: V; minor: number } | null = null;
  for (const v of all) {
    if (v === variant) continue;
    const p = perBaseUnit(v.priceMinor, v.netQuantity, v.unit);
    if (!p || p.unit !== mine.unit) continue;
    if (!dearest || p.minor > dearest.minor) dearest = { v, minor: p.minor };
  }
  if (!dearest) return null;
  const saving = Math.round(dearest.minor - mine.minor);
  return saving >= 100 ? { perUnitMinor: saving, unit: mine.unit, against: dearest.v } : null;
}
