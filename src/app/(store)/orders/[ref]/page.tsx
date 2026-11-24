import Link from "next/link";
import { notFound } from "next/navigation";
import { getT } from "@/i18n";
import { getOrderForViewer } from "@/server/orders/access";
import { customerCanCancel } from "@/server/orders/workflow";
import { cancelOrderAction, reorderAction, switchToCodAction } from "@/app/actions/orders";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { Icon } from "@/components/ui/Icon";
import { formatMoney, formatNumber } from "@/lib/money";
import styles from "./order.module.css";

export const metadata = { title: "Order", robots: { index: false } };

export default async function OrderPage({ params, searchParams }: { params: Promise<{ ref: string }>; searchParams: Promise<{ t?: string; placed?: string; m?: string }> }) {
  const { ref } = await params;
  const sp = await searchParams;
  const access = await getOrderForViewer(ref, sp.t);
  if (!access) notFound();
  const { order, viewer } = access;
  const { t, locale } = await getT();
  const date = order.deliveryDate.toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
  const payment = order.payments.filter((p) => p.status !== "CANCELLED").at(-1) ?? order.payments.at(-1);
  const canAct = viewer.owner || viewer.guest;
  const placed = sp.placed === "1" && order.status !== "CANCELLED";

  return (
    <div className="page-pad">
      {placed ? (
        <section className={`${styles.hero} on-red`}>
          <svg className={styles.bloom} viewBox="0 0 600 600" aria-hidden="true"><circle cx="420" cy="160" r="170" fill="#C6A15B" /><circle cx="300" cy="320" r="120" fill="#F4EBDD" opacity=".16" /><circle cx="400" cy="340" r="190" fill="none" stroke="#F4EBDD" strokeWidth="1.2" opacity=".7" /></svg>
          <div className={`container ${styles.heroInner}`}>
            <span className={styles.check}><Icon name="check" size={32} strokeWidth={2.6} /></span>
            <h1 className="display" style={{ fontSize: "clamp(36px,5vw,64px)" }}>{t("checkout.confirmTitle")}</h1>
            <p className={styles.heroLead}>{t("checkout.confirmLead")}</p>
            <p className={styles.oid}>{t("checkout.orderNumber")} <b className="mono">{order.reference}</b></p>
          </div>
        </section>
      ) : null}

      <div className={`container ${styles.grid}`}>
        <div>
          {!placed ? (
            <header className={styles.head}>
              <p className="eyebrow"><span className="dot" aria-hidden="true" />{t("orders.tracking")}</p>
              <h1 className="h1">{t("checkout.orderNumber")} <span className="mono" style={{ fontSize: "0.6em" }}>{order.reference}</span></h1>
            </header>
          ) : null}
          {sp.m === "cancelled" ? <p className="form-ok" role="status">{t("orders.cancelled")}</p> : null}
          {viewer.guest ? <p className="muted-note" style={{ marginBottom: 16 }}>{t("checkout.guestNote")}</p> : null}

          <section className={styles.card}>
            <h2 className="h3">{t("orders.status." + order.status)}</h2>
            <p className={styles.when}><Icon name="truck" size={16} />{t("orders.deliveryOn", { date, slot: order.slotLabel })}</p>
            <OrderTimeline status={order.status} needsSourcing={order.needsSourcing} history={order.statusHistory} />
          </section>

          <section className={styles.card}>
            <h2 className="h3">{t("orders.items")}</h2>
            <ul className={styles.items}>
              {order.items.map((i) => (
                <li key={i.id}>
                  <ProductVisual artKey={i.variant.product.artKey} alt="" size="sm" />
                  <div>
                    <Link href={`/products/${i.variant.product.slug}`} className={styles.itemName}>{i.productName}</Link>
                    <p className="muted-note">{i.variantLabel} × {formatNumber(i.quantity, locale)} · {formatMoney(i.unitPriceMinor, locale)}</p>
                    {i.allocations.length ? (
                      <p className={styles.batches}>
                        {t("product.batch")}: {i.allocations.map((a) => <Link key={a.id} href={`/trace/${a.batch.batchNumber}`} className="link mono">{a.batch.batchNumber}</Link>)}
                      </p>
                    ) : i.fulfillmentMode === "SOURCED_TO_ORDER" ? <p className="muted-note">{t("market.sourcedToOrder")}</p> : null}
                  </div>
                  <span className={styles.itemTotal}>{formatMoney(i.lineTotalMinor, locale)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className={styles.side}>
          <section className={`panel ${styles.summary}`}>
            <dl className={styles.totals}>
              <div><dt>{t("common.subtotal")}</dt><dd>{formatMoney(order.subtotalMinor, locale)}</dd></div>
              {order.discountMinor ? <div><dt>{t("common.discount")} {order.promoCode ? `(${order.promoCode})` : ""}</dt><dd>− {formatMoney(order.discountMinor, locale)}</dd></div> : null}
              <div><dt>{t("common.delivery")}</dt><dd>{order.deliveryFeeMinor ? formatMoney(order.deliveryFeeMinor, locale) : t("common.free")}</dd></div>
              <div className={styles.total}><dt>{t("common.total")}</dt><dd>{formatMoney(order.totalMinor, locale)}</dd></div>
            </dl>
            {payment ? (
              <div className={styles.payment}>
                <p className="label">{t("checkout.payment")}</p>
                <p>{t(`checkout.methods.${payment.method}.title`)} · <b>{t(`orders.payment.${payment.status}`)}</b> {payment.isSimulated ? <span className="demo-tag">{t("checkout.simulatedBadge")}</span> : null}</p>
                {payment.transactionRef ? <p className="muted-note mono">{payment.transactionRef}</p> : null}
                {canAct && payment.isSimulated && (payment.status === "PENDING" || payment.status === "FAILED") && order.status !== "CANCELLED" ? (
                  <div className={styles.payActions}>
                    <Link className="btn btn-primary btn-sm" href={`/pay/${order.reference}/${payment.id}${sp.t ? `?t=${sp.t}` : ""}`}>{t("checkout.payNow")}</Link>
                    <form action={switchToCodAction}><input type="hidden" name="ref" value={order.reference} /><input type="hidden" name="t" value={sp.t ?? ""} /><button className="btn btn-sm">{t("checkout.methods.CASH_ON_DELIVERY.title")}</button></form>
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className={styles.addr}>
              <p className="label">{t("orders.deliveryTo")}</p>
              <p>{order.contactName} · {order.contactPhone}</p>
              <p>{order.line1}, {order.area}, {order.district}</p>
              {order.landmark ? <p className="muted-note">{order.landmark}</p> : null}
              {order.instructions ? <p className="muted-note">{order.instructions}</p> : null}
            </div>
          </section>

          {canAct ? (
            <section className={styles.actions}>
              <form action={reorderAction}>
                <input type="hidden" name="ref" value={order.reference} /><input type="hidden" name="t" value={sp.t ?? ""} />
                <button className="btn btn-block"><Icon name="repeat" />{t("orders.reorder")}</button>
              </form>
              {customerCanCancel(order.status) ? (
                <form action={cancelOrderAction}>
                  <input type="hidden" name="ref" value={order.reference} /><input type="hidden" name="t" value={sp.t ?? ""} />
                  <button className="btn btn-ghost btn-block">{t("orders.cancel")}</button>
                  <p className="muted-note" style={{ textAlign: "center" }}>{t("orders.cancelHelp")}</p>
                </form>
              ) : null}
              {viewer.owner ? <Link href="/account/orders" className="link" style={{ textAlign: "center" }}>{t("account.orders")}</Link> : null}
              <Link href="/concierge" className="link" style={{ textAlign: "center" }}>{t("nav.concierge")}</Link>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
