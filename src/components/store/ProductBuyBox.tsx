"use client";

import { useState } from "react";
import type { ProductDTO } from "@/server/catalog";
import { QuantityStepper } from "@/components/market/QuantityStepper";
import { Icon } from "@/components/ui/Icon";
import { useCart } from "./CartProvider";
import { useI18n } from "@/i18n/client";
import { formatMoney, unitPrice } from "@/lib/money";
import { localized } from "@/i18n/shared";
import styles from "./ProductBuyBox.module.css";

export function ProductBuyBox({ product }: { product: ProductDTO }) {
  const { t, locale } = useI18n();
  const cart = useCart();
  const inCart = product.variants.find((v) => cart.qtyOf(v.id) > 0);
  const [selected, setSelected] = useState(inCart?.id ?? product.variants[0]?.id);
  const variant = product.variants.find((v) => v.id === (inCart?.id ?? selected)) ?? product.variants[0];
  const [qty, setQty] = useState(1);
  if (!variant) return <p>{t("product.unavailable")}</p>;
  const name = localized(product, "name", locale);
  const inCartQty = cart.qtyOf(variant.id);
  const soldOut = variant.available !== null && variant.available <= 0;
  const low = variant.available !== null && variant.available > 0 && variant.available <= 5;

  return (
    <div className={styles.box}>
      <div className={styles.sizes} role="radiogroup" aria-label={t("product.sizes")}>
        {product.variants.map((v) => (
          <button key={v.id} type="button" role="radio" aria-checked={v.id === variant.id} className={styles.size}
            onClick={() => { if (inCart && inCart.id !== v.id) void cart.swap(inCart.id, v.id); setSelected(v.id); }}>
            <span>{locale === "bn" && v.labelBn ? v.labelBn : v.label}</span>
            <span className={styles.sizePrice}>{formatMoney(v.priceMinor, locale)}</span>
          </button>
        ))}
      </div>
      <div className={styles.priceRow}>
        <p className={styles.price}>{formatMoney(variant.priceMinor, locale)}</p>
        <p className={styles.unit}>{unitPrice(variant.priceMinor, variant.netQuantity, variant.unit, locale)}</p>
      </div>
      <p className={styles.avail}>
        <span className={`dot ${soldOut ? "" : "sky"}`} aria-hidden="true" />
        {soldOut ? t("market.outOfStock") : variant.fulfillmentMode === "SOURCED_TO_ORDER" ? t("market.sourcedToOrder") : low ? t("market.lowStock", { n: variant.available ?? 0 }) : t("product.available")}
      </p>
      {soldOut ? null : inCartQty > 0 ? (
        <div className={styles.inCart}>
          <span className={styles.inCartLabel}><Icon name="check" size={16} /> {t("product.inMarket")}</span>
          <QuantityStepper name={name} quantity={inCartQty} max={variant.available} onChange={(n) => void cart.setQuantity(variant.id, n)} />
        </div>
      ) : (
        <div className={styles.addRow}>
          <QuantityStepper name={name} quantity={qty} tone="line" max={variant.available} onChange={(n) => setQty(Math.max(1, n))} />
          <button type="button" className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={() => void cart.setQuantity(variant.id, qty)}>
            <Icon name="plus" /> {t("product.addToMarket")}
          </button>
        </div>
      )}
    </div>
  );
}
