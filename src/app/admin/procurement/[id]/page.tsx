import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { cancelProcurement, createProcurement, receiveProcurement } from "@/app/actions/admin/sourcing";
import { Badge, Card, F, Flash, FormGrid, PageHeader } from "@/components/admin/AdminUI";

export const metadata = { title: "Procurement" };

export default async function ProcurementDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  if (id === "new") {
    const [producers, products] = await Promise.all([
      db.producer.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
      db.product.findMany({ where: { status: { not: "ARCHIVED" } }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    ]);
    return (
      <>
        <PageHeader back={{ href: "/admin/procurement", label: "Procurement" }} title="Plan procurement" subtitle="Record what you are buying, at what price, and the fair market reference used for the producer premium." />
        <Flash sp={sp} />
        <Card>
          <form action={createProcurement}>
            <FormGrid>
              <F label="Producer" name="producerId" required options={producers.map((p) => ({ value: p.id, label: p.name }))} />
              <F label="Demo record" name="isDemo" type="checkbox" />
              <F label="Notes" name="notes" type="textarea" wide />
            </FormGrid>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="surface" style={{ padding: 12, marginTop: 10 }}>
                <p className="label" style={{ marginBottom: 8 }}>Item {i + 1}{i > 0 ? " (optional)" : ""}</p>
                <FormGrid>
                  <F label="Product" name={`productId${i}`} required={i === 0} options={[{ value: "", label: "—" }, ...products.map((p) => ({ value: p.id, label: p.name }))]} />
                  <F label="Quantity" name={`quantity${i}`} type="number" step="0.01" required={i === 0} />
                  <F label="Unit" name={`unit${i}`} options={["kg", "g", "L", "ml", "pc"].map((u) => ({ value: u, label: u }))} required={i === 0} />
                  <F label="Unit cost paid (BDT)" name={`unitCost${i}`} type="number" step="0.01" required={i === 0} />
                  <F label="Fair market reference (BDT per unit)" name={`marketRef${i}`} type="number" step="0.01" hint="Used to report the producer premium honestly." />
                </FormGrid>
              </div>
            ))}
            <button className="btn btn-primary" style={{ marginTop: 14 }}>Create procurement</button>
          </form>
        </Card>
      </>
    );
  }
  const p = await db.procurement.findUnique({ where: { id }, include: { producer: true, items: { include: { product: true, batches: true } } } });
  if (!p) notFound();
  return (
    <>
      <PageHeader back={{ href: "/admin/procurement", label: "Procurement" }} title={p.reference} subtitle={<><Link className="link" href={`/admin/producers/${p.producerId}`}>{p.producer.name}</Link> · {p.notes ?? ""}</>} actions={<Badge tone={p.status === "RECEIVED" ? "red" : "line"}>{p.status}</Badge>} />
      <Flash sp={sp} />
      <Card title="Items">
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Product</th><th>Quantity</th><th>Unit cost</th><th>Market reference</th><th>Premium</th><th>Batches</th></tr></thead>
          <tbody>
            {p.items.map((i) => {
              const premium = i.marketReferenceMinor ? Math.round((i.unitCostMinor / i.marketReferenceMinor - 1) * 100) : null;
              return (
                <tr key={i.id}>
                  <td>{i.product.name}</td><td>{i.quantity} {i.unit}</td><td className="tnum">{formatMoney(i.unitCostMinor)}</td>
                  <td className="tnum">{i.marketReferenceMinor ? formatMoney(i.marketReferenceMinor) : "—"}</td>
                  <td>{premium === null ? "—" : <Badge tone={premium >= 30 ? "red" : "line"}>{premium >= 0 ? "+" : ""}{premium}%</Badge>}</td>
                  <td>{i.batches.map((b) => <Link key={b.id} className="link mono" href={`/admin/batches/${b.id}`} style={{ display: "block" }}>{b.batchNumber}</Link>)}</td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
        <p className="muted-note" style={{ marginTop: 10 }}>Sourcing principle: aim to pay participating farmers at least 30% above the fair market reference, subject to product economics and verified sourcing.</p>
      </Card>
      {p.status === "PLANNED" ? (
        <Card title="Receive goods">
          <form action={receiveProcurement} style={{ display: "flex", gap: 10, alignItems: "end", flexWrap: "wrap" }}>
            <input type="hidden" name="id" value={p.id} />
            <F label="Received / collected on" name="receivedAt" type="datetime-local" />
            <button className="btn btn-primary btn-sm">Mark received &amp; create batches</button>
          </form>
          <form action={cancelProcurement} style={{ marginTop: 10 }}><input type="hidden" name="id" value={p.id} /><button className="btn btn-ghost btn-sm">Cancel procurement</button></form>
        </Card>
      ) : null}
    </>
  );
}
