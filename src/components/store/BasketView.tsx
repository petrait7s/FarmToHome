"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import type { Quote } from "@/server/quote";
import { useCart } from "./CartProvider";
import { QuantityStepper } from "@/components/market/QuantityStepper";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/i18n/client";
import { formatMoney, formatNumber } from "@/lib/money";
import { applyPromoCode, getQuote, removePromoCode } from "@/app/actions/cart";
import { saveCartAsMarket } from "@/app/actions/markets";
import styles from "./BasketView.module.css";

export function BasketView({ initialQuote, signedIn }: { initialQuote: Quote; signedIn: boolean }) {
  const { t, locale } = useI18n();
  const { cart, setQuantity, pending, clear, bulk } = useCart();
  const toast = useToast();
  const [quote, setQuote] = useState(initialQuote);
  const [code, setCode] = useState("");
  const [busy, start] = useTransition();
  const first = useRef(true);

  // Re-quote on the server whenever the basket changes (prices/discounts are never computed on the client).
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (pending) return;
    start(async () => setQuote(await getQuote()));
  }, [cart, pending]);

  if (cart.lines.length === 0) {
    return (
      <div className={styles.empty}>
        <svg viewBox="0 0 120 120" width="120" height="120" aria-hidden="true"><circle cx="72" cy="46" r="30" fill="#FF4B33" opacity=".9" /><circle cx="46" cy="70" r="26" fill="#DDAA72" /><circle cx="72" cy="74" r="34" fill="none" stroke="#0F766E" strokeWidth="1.2" /></svg>
        <h2 className="h2">{t("basket.empty")}</h2>
        <p>{t("basket.emptyBody")}</p>
        <div className={styles.emptyCtas}>
          <Link href="/market/weekly" className="btn btn-primary">{t("nav.weekly")}</Link>
          <Link href="/market/monthly" className="btn">{t("nav.monthly")}</Link>
        </div>
      </div>
    );
  }

  const removeLine = async (variantId: string, quantity: number, name: string) => {
    if (await setQuantity(variantId, 0)) toast.show(t("market.removed", { name }), { label: t("common.undo"), onClick: () => void setQuantity(variantId, quantity) });
  };

  return (
    <div className={styles.grid}>
      <section aria-label={t("basket.title")}>
        {quote.hasUnavailable ? <p className="form-error" role="alert">{t("basket.unavailableItems")}</p> : null}
        <ul className={styles.lines}>
          {cart.lines.map((l) => {
            const name = locale === "bn" && l.productNameBn ? l.productNameBn : l.productName;
            return (
              <li key={l.variantId} className={`${styles.line} ${l.available ? "" : styles.unavailable}`}>
                <Link href={`/products/${l.productSlug}`} tabIndex={-1} aria-hidden="true"><ProductVisual artKey={l.artKey} imageUrl={l.imageUrl} alt="" size="md" /></Link>
                <div className={styles.lineInfo}>
                  <p className="eyebrow">{l.originDistrict}</p>
                  <h3 className={styles.lineName}><Link href={`/products/${l.productSlug}`}>{name}</Link></h3>
                  <p className={styles.lineMeta}>
                    {l.variantLabel} · {formatMoney(l.unitPriceMinor, locale)}
                    {l.fulfillmentMode === "SOURCED_TO_ORDER" ? ` · ${t("market.sourcedToOrder")}` : ""}
                    {!l.available ? ` · ${l.availableQty === 0 ? t("market.outOfStock") : t("market.lowStock", { n: l.availableQty ?? 0 })}` : ""}
                  </p>
                </div>
                <div className={styles.lineCtrl}>
                  <QuantityStepper name={name} quantity={l.quantity} tone="line" max={l.availableQty} onChange={(n) => (n <= 0 ? void removeLine(l.variantId, l.quantity, name) : void setQuantity(l.variantId, n))} />
                  <span className={styles.lineTotal}>{formatMoney(l.lineTotalMinor, locale)}</span>
                  <button type="button" className={styles.remove} onClick={() => void removeLine(l.variantId, l.quantity, name)} aria-label={t("common.removeItem", { name })}><Icon name="x" size={15} /></button>
                </div>
              </li>
            );
          })}
        </ul>
        <div className={styles.lineActions}>
          <Link href="/market/weekly" className="btn btn-ghost"><Icon name="arrowLeft" />{t("basket.continue")}</Link>
          <button type="button" className="btn btn-ghost" onClick={async () => {
            const snap = cart.lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity }));
            if (await clear()) toast.show(t("market.cleared"), { label: t("common.undo"), onClick: () => void bulk("replace", snap) });
          }}><Icon name="trash" />{t("market.clearMarket")}</button>
          {signedIn ? (
            <button type="button" className="btn btn-ghost" onClick={() => start(async () => {
              const r = await saveCartAsMarket({ name: `${t(`saved.mode.${cart.mode}`)} · ${new Date().toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short" })}`, mode: cart.mode });
              toast.show(r.ok ? t("market.savedAs", { name: r.name }) : t("errors.generic"));
            })}><Icon name="bookmark" />{t("market.saveMarket")}</button>
          ) : null}
        </div>
      </section>

      <aside className={`panel ${styles.summary}`} aria-busy={busy || pending}>
        <h2 className="h3">{t(`market.summary.${cart.mode}`)}</h2>
        <form className={styles.promo} onSubmit={(e) => { e.preventDefault(); start(async () => { const q = await applyPromoCode(code); setQuote(q); if (!q.promoError) setCode(""); }); }}>
          <label className="label" htmlFor="promo">{t("basket.promo")}</label>
          {quote.promoCode && !quote.promoError ? (
            <p className={styles.applied}>
              <span><Icon name="check" size={16} />{t("basket.promoApplied", { code: quote.promoCode })}</span>
              <button type="button" className="link" onClick={() => start(async () => setQuote(await removePromoCode()))}>{t("basket.removePromo")}</button>
            </p>
          ) : (
            <div className={styles.promoRow}>
              <input id="promo" className="input" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" placeholder="WELCOME10" />
              <button className="btn btn-sm" disabled={!code.trim() || busy}>{t("basket.applyPromo")}</button>
            </div>
          )}
          {quote.promoError ? <p className="field-error">{t(`errors.${quote.promoError}`, { amount: formatMoney(quote.promoMinSubtotalMinor ?? 0, locale) })}</p> : null}
        </form>
        <dl className={styles.totals}>
          <div><dt>{t("common.subtotal")} · {t(cart.itemCount === 1 ? "common.item" : "common.items", { n: formatNumber(cart.itemCount, locale) })}</dt><dd>{formatMoney(quote.subtotalMinor, locale)}</dd></div>
          {quote.discountMinor ? <div><dt>{t("common.discount")}</dt><dd>− {formatMoney(quote.discountMinor, locale)}</dd></div> : null}
          <div><dt>{t("common.delivery")}</dt><dd>{quote.deliveryFeeMinor ? formatMoney(quote.deliveryFeeMinor, locale) : t("common.free")}</dd></div>
          <div className={styles.total}><dt>{t("common.total")}</dt><dd>{formatMoney(quote.totalMinor, locale)}</dd></div>
        </dl>
        <p className="muted-note">{t("checkout.serverNote")}</p>
        {!quote.meetsMinimum ? <p className="form-error">{t("basket.minOrder", { amount: formatMoney(quote.minOrderMinor, locale) })}</p> : null}
        {quote.meetsMinimum && cart.productCount > 0 ? (
          <Link href="/checkout" className="btn btn-primary btn-lg btn-block">{t("basket.checkout")} <Icon name="arrowRight" /></Link>
        ) : (
          <button type="button" className="btn btn-primary btn-lg btn-block" disabled>{t("basket.checkout")}</button>
        )}
        <p className={styles.honest}><Icon name="tag" size={14} />{t("market.honest")}</p>
      </aside>
    </div>
  );
}
