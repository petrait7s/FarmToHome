import Link from "next/link";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { dhakaToday, addDays } from "@/server/delivery";
import { availableByVariant } from "@/server/inventory/availability";
import { Card, Grid, PageHeader, Stat, Badge, Empty } from "@/components/admin/AdminUI";

export const metadata = { title: "Dashboard" };

const PROCESSING = ["CONFIRMED", "PROCUREMENT", "QUALITY_CHECK", "PROCESSING", "PACKAGING", "READY_FOR_DISPATCH"] as const;

export default async function Dashboard() {
  const today = dhakaToday();
  const startOfDay = new Date(today.getTime() - 6 * 3600 * 1000); // Dhaka midnight in UTC
  const since30 = addDays(startOfDay, -30);
  const [total, todayCount, pending, processing, outForDelivery, sales30, recent, upcoming, activity, stockVariants] = await Promise.all([
    db.order.count(),
    db.order.count({ where: { createdAt: { gte: startOfDay } } }),
    db.order.count({ where: { status: "PLACED" } }),
    db.order.count({ where: { status: { in: [...PROCESSING] } } }),
    db.order.count({ where: { status: "OUT_FOR_DELIVERY" } }),
    db.order.aggregate({ where: { status: { not: "CANCELLED" }, createdAt: { gte: since30 } }, _sum: { totalMinor: true }, _count: true }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    db.order.groupBy({ by: ["deliveryDate", "slotLabel"], where: { status: { notIn: ["CANCELLED", "DELIVERED"] }, deliveryDate: { gte: today, lte: addDays(today, 2) } }, _count: true, orderBy: [{ deliveryDate: "asc" }, { slotLabel: "asc" }] }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { actor: { select: { name: true } } } }),
    db.productVariant.findMany({ where: { active: true, fulfillmentMode: "STOCK", product: { status: "ACTIVE" } }, include: { product: { select: { name: true, id: true } } } }),
  ]);
  const avail = await availableByVariant(stockVariants.map((v) => v.id));
  const low = stockVariants
    .map((v) => ({ v, a: avail.get(v.id) ?? 0 }))
    .filter((x) => x.a !== null && (x.a as number) <= x.v.lowStockThreshold)
    .sort((a, b) => (a.a as number) - (b.a as number));

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Live figures from the database. No metrics are estimated or fabricated." />
      <Grid cols={4}>
        <Stat label="Orders today" value={todayCount} tone="red" />
        <Stat label="Pending confirmation" value={pending} hint={<Link className="link" href="/admin/orders?status=PLACED">Review</Link>} />
        <Stat label="In fulfilment" value={processing} />
        <Stat label="Out for delivery" value={outForDelivery} />
      </Grid>
      <Grid cols={3}>
        <Stat label="Sales, last 30 days" value={formatMoney(sales30._sum.totalMinor ?? 0)} hint={`${sales30._count} orders (excl. cancelled)`} />
        <Stat label="All-time orders" value={total} />
        <Stat label="Low-stock variants" value={low.length} hint="At or below threshold" />
      </Grid>
      <Grid cols={2}>
        <Card title="Recent orders" actions={<Link className="link" href="/admin/orders">All orders</Link>}>
          {recent.length === 0 ? <Empty>No orders yet.</Empty> : (
            <div className="table-wrap"><table className="table"><tbody>
              {recent.map((o) => (
                <tr key={o.id}>
                  <td><Link className="link mono" href={`/admin/orders/${o.id}`}>{o.reference}</Link><br /><span className="muted-note">{o.contactName}</span></td>
                  <td><Badge tone={o.status === "CANCELLED" ? "line" : "red"}>{o.status.replaceAll("_", " ")}</Badge></td>
                  <td className="tnum">{formatMoney(o.totalMinor)}</td>
                </tr>
              ))}
            </tbody></table></div>
          )}
        </Card>
        <Card title="Deliveries — next 3 days" actions={<Link className="link" href="/admin/delivery">Delivery</Link>}>
          {upcoming.length === 0 ? <Empty>No scheduled deliveries.</Empty> : (
            <div className="table-wrap"><table className="table"><tbody>
              {upcoming.map((u) => (
                <tr key={`${u.deliveryDate.toISOString()}-${u.slotLabel}`}>
                  <td>{u.deliveryDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })}</td>
                  <td>{u.slotLabel}</td>
                  <td className="tnum">{u._count} orders</td>
                </tr>
              ))}
            </tbody></table></div>
          )}
        </Card>
        <Card title="Low stock" actions={<Link className="link" href="/admin/inventory?low=1">Inventory</Link>}>
          {low.length === 0 ? <Empty>All stock-held variants are above their thresholds.</Empty> : (
            <div className="table-wrap"><table className="table"><tbody>
              {low.slice(0, 10).map(({ v, a }) => (
                <tr key={v.id}><td>{v.product.name} <span className="muted-note">{v.label}</span></td><td className="tnum"><Badge tone="red">{a} available</Badge></td><td className="muted-note">threshold {v.lowStockThreshold}</td></tr>
              ))}
            </tbody></table></div>
          )}
        </Card>
        <Card title="Recent activity" actions={<Link className="link" href="/admin/audit">Audit log</Link>}>
          {activity.length === 0 ? <Empty>No admin activity recorded yet.</Empty> : (
            <ul style={{ listStyle: "none", display: "grid", gap: 8, fontSize: 13.5 }}>
              {activity.map((a) => <li key={a.id}><b>{a.actor?.name ?? "System"}</b> · {a.action} {a.entity} <span className="muted-note">· {a.createdAt.toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })}</span></li>)}
            </ul>
          )}
        </Card>
      </Grid>
    </>
  );
}
