import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { en } from "./en";
import { bn } from "./bn";
import { LOCALE_COOKIE, type Locale, type Dict, translate, isLocale } from "./shared";

export { LOCALE_COOKIE, type Locale, type Dict };

const dictionaries: Record<Locale, Dict> = { en, bn };

export const getLocale = cache(async (): Promise<Locale> => {
  const jar = await cookies();
  const value = jar.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : "en";
});

export function getDictionary(locale: Locale): Dict {
  return dictionaries[locale];
}

/** Server-side translator for the current request. */
export const getT = cache(async () => {
  const locale = await getLocale();
  const dict = dictionaries[locale];
  const t = (key: string, vars?: Record<string, string | number>) => translate(dict, key, vars);
  return { t, locale, dict };
});
