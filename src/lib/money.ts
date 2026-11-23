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
