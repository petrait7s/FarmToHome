import Link from "next/link";
import { getT } from "@/i18n";
import { db } from "@/lib/db";
import { requireUserPage } from "@/server/auth/guards";
import { listSavedMarkets } from "@/server/markets";
import { deleteMarket, renameMarket, replaceMarketWithCart, updateMarketItem } from "@/app/actions/markets";
import { RepeatButtons } from "@/components/account/RepeatButtons";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { Icon } from "@/components/ui/Icon";
import { formatMoney, formatNumber } from "@/lib/money";
import styles from "./markets.module.css";

export const metadata = { title: "Saved markets" };

export default async function MarketsPage() {
  const user = await requireUserPage("/account/markets");
  const { t, locale } = await getT();
  const markets = await listSavedMarkets(user.id);
  const history = await db.order.findMany({
    where: { userId: user.id, savedMarketId: { in: markets.map((m) => m.id) } },
    orderBy: { createdAt: "desc" },
    select: { reference: true, savedMarketId: true, createdAt: true, totalMinor: true, status: true },
  });
  const fmt = (d: Date) => d.toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Dhaka" });

  return (
    <div>
      <h1 className="h1">{t("saved.title")}</h1>
      <p className="lead" style={{ margin: "10px 0 28px" }}>{t("saved.lead")}</p>
      {markets.length === 0 ? (
        <p>{t("saved.empty")} <Link className="link" href="/market/weekly">{t("nav.weekly")}</Link></p>
      ) : (
        <div className={styles.list}>
          {markets.map((m) => {
            const total = m.items.reduce((s, i) => s + i.variant.priceMinor * i.quantity, 0);
            const orders = history.filter((h) => h.savedMarketId === m.id);
            return (
              <article key={m.id} className={styles.market}>
                <header className={styles.head}>
                  <div className={styles.stack} aria-hidden="true">
                    {m.items.slice(0, 3).map((i) => <ProductVisual key={i.id} artKey={i.variant.product.artKey} alt="" size="sm" />)}
                  </div>
                  <div className={styles.title}>
                    <h2 className="h3">{m.name}</h2>
                    <p className="muted-note">
                      {t(`saved.mode.${m.mode}`)} · {t("saved.items", { n: m.items.length })} · ≈ {formatMoney(total, locale)} · {m.lastUsedAt ? t("saved.lastUsed", { date: fmt(m.lastUsedAt) }) : t("saved.neverUsed")} · {t("saved.uses", { n: m.useCount })}
                    </p>
                  </div>
                  <RepeatButtons id={m.id} name={m.name} />
                </header>

                <details className={styles.details}>
                  <summary><Icon name="edit" size={15} />{t("saved.editItems")}</summary>
                  <form action={renameMarket} className={styles.rename}>
                    <input type="hidden" name="id" value={m.id} />
                    <label className="sr-only" htmlFor={`name-${m.id}`}>{t("saved.rename")}</label>
                    <input id={`name-${m.id}`} name="name" className="input" defaultValue={m.name} maxLength={60} required />
                    <button className="btn btn-sm">{t("saved.rename")}</button>
                  </form>
                  <ul className={styles.items}>
                    {m.items.map((i, idx) => (
                      <li key={i.id} className={i.variant.product.status !== "ACTIVE" || !i.variant.active ? styles.inactive : undefined}>
                        <span className={styles.itemName}>{locale === "bn" && i.variant.product.nameBn ? i.variant.product.nameBn : i.variant.product.name} <small>{i.variant.label}</small></span>
                        <span className={styles.itemCtrl}>
                          {(["up", "down", "dec", "inc", "remove"] as const).map((op) => (
                            <form key={op} action={updateMarketItem}>
                              <input type="hidden" name="marketId" value={m.id} />
                              <input type="hidden" name="itemId" value={i.id} />
                              <input type="hidden" name="op" value={op} />
                              {op === "dec" ? <span className={styles.qty}>{formatNumber(i.quantity, locale)}</span> : null}
                              <button className="icon-btn" disabled={(op === "up" && idx === 0) || (op === "down" && idx === m.items.length - 1)}
                                aria-label={op === "up" ? t("saved.moveUp") : op === "down" ? t("saved.moveDown") : op === "inc" ? t("common.increase", { name: i.variant.product.name }) : op === "dec" ? t("common.decrease", { name: i.variant.product.name }) : t("common.removeItem", { name: i.variant.product.name })}>
                                <Icon name={op === "up" ? "up" : op === "down" ? "down" : op === "inc" ? "plus" : op === "dec" ? "minus" : "x"} size={14} />
                              </button>
                            </form>
                          ))}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className={styles.footActions}>
                    <form action={replaceMarketWithCart}><input type="hidden" name="id" value={m.id} /><button className="btn btn-sm"><Icon name="basket" size={15} />{t("saved.saveCurrent")}</button></form>
                    <ConfirmButton action={deleteMarket} fields={{ id: m.id }} label={t("common.delete")} confirm={t("saved.deleteConfirm", { name: m.name })} />
                  </div>
                  <div className={styles.history}>
                    <p className="label">{t("saved.history")}</p>
                    {orders.length === 0 ? <p className="muted-note">{t("saved.noHistory")}</p> : (
                      <ul>{orders.map((o) => <li key={o.reference}><Link className="link mono" href={`/orders/${o.reference}`}>{o.reference}</Link> · {fmt(o.createdAt)} · {t(`orders.status.${o.status}`)} · {formatMoney(o.totalMinor, locale)}</li>)}</ul>
                    )}
                  </div>
                </details>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
