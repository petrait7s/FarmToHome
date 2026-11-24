"use client";

import Link from "next/link";
import type { Mode, ProductDTO } from "./types";
import { formatAmount, householdNeed } from "./types";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { OriginSeal } from "@/components/ui/OriginSeal";
import { Icon } from "@/components/ui/Icon";
import { QuantityStepper } from "./QuantityStepper";
import { useI18n } from "@/i18n/client";
import { formatMoney, unitPrice, toBanglaDigits } from "@/lib/money";
import { localized } from "@/i18n/shared";
import styles from "./MarketBuilder.module.css";

type Props = {
  product: ProductDTO;
  mode: Mode;
  household: number;
  selectedVariantId: string;
  inCartVariantId: string | null;
  quantity: number;
  onSelect: (variantId: string) => void;
  onAdd: (variantId: string, el: HTMLElement) => void;
  onQuantity: (variantId: string, quantity: number) => void;
  onOrigin: () => void;
};

export function MarketRow({ product, mode, household, selectedVariantId, inCartVariantId, quantity, onSelect, onAdd, onQuantity, onOrigin }: Props) {
  const { t, locale } = useI18n();
  const variant = product.variants.find((v) => v.id === (inCartVariantId ?? selectedVariantId)) ?? product.variants[0];
  const name = localized(product, "name", locale);
  const need = householdNeed(product, household, mode);
  const soldOut = variant.available !== null && variant.available <= 0;
  const low = variant.available !== null && variant.available > 0 && variant.available <= 5;
  const num = (s: string) => (locale === "bn" ? toBanglaDigits(s) : s);

  return (
    <article className={`${styles.row} ${inCartVariantId ? styles.rowIn : ""}`}>
      <Link href={`/products/${product.slug}`} className={styles.thumb} tabIndex={-1} aria-hidden="true">
        <ProductVisual artKey={product.artKey} imageUrl={product.imageUrl} alt="" size="md" />
      </Link>
      <div className={styles.info}>
        <p className={`eyebrow ${styles.rowEyebrow}`}>
          {product.originDistrict} <OriginSeal cls={product.originClass} /> {product.grade}
        </p>
        <h3 className={styles.pname}><Link href={`/products/${product.slug}`}>{name}</Link></h3>
        <p className={styles.pdesc}>{localized(product, "summary", locale)}</p>
        <div className={styles.tags}>
          {product.isNew ? <span className={styles.tag}><span className="dot" aria-hidden="true" />{t("market.freshThisWeek")}</span> : null}
          {product.isSeasonal ? <span className={styles.tag}><span className="dot gold" aria-hidden="true" />{t("market.inSeason")}</span> : null}
          {product.isPerishable ? <span className={styles.tag}><span className="dot sky" aria-hidden="true" />{t("market.packedOnIce")}</span> : null}
          {variant.fulfillmentMode === "SOURCED_TO_ORDER" ? <span className={styles.tag}><Icon name="truck" size={14} />{t("market.sourcedToOrder")}</span> : null}
          <button type="button" className={styles.originLink} onClick={onOrigin}><Icon name="pin" size={14} />{t("market.knowOrigin")}</button>
        </div>
      </div>
      <div className={styles.buy}>
        <div className={styles.sizes} role="radiogroup" aria-label={`${name} — ${t("product.sizes")}`}>
          {product.variants.map((v) => (
            <button key={v.id} type="button" role="radio" aria-checked={v.id === variant.id} className={styles.size} onClick={() => onSelect(v.id)}>
              {num(locale === "bn" && v.labelBn ? v.labelBn : v.label)}
            </button>
          ))}
        </div>
        {need && product.householdUseUnit ? (
          <p className={styles.hint}><span className="dot gold" aria-hidden="true" />{t("market.hint", { qty: num(formatAmount(need, product.householdUseUnit)), period: mode === "MONTHLY" ? t("market.perMonth") : t("market.perWeek"), n: household })}</p>
        ) : null}
        <div className={styles.buyLine}>
          <p className={styles.price}>
            {formatMoney(variant.priceMinor, locale)}
            <small>{low ? t("market.lowStock", { n: variant.available ?? 0 }) : unitPrice(variant.priceMinor, variant.netQuantity, variant.unit, locale)}</small>
          </p>
          {soldOut ? (
            <span className="badge badge-line">{t("market.outOfStock")}</span>
          ) : inCartVariantId ? (
            <QuantityStepper name={name} quantity={quantity} max={variant.available} onChange={(n) => onQuantity(variant.id, n)} />
          ) : (
            <button type="button" className={styles.add} onClick={(e) => onAdd(variant.id, e.currentTarget)} aria-label={t("market.addTo", { name, size: variant.label })}>
              <Icon name="plus" size={14} strokeWidth={2.4} />{t("common.add")}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
