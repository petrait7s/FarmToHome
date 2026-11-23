"use client";

import Link from "next/link";
import { useState } from "react";
import type { ProductDTO } from "@/server/catalog";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { OriginSeal } from "@/components/ui/OriginSeal";
import { Icon } from "@/components/ui/Icon";
import { QuantityStepper } from "@/components/market/QuantityStepper";
import { useCart } from "./CartProvider";
import { useI18n } from "@/i18n/client";
import { formatMoney } from "@/lib/money";
import { localized } from "@/i18n/shared";
import styles from "./ProductCard.module.css";

/** Editorial product card with inline size choice and add/stepper (no page navigation needed to buy). */
export function ProductCard({ product, priority }: { product: ProductDTO; priority?: boolean }) {
  const { t, locale } = useI18n();
  const cart = useCart();
  const inCart = product.variants.find((v) => cart.qtyOf(v.id) > 0);
  const [selected, setSelected] = useState(inCart?.id ?? product.variants[0]?.id);
  const variant = product.variants.find((v) => v.id === (inCart?.id ?? selected)) ?? product.variants[0];
  if (!variant) return null;
  const qty = cart.qtyOf(variant.id);
  const name = localized(product, "name", locale);
  const soldOut = variant.available !== null && variant.available <= 0;

  const chooseSize = (id: string) => {
    if (inCart && inCart.id !== id) void cart.swap(inCart.id, id);
    setSelected(id);
  };

  return (
    <article className={styles.card}>
      <Link href={`/products/${product.slug}`} className={styles.media} aria-label={name}>
        <ProductVisual artKey={product.artKey} imageUrl={product.imageUrl} alt={name} size="lg" priority={priority} />
        <span className={styles.tags}>
          {product.isNew ? <span className="badge badge-red"><span className="dot" aria-hidden="true" />{t("market.freshThisWeek")}</span> : null}
          {product.isSeasonal ? <span className="badge"><span className="dot gold" aria-hidden="true" />{t("market.inSeason")}</span> : null}
        </span>
      </Link>
      <div className={styles.body}>
        <p className={`eyebrow ${styles.eyebrow}`}>
          {product.originDistrict ?? ""} <OriginSeal cls={product.originClass} />
          {product.isDemo ? <span className="demo-tag">{t("common.demo")}</span> : null}
        </p>
        <h3 className={styles.name}><Link href={`/products/${product.slug}`}>{name}</Link></h3>
        <p className={styles.summary}>{localized(product, "summary", locale)}</p>
        {product.variants.length > 1 ? (
          <div className={styles.sizes} role="radiogroup" aria-label={`${name} — ${t("product.sizes")}`}>
            {product.variants.map((v) => (
              <button key={v.id} type="button" role="radio" aria-checked={v.id === variant.id} className={styles.size} onClick={() => chooseSize(v.id)}>
                {locale === "bn" && v.labelBn ? v.labelBn : v.label}
              </button>
            ))}
          </div>
        ) : (
          <p className={styles.single}>{variant.label}</p>
        )}
        <div className={styles.buy}>
          <span className={styles.price}>{formatMoney(variant.priceMinor, locale)}</span>
          {soldOut ? (
            <span className="badge badge-line">{t("market.outOfStock")}</span>
          ) : qty > 0 ? (
            <QuantityStepper name={name} quantity={qty} max={variant.available} onChange={(n) => void cart.setQuantity(variant.id, n)} />
          ) : (
            <button type="button" className={styles.add} onClick={() => void cart.setQuantity(variant.id, 1)} aria-label={t("market.addTo", { name, size: variant.label })}>
              <Icon name="plus" size={15} strokeWidth={2.2} /> {t("common.add")}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
