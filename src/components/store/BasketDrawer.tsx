"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useCart } from "./CartProvider";
import { QuantityStepper } from "@/components/market/QuantityStepper";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/i18n/client";
import { formatMoney, formatNumber } from "@/lib/money";
import styles from "./BasketDrawer.module.css";

/** Free-delivery rule for the progress bar: the chosen area's, or the lowest-fee zone's when no area is chosen. */
export type DrawerZone = { feeMinor: number; freeThresholdMinor: number | null; area: string | null } | null;

/** Side drawer to review and edit the basket without leaving the page. Native <dialog> traps focus and closes on Escape. */
export function BasketDrawer({ open, onClose, zone }: { open: boolean; onClose: () => void; zone: DrawerZone }) {
  const { t, locale } = useI18n();
  const { cart, setQuantity } = useCart();
  const toast = useToast();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const threshold = zone?.freeThresholdMinor ?? null;
  const left = threshold ? Math.max(0, threshold - cart.subtotalMinor) : null;
  const pct = threshold ? Math.min(100, Math.round((cart.subtotalMinor / threshold) * 100)) : 0;

  const remove = async (variantId: string, quantity: number, name: string) => {
    if (await setQuantity(variantId, 0)) toast.show(t("market.removed", { name }), { label: t("common.undo"), onClick: () => void setQuantity(variantId, quantity) });
  };

  return (
    <dialog ref={ref} className={styles.drawer} aria-labelledby="drawer-title" onClose={onClose}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      {open ? (
        <div className={styles.inner}>
          <header className={styles.head}>
            <h2 id="drawer-title" className="h3">{t("drawer.title")} <span className={styles.count}>{t(cart.productCount === 1 ? "common.item" : "common.items", { n: formatNumber(cart.productCount, locale) })}</span></h2>
            <button type="button" className={styles.close} onClick={onClose} aria-label={t("drawer.close")}><Icon name="x" size={18} /></button>
          </header>

          {cart.lines.length === 0 ? (
            <div className={styles.empty}>
              <p className="h3">{t("basket.empty")}</p>
              <p className="muted-note">{t("basket.emptyBody")}</p>
              <div className={styles.emptyBtns}>
                <Link href="/market/weekly" className="btn btn-primary" onClick={onClose}>{t("nav.weekly")}</Link>
                <Link href="/market/monthly" className="btn" onClick={onClose}>{t("nav.monthly")}</Link>
              </div>
            </div>
          ) : (
            <>
              {threshold ? (
                <div className={styles.free}>
                  <p className={styles.freeText}>
                    <Icon name={left ? "truck" : "check"} size={16} />
                    {left ? t("drawer.freeLeft", { amount: formatMoney(left, locale) }) : t("drawer.freeDone")}
                  </p>
                  <span className={styles.bar} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={t("drawer.freeLeft", { amount: formatMoney(left ?? 0, locale) })}><span style={{ width: `${pct}%` }} /></span>
                  <p className={styles.freeNote}>{zone?.area ? t("drawer.freeArea", { area: zone.area }) : t("drawer.freeGuess")}</p>
                </div>
              ) : null}
              <ul className={styles.lines}>
                {cart.lines.map((l) => {
                  const name = locale === "bn" && l.productNameBn ? l.productNameBn : l.productName;
                  return (
                    <li key={l.variantId} className={`${styles.line} ${l.available ? "" : styles.off}`}>
                      <Link href={`/products/${l.productSlug}`} className={styles.thumb} tabIndex={-1} aria-hidden="true" onClick={onClose}>
                        <ProductVisual artKey={l.artKey} imageUrl={l.imageUrl} alt="" size="sm" />
                      </Link>
                      <div className={styles.info}>
                        <Link href={`/products/${l.productSlug}`} className={styles.name} onClick={onClose}>{name}</Link>
                        <span className={styles.meta}>{l.variantLabel} · {formatMoney(l.unitPriceMinor, locale)}{!l.available ? ` · ${t("market.outOfStock")}` : ""}</span>
                        <div className={styles.ctrl}>
                          <QuantityStepper name={name} quantity={l.quantity} tone="line" max={l.availableQty} onChange={(n) => (n <= 0 ? void remove(l.variantId, l.quantity, name) : void setQuantity(l.variantId, n))} />
                          <span className={styles.total}>{formatMoney(l.lineTotalMinor, locale)}</span>
                        </div>
                      </div>
                      <button type="button" className={styles.remove} onClick={() => void remove(l.variantId, l.quantity, name)} aria-label={t("common.removeItem", { name })}><Icon name="x" size={14} /></button>
                    </li>
                  );
                })}
              </ul>
              <footer className={styles.foot}>
                <p className={styles.sub}><span>{t("common.subtotal")}</span><b>{formatMoney(cart.subtotalMinor, locale)}</b></p>
                <p className="muted-note">{t("checkout.serverNote")}</p>
                <div className={styles.footBtns}>
                  <Link href="/basket" className="btn" onClick={onClose}>{t("drawer.view")}</Link>
                  {cart.productCount > 0 ? <Link href="/checkout" className="btn btn-primary" onClick={onClose}>{t("drawer.checkout")} <Icon name="arrowRight" /></Link> : null}
                </div>
              </footer>
            </>
          )}
        </div>
      ) : null}
    </dialog>
  );
}
