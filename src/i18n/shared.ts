import type { en } from "./en";
import { toBanglaDigits } from "@/lib/money";

export const LOCALE_COOKIE = "fth_lang";
export type Locale = "en" | "bn";
export type Dict = typeof en;

export function isLocale(v: unknown): v is Locale {
  return v === "en" || v === "bn";
}

/** Look up a dotted key ("nav.home") and interpolate {vars}. Falls back to the key itself. */
export function translate(dict: Dict, key: string, vars?: Record<string, string | number>): string {
  let node: unknown = dict;
  for (const part of key.split(".")) {
    if (node && typeof node === "object" && part in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[part];
    } else {
      node = undefined;
      break;
    }
  }
  let text = typeof node === "string" ? node : key;
  if (vars) {
    const bn = dict.meta.locale === "bn";
    for (const [k, v] of Object.entries(vars)) {
      const value = typeof v === "number" && bn ? toBanglaDigits(String(v)) : String(v);
      text = text.replaceAll(`{${k}}`, value);
    }
  }
  return text;
}

/** Pick the Bangla column when the locale is Bangla and a translation exists. */
export function localized<T extends Record<string, unknown>>(row: T, field: keyof T & string, locale: Locale): string {
  if (locale === "bn") {
    const bnValue = row[`${field}Bn` as keyof T];
    if (typeof bnValue === "string" && bnValue.trim()) return bnValue;
  }
  const value = row[field];
  return typeof value === "string" ? value : "";
}
