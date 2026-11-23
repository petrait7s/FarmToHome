"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { repeatMarket } from "@/app/actions/markets";
import { useCart } from "@/components/store/CartProvider";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/i18n/client";
import { Icon } from "@/components/ui/Icon";

export function RepeatButtons({ id, name }: { id: string; name: string }) {
  const { t } = useI18n();
  const cart = useCart();
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (mode: "replace" | "merge") =>
    start(async () => {
      const r = await repeatMarket({ id, mode });
      if (!r.ok) { toast.show(t("errors.generic")); return; }
      cart.replaceCart(r.cart);
      toast.show(r.skipped ? t("saved.unavailable", { n: r.skipped }) : t("saved.loaded", { name }));
      router.push("/basket");
    });
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <button type="button" className="btn btn-sm" disabled={pending} onClick={() => run("merge")}>{t("saved.addToBasket")}</button>
      <button type="button" className="btn btn-primary btn-sm" disabled={pending} onClick={() => run("replace")}><Icon name="repeat" size={15} />{t("saved.repeat")}</button>
    </div>
  );
}
