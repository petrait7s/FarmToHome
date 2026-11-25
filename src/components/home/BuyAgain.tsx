"use client";

import Link from "next/link";
import type { ProductDTO } from "@/server/catalog";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { QuantityStepper } from "@/components/market/QuantityStepper";
import { Icon } from "@/components/ui/Icon";
import { useCart } from "@/components/store/CartProvider";
import { useI18n } from "@/i18n/client";
import { localized } from "@/i18n/shared";
import { formatMoney } from "@/lib/money";
import styles from "./ReorderRow.module.css";

/** Compact rows for products from recent orders, in the size bought last time. */
export function BuyAgain({ items }: { items: { product: ProductDTO; variantId: string }[] }) {
  const { t, locale } = useI18n();
  const cart = useCart();
  return (
    <ul className={styles.list}>
      {items.map(({ product, variantId }) => {
        const v = product.variants.find((x) => x.id === variantId) ?? product.variants[0];
        if (!v) return null;
        const name = localized(product, "name", locale);
        const size = locale === "bn" && v.labelBn ? v.labelBn : v.label;
        const qty = cart.qtyOf(v.id);
        const soldOut = v.available !== null && v.available <= 0;
        return (
          <li key={product.id} className={styles.item}>
            <Link href={`/products/${product.slug}`} className={styles.thumb} tabIndex={-1} aria-hidden="true">
              <ProductVisual artKey={product.artKey} imageUrl={product.imageUrl} alt="" size="sm" />
            </Link>
            <span className={styles.itemText}>
              <Link href={`/products/${product.slug}`} className={styles.itemName}>{name}</Link>
              <span className={styles.itemMeta}>{size} · {formatMoney(v.priceMinor, locale)}</span>
            </span>
            {soldOut ? (
              <span className="badge badge-line">{t("market.outOfStock")}</span>
            ) : qty > 0 ? (
              <QuantityStepper name={name} quantity={qty} max={v.available} onChange={(n) => void cart.setQuantity(v.id, n)} />
            ) : (
              <button type="button" className={styles.add} onClick={() => void cart.setQuantity(v.id, 1)} aria-label={t("market.addTo", { name, size })}>
                <Icon name="plus" size={15} strokeWidth={2.2} />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
