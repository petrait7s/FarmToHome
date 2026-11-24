import Link from "next/link";
import { getT } from "@/i18n";
import { db } from "@/lib/db";
import { requireUserPage } from "@/server/auth/guards";
import { formatMoney } from "@/lib/money";
import { Icon } from "@/components/ui/Icon";

export const metadata = { title: "My account" };

export default async function AccountHome() {
  const user = await requireUserPage("/account");
  const { t, locale } = await getT();
  const [orders, markets, addresses] = await Promise.all([
    db.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 3 }),
    db.savedMarket.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, take: 3, include: { _count: { select: { items: true } } } }),
    db.address.count({ where: { userId: user.id } }),
  ]);
  const fmt = (d: Date) => d.toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  return (
    <div className="stack" style={{ ["--stack" as string]: "36px" }}>
      <header>
        <p className="eyebrow"><span className="dot" aria-hidden="true" />{t("account.title")}</p>
        <h1 className="h1" style={{ marginTop: 10 }}>{t("account.welcome", { name: user.name })}</h1>
      </header>
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <h2 className="h3">{t("account.orders")}</h2>
          <Link href="/account/orders" className="link">{t("common.viewAll")}</Link>
        </div>
        {orders.length === 0 ? <p>{t("orders.empty")} <Link className="link" href="/market/weekly">{t("nav.weekly")}</Link></p> : (
          <div className="table-wrap">
            <table className="table">
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td><Link className="link mono" href={`/orders/${o.reference}`}>{o.reference}</Link></td>
                    <td>{t(`orders.status.${o.status}`)}</td>
                    <td>{fmt(o.deliveryDate)} · {o.slotLabel}</td>
                    <td className="tnum">{formatMoney(o.totalMinor, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <h2 className="h3">{t("account.markets")}</h2>
          <Link href="/account/markets" className="link">{t("common.viewAll")}</Link>
        </div>
        {markets.length === 0 ? <p>{t("saved.empty")}</p> : (
          <ul style={{ listStyle: "none", display: "grid", gap: 10 }}>
            {markets.map((m) => (
              <li key={m.id} className="surface" style={{ padding: "16px 18px", display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <span><b className="serif" style={{ fontSize: 18, fontWeight: 500 }}>{m.name}</b><br /><span className="muted-note">{t(`saved.mode.${m.mode}`)} · {t("saved.items", { n: m._count.items })}</span></span>
                <Link href="/account/markets" className="btn btn-sm"><Icon name="repeat" size={15} />{t("saved.addToBasket")}</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Link href="/account/addresses" className="btn"><Icon name="pin" />{t("account.addresses")} ({addresses})</Link>
        <Link href="/market/weekly" className="btn btn-primary">{t("nav.weekly")} <Icon name="arrowRight" /></Link>
      </section>
    </div>
  );
}
