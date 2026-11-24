"use client";

import Link from "next/link";
import type { MarketCategory, Mode, ZoneRule } from "./types";
import { useCart } from "@/components/store/CartProvider";
import { QuantityStepper } from "./QuantityStepper";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/i18n/client";
import { formatMoney, formatNumber } from "@/lib/money";
import { localized } from "@/i18n/shared";
import { deliveryFee } from "@/server/pricing";
import styles from "./MarketBuilder.module.css";

type Props = {
  mode: Mode;
  categories: MarketCategory[];
  zone: ZoneRule;
  countId: string;
  onSave: () => void;
  onClear: () => void;
};

export function MarketSummary({ mode, categories, zone, countId, onSave, onClear }: Props) {
  const { t, locale } = useI18n();
  const { cart, setQuantity } = useCart();
  const lines = cart.lines;
  const fee = deliveryFee(cart.subtotalMinor, zone);
  const threshold = zone?.freeThresholdMinor ?? null;
  const total = cart.subtotalMinor + fee;
  const grouped = categories
    .map((c) => ({ c, items: lines.filter((l) => l.categoryId === c.id) }))
    .filter((g) => g.items.length);

  return (
    <div className={styles.sum}>
      <div className={styles.sumHead}>
        <p className="eyebrow"><span className="dot" aria-hidden="true" />{t("nav.market")}</p>
        <h2 className={styles.sumTitle}>
          {t(`market.summary.${mode}`)}
          <span id={countId} className={styles.sumCount}>{t(cart.productCount === 1 ? "common.product" : "common.products", { n: cart.productCount })}</span>
        </h2>
      </div>
      <div className={styles.sumList}>
        {lines.length === 0 ? (
          <div className={styles.sumEmpty}>
            <svg viewBox="0 0 120 120" width="104" height="104" aria-hidden="true"><circle cx="72" cy="46" r="30" fill="#164A83" opacity=".9" /><circle cx="46" cy="70" r="26" fill="#C6A15B" /><circle cx="72" cy="74" r="34" fill="none" stroke="#075B62" strokeWidth="1.2" /></svg>
            <h3>{t("market.emptyTitle")}</h3>
            <p>{t("market.emptyBody")}</p>
          </div>
        ) : (
          grouped.map(({ c, items }) => (
            <div key={c.id} className={styles.sumGroup}>
              <h3 className="eyebrow">{localized(c, "name", locale)}</h3>
              {items.map((l) => {
                const name = locale === "bn" && l.productNameBn ? l.productNameBn : l.productName;
                return (
                  <div key={l.variantId} className={`${styles.li} ${l.available ? "" : styles.liUnavailable}`}>
                    <span className={styles.liName}>{name}</span>
                    <span className={styles.liTotal}>{formatMoney(l.lineTotalMinor, locale)}</span>
                    <span className={styles.liMeta}>
                      {l.variantLabel} × {formatNumber(l.quantity, locale)}
                      {!l.available ? ` · ${l.availableQty === 0 ? t("market.outOfStock") : t("market.lowStock", { n: l.availableQty ?? 0 })}` : ""}
                    </span>
                    <span className={styles.liCtrl}>
                      <QuantityStepper name={name} quantity={l.quantity} size="sm" tone="line" max={l.availableQty} onChange={(n) => void setQuantity(l.variantId, n)} />
                    </span>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
      <div className={styles.sumFoot}>
        <div className={styles.tot}><span>{t("common.subtotal")} · {t(cart.itemCount === 1 ? "common.item" : "common.items", { n: cart.itemCount })}</span><span>{formatMoney(cart.subtotalMinor, locale)}</span></div>
        <div className={styles.tot}><span>{t("common.delivery")}</span><span>{cart.productCount === 0 ? "—" : fee === 0 ? t("common.free") : formatMoney(fee, locale)}</span></div>
        {cart.productCount > 0 && fee > 0 && threshold ? (
          <>
            <div className={styles.meter} aria-hidden="true"><i style={{ width: `${Math.min(100, (cart.subtotalMinor / threshold) * 100)}%` }} /></div>
            <p className={styles.meterNote}>{t("market.freeDeliveryIn", { amount: formatMoney(threshold - cart.subtotalMinor, locale) })}</p>
          </>
        ) : null}
        <div className={`${styles.tot} ${styles.totBig}`}><span>{t("common.total")}</span><span>{formatMoney(total, locale)}</span></div>
        <p className={styles.honest}><Icon name="tag" size={14} />{t("market.honest")}</p>
        {cart.productCount > 0 ? (
          <Link href="/basket" className={`btn btn-primary btn-lg btn-block ${styles.cta}`}>{t("market.review")} <Icon name="arrowRight" /></Link>
        ) : (
          <button type="button" className={`btn btn-primary btn-lg btn-block ${styles.cta}`} disabled>{t("market.review")} <Icon name="arrowRight" /></button>
        )}
        <div className={styles.sumActions}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onSave} disabled={!cart.productCount}><Icon name="bookmark" size={15} />{t("market.saveMarket")}</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClear} disabled={!lines.length}><Icon name="trash" size={15} />{t("market.clearMarket")}</button>
        </div>
      </div>
    </div>
  );
}
