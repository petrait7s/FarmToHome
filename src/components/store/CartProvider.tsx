"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { CartView } from "@/server/cart";
import { useI18n } from "@/i18n/client";
import { useToast } from "@/components/ui/Toast";

type CartOp =
  | { op: "set"; variantId: string; quantity: number }
  | { op: "swap"; fromVariantId: string; toVariantId: string }
  | { op: "clear" }
  | { op: "mode"; mode: "WEEKLY" | "MONTHLY" | "CUSTOM" }
  | { op: "bulk"; mode: "merge" | "replace"; lines: { variantId: string; quantity: number }[] };

type Ctx = {
  cart: CartView;
  pending: boolean;
  /** Optimistic quantity for a variant (what the UI should display). */
  qtyOf: (variantId: string) => number;
  setQuantity: (variantId: string, quantity: number) => Promise<boolean>;
  swap: (fromVariantId: string, toVariantId: string) => Promise<boolean>;
  clear: () => Promise<boolean>;
  setMode: (mode: "WEEKLY" | "MONTHLY" | "CUSTOM") => Promise<boolean>;
  bulk: (mode: "merge" | "replace", lines: { variantId: string; quantity: number }[]) => Promise<{ added: number; skipped: number } | null>;
  replaceCart: (cart: CartView) => void;
};

const CartContext = createContext<Ctx | null>(null);

export function CartProvider({ initial, children }: { initial: CartView; children: React.ReactNode }) {
  const [cart, setCart] = useState<CartView>(initial);
  const [optimistic, setOptimistic] = useState<Record<string, number>>({});
  const [inflight, setInflight] = useState(0);
  const chain = useRef<Promise<unknown>>(Promise.resolve());
  const { t } = useI18n();
  const toast = useToast();

  const send = useCallback(
    (payload: CartOp): Promise<{ ok: boolean; result?: { added: number; skipped: number } }> => {
      const run = async () => {
        setInflight((n) => n + 1);
        try {
          const res = await fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await res.json().catch(() => null);
          if (data?.cart) setCart(data.cart);
          if (!res.ok || !data?.ok) {
            const code = data?.error as string | undefined;
            if (code === "out_of_stock") toast.show(t("errors.out_of_stock", { name: data.name ?? "" }));
            else if (code === "unavailable") toast.show(t("errors.unavailable", { name: data.name ?? "" }));
            else if (code === "limit") toast.show(t("market.limitReached"));
            else if (code === "too_many") toast.show(t("errors.too_many"));
            else toast.show(t("errors.generic"));
            return { ok: false };
          }
          return { ok: true, result: data.result };
        } catch {
          toast.show(t("errors.generic"));
          return { ok: false };
        } finally {
          setInflight((n) => n - 1);
        }
      };
      const next = chain.current.then(run, run);
      chain.current = next;
      return next;
    },
    [t, toast],
  );

  const qtyOf = useCallback(
    (variantId: string) => {
      if (variantId in optimistic) return optimistic[variantId];
      return cart.lines.find((l) => l.variantId === variantId)?.quantity ?? 0;
    },
    [optimistic, cart.lines],
  );

  const setQuantity = useCallback(
    async (variantId: string, quantity: number) => {
      setOptimistic((o) => ({ ...o, [variantId]: quantity }));
      const r = await send({ op: "set", variantId, quantity });
      setOptimistic((o) => {
        const { [variantId]: _drop, ...rest } = o;
        return rest;
      });
      return r.ok;
    },
    [send],
  );

  const value = useMemo<Ctx>(
    () => ({
      cart,
      pending: inflight > 0,
      qtyOf,
      setQuantity,
      swap: async (fromVariantId, toVariantId) => (await send({ op: "swap", fromVariantId, toVariantId })).ok,
      clear: async () => (await send({ op: "clear" })).ok,
      setMode: async (mode) => (await send({ op: "mode", mode })).ok,
      bulk: async (mode, lines) => {
        const r = await send({ op: "bulk", mode, lines });
        return r.ok ? r.result ?? { added: 0, skipped: 0 } : null;
      },
      replaceCart: setCart,
    }),
    [cart, inflight, qtyOf, setQuantity, send],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): Ctx {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
