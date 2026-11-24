import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { setCustomerStatus } from "@/app/actions/admin/operations";
import { Badge, Card, Flash, Grid, PageHeader } from "@/components/admin/AdminUI";

export const metadata = { title: "Customer" };

export default async function Customer({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const u = await db.user.findUnique({
    where: { id },
    include: {
      profile: true, addresses: true,
      orders: { orderBy: { createdAt: "desc" }, take: 20 },
      savedMarkets: { include: { _count: { select: { items: true } } } },
      conciergeRequests: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
  if (!u) notFound();
  const lifetime = u.orders.filter((o) => o.status !== "CANCELLED").reduce((s, o) => s + o.totalMinor, 0);
  return (
    <>
      <PageHeader back={{ href: "/admin/customers", label: "Customers" }} title={u.name} subtitle={`${u.phone}${u.email ? ` · ${u.email}` : ""} · joined ${u.createdAt.toLocaleDateString("en-GB")}`}
        actions={<form action={setCustomerStatus}><input type="hidden" name="id" value={u.id} /><input type="hidden" name="status" value={u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"} /><button className="btn btn-sm">{u.status === "ACTIVE" ? "Suspend account" : "Reactivate account"}</button></form>} />
      <Flash sp={sp} />
      <Grid cols={2}>
        <Card title="Profile">
          <p>Status: <Badge tone={u.status === "ACTIVE" ? "line" : "red"}>{u.status}</Badge></p>
          <p>Household size: {u.profile?.householdSize ?? "—"} · Language: {u.profile?.preferredLanguage ?? "EN"}</p>
          <p>Lifetime value (excl. cancelled): {formatMoney(lifetime)}</p>
          <p className="muted-note">Notifications: {u.profile ? [u.profile.notifyOrderUpdates && "order updates", u.profile.notifyHarvestNews && "harvest news", u.profile.notifyBySms && "SMS", u.profile.notifyByEmail && "email"].filter(Boolean).join(", ") || "none" : "—"}</p>
        </Card>
        <Card title="Addresses">
          {u.addresses.length === 0 ? <p className="muted-note">None saved.</p> : u.addresses.map((a) => <p key={a.id}><b>{a.label}</b>{a.isDefault ? " (default)" : ""}: {a.line1}, {a.area}, {a.district}</p>)}
        </Card>
        <Card title="Orders">
          {u.orders.length === 0 ? <p className="muted-note">No orders.</p> : (
            <div className="table-wrap"><table className="table"><tbody>
              {u.orders.map((o) => <tr key={o.id}><td><Link className="link mono" href={`/admin/orders/${o.id}`}>{o.reference}</Link></td><td>{o.status}</td><td className="tnum">{formatMoney(o.totalMinor)}</td></tr>)}
            </tbody></table></div>
          )}
        </Card>
        <Card title="Saved markets & concierge">
          {u.savedMarkets.map((m) => <p key={m.id}>{m.name} · {m.mode} · {m._count.items} items · used {m.useCount}×</p>)}
          {u.conciergeRequests.map((c) => <p key={c.id}><Link className="link mono" href={`/admin/concierge/${c.id}`}>{c.reference}</Link> · {c.topic} · {c.status}</p>)}
        </Card>
      </Grid>
    </>
  );
}
