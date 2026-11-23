"use client";

import { createContext, useContext, useMemo } from "react";
import { translate, type Dict, type Locale } from "./shared";

type Ctx = { locale: Locale; t: (key: string, vars?: Record<string, string | number>) => string };

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ locale, dict, children }: { locale: Locale; dict: Dict; children: React.ReactNode }) {
  const value = useMemo<Ctx>(() => ({ locale, t: (key, vars) => translate(dict, key, vars) }), [locale, dict]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
