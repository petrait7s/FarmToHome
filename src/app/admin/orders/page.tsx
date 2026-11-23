import Link from "next/link";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import type { OrderStatus, Prisma } from "@/generated/prisma/client";
import { Badge, Empty, PageHeader, Pager } from "@/components/admin/AdminUI";

export const metadata = { title: "Orders" };

const STATUSES: OrderStatus[] = ["PLACED", "CONFIRMED", "PROCUREMENT", "QUALITY_CHECK", "PROCESSING", "PACKAGING", "READY_FOR_DISPATCH", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; date?: string; page?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where: Prisma.OrderWhereInput = {};
  if (sp.status && STATUSES.includes(sp.status as OrderStatus)) where.status = sp.status as OrderStatus;
  if (sp.date) where.deliveryDate = new Date(`${sp.date}T00:00:00.000Z`);
  if (sp.q?.trim()) {
    const q = sp.q.trim();
    where.OR = [{ reference: { contains: q.toUpperCase() } }, { contactPhone: { contains: q } }, { contactName: { contains: q, mode: "insensitive" } }];
  }
  const [orders, count] = await Promise.all([
    db.order.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * 25, take: 25, include: { payments: { orderBy: { createdAt: "desc" }, take: 1 }, _count: { select: { items: true } } } }),
    db.order.count({ where }),
  ]);
  const qs = new URLSearchParams(Object.entries({ q: sp.q, status: sp.status, date: sp.date }).filter(([, v]) => v) as [string, string][]).toString();
  return (
    <>
      <PageHeader title="Orders" subtitle={`${count} orders`} />
      <form className="surface" style={{ padding: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end", marginBottom: 18 }}>
        <div className="field" style={{ flex: 1, minWidth: 200 }}><label className="label" htmlFor="q">Search</label><input id="q" name="q" className="input" defaultValue={sp.q ?? ""} placeholder="Reference, phone or name" /></div>
        <div className="field"><label className="label" htmlFor="status">Status</label><select id="status" name="status" className="select" defaultValue={sp.status ?? ""}><option value="">All</option>{STATUSES.map((s) => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}</select></div>
        <div className="field"><label className="label" htmlFor="date">Delivery date</label><input id="date" name="date" type="date" className="input" defaultValue={sp.date ?? ""} /></div>
        <button className="btn btn-primary btn-sm">Filter</button>
        <Link href="/admin/orders" className="btn btn-ghost btn-sm">Reset</Link>
      </form>
      {orders.length === 0 ? <Empty>No orders match.</Empty> : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Reference</th><th>Customer</th><th>Status</th><th>Delivery</th><th>Items</th><th>Payment</th><th>Total</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td><Link className="link mono" href={`/admin/orders/${o.id}`}>{o.reference}</Link><br /><span className="muted-note">{o.createdAt.toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })}</span></td>
                  <td>{o.contactName}<br /><span className="muted-note">{o.contactPhone} · {o.area}</span></td>
                  <td><Badge tone={o.status === "CANCELLED" ? "line" : "red"}>{o.status.replaceAll("_", " ")}</Badge>{o.needsSourcing ? <><br /><span className="muted-note">needs sourcing</span></> : null}</td>
                  <td>{o.deliveryDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}<br /><span className="muted-note">{o.slotLabel}</span></td>
                  <td>{o._count.items}</td>
                  <td>{o.payments[0] ? <>{o.payments[0].method.replaceAll("_", " ").toLowerCase()}<br /><span className="muted-note">{o.payments[0].status}{o.payments[0].isSimulated ? " · simulated" : ""}</span></> : "—"}</td>
                  <td className="tnum">{formatMoney(o.totalMinor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager page={page} pages={Math.ceil(count / 25)} base={`/admin/orders${qs ? `?${qs}` : ""}`} />
    </>
  );
}
