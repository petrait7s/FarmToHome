import Link from "next/link";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { Badge, Empty, Flash, PageHeader } from "@/components/admin/AdminUI";

export const metadata = { title: "Procurement" };

export default async function Procurement({ searchParams }: { searchParams: Promise<{ producer?: string; ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const list = await db.procurement.findMany({ where: sp.producer ? { producerId: sp.producer } : {}, orderBy: { createdAt: "desc" }, take: 100, include: { producer: true, items: { include: { product: { select: { name: true } } } } } });
  return (
    <>
      <PageHeader title="Procurement" subtitle="Direct purchases from producers. Receiving creates traceable batches." actions={<Link className="btn btn-primary btn-sm" href="/admin/procurement/new">Plan procurement</Link>} />
      <Flash sp={sp} />
      {list.length === 0 ? <Empty>No procurements yet.</Empty> : (
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Reference</th><th>Producer</th><th>Status</th><th>Items</th><th>Value</th><th>Received</th></tr></thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id}>
                <td><Link className="link mono" href={`/admin/procurement/${p.id}`}>{p.reference}</Link> {p.isDemo ? <Badge>demo</Badge> : null}</td>
                <td>{p.producer.name}</td>
                <td><Badge tone={p.status === "RECEIVED" ? "red" : "line"}>{p.status}</Badge></td>
                <td>{p.items.map((i) => <div key={i.id}>{i.product.name} · {i.quantity} {i.unit}</div>)}</td>
                <td className="tnum">{formatMoney(p.items.reduce((s, i) => s + i.unitCostMinor * i.quantity, 0))}</td>
                <td>{p.receivedAt?.toLocaleDateString("en-GB") ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </>
  );
}
