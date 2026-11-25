"use client";

import { useEffect, useRef, useState } from "react";
import type { ProductDTO } from "@/server/catalog";
import { QuantityStepper } from "@/components/market/QuantityStepper";
import { Icon } from "@/components/ui/Icon";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { useCart } from "./CartProvider";
import { useI18n } from "@/i18n/client";
import { formatMoney, packSaving, unitPrice } from "@/lib/money";
import { localized } from "@/i18n/shared";
import styles from "./ProductBuyBox.module.css";

export function ProductBuyBox({ product }: { product: ProductDTO }) {
  const { t, locale } = useI18n();
  const cart = useCart();
  const inCart = product.variants.find((v) => cart.qtyOf(v.id) > 0);
  const [selected, setSelected] = useState(inCart?.id ?? product.variants[0]?.id);
  const variant = product.variants.find((v) => v.id === (inCart?.id ?? selected)) ?? product.variants[0];
  const [qty, setQty] = useState(1);
  const boxRef = useRef<HTMLDivElement>(null);
  const [showBar, setShowBar] = useState(false);

  // Show the sticky bar once the buy box has scrolled up out of view (not before the reader reaches it).
  useEffect(() => {
    let frame = 0;
    const check = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = boxRef.current;
        if (el) setShowBar(el.getBoundingClientRect().bottom < 0);
      });
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  if (!variant) return <p>{t("product.unavailable")}</p>;
  const name = localized(product, "name", locale);
  const inCartQty = cart.qtyOf(variant.id);
  const soldOut = variant.available !== null && variant.available <= 0;
  const low = variant.available !== null && variant.available > 0 && variant.available <= 5;

  const sizeLabel = locale === "bn" && variant.labelBn ? variant.labelBn : variant.label;
  const add = () => void cart.setQuantity(variant.id, qty);

  return (
    <>
    <div className={styles.box} ref={boxRef}>
      <div className={styles.sizes} role="radiogroup" aria-label={t("product.sizes")}>
        {product.variants.map((v) => (
          <button key={v.id} type="button" role="radio" aria-checked={v.id === variant.id} className={styles.size}
            onClick={() => { if (inCart && inCart.id !== v.id) void cart.swap(inCart.id, v.id); setSelected(v.id); }}>
            <span>{locale === "bn" && v.labelBn ? v.labelBn : v.label}</span>
            <span className={styles.sizePrice}>{formatMoney(v.priceMinor, locale)}</span>
            {v.unit !== "pc" && product.variants.length > 1 ? <span className={styles.sizeUnit}>{unitPrice(v.priceMinor, v.netQuantity, v.unit, locale)}</span> : null}
          </button>
        ))}
      </div>
      <div className={styles.priceRow}>
        <p className={styles.price}>{formatMoney(variant.priceMinor, locale)}</p>
        <p className={styles.unit}>{unitPrice(variant.priceMinor, variant.netQuantity, variant.unit, locale)}</p>
      </div>
      {(() => {
        const save = packSaving(variant, product.variants);
        if (!save) return null;
        const size = locale === "bn" && save.against.labelBn ? save.against.labelBn : save.against.label;
        return <p className={styles.saving}><Icon name="tag" size={15} />{t("product.value.saves", { amount: formatMoney(save.perUnitMinor, locale), unit: save.unit, size })}</p>;
      })()}
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
          <button type="button" className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={add}>
            <Icon name="plus" /> {t("product.addToMarket")}
          </button>
        </div>
      )}
    </div>

    {/* Sticky add-to-basket bar: mirrors the buy box (same variant, same cart state). */}
    <div className={`${styles.bar} ${showBar ? styles.barOn : ""}`} aria-hidden={!showBar} inert={!showBar}>
      <div className={styles.barInner}>
        <ProductVisual artKey={product.artKey} imageUrl={product.imageUrl} alt="" size="sm" />
        <div className={styles.barText}>
          <b>{name}</b>
          <span>{sizeLabel} · {formatMoney(variant.priceMinor, locale)}</span>
        </div>
        {soldOut ? (
          <span className="badge badge-line">{t("market.outOfStock")}</span>
        ) : inCartQty > 0 ? (
          <QuantityStepper name={name} quantity={inCartQty} max={variant.available} onChange={(n) => void cart.setQuantity(variant.id, n)} />
        ) : (
          <button type="button" className={`btn btn-primary ${styles.barBtn}`} onClick={add} aria-label={t("market.addTo", { name, size: sizeLabel })}>
            <Icon name="plus" /> <span className={styles.barBtnText}>{t("product.addToMarket")}</span>
          </button>
        )}
      </div>
    </div>
    </>
  );
}
