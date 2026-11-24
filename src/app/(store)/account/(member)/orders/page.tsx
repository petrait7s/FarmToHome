import Link from "next/link";
import { getT } from "@/i18n";
import { db } from "@/lib/db";
import { requireUserPage } from "@/server/auth/guards";
import { formatMoney } from "@/lib/money";

export const metadata = { title: "Orders" };

export default async function OrdersPage() {
  const user = await requireUserPage("/account/orders");
  const { t, locale } = await getT();
  const orders = await db.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { _count: { select: { items: true } }, payments: { orderBy: { createdAt: "desc" }, take: 1 } } });
  const fmt = (d: Date, tz = "Asia/Dhaka") => d.toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: tz });
  return (
    <div>
      <h1 className="h1" style={{ marginBottom: 24 }}>{t("orders.title")}</h1>
      {orders.length === 0 ? <p>{t("orders.empty")} <Link className="link" href="/market/weekly">{t("nav.weekly")}</Link></p> : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>{t("checkout.orderNumber")}</th><th>{t("trace.status")}</th><th>{t("checkout.date")}</th><th>{t("orders.items")}</th><th>{t("checkout.payment")}</th><th>{t("common.total")}</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td><Link className="link mono" href={`/orders/${o.reference}`}>{o.reference}</Link><br /><span className="muted-note">{t("orders.placedOn", { date: fmt(o.createdAt) })}</span></td>
                  <td><span className={o.status === "CANCELLED" ? "badge badge-line" : "badge badge-red"}>{t(`orders.status.${o.status}`)}</span></td>
                  <td>{fmt(o.deliveryDate, "UTC")}<br /><span className="muted-note">{o.slotLabel}</span></td>
                  <td>{o._count.items}</td>
                  <td>{o.payments[0] ? t(`orders.payment.${o.payments[0].status}`) : "—"}</td>
                  <td className="tnum">{formatMoney(o.totalMinor, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
