import Link from "next/link";
import { db } from "@/lib/db";
import { Badge, Card, Flash, PageHeader } from "@/components/admin/AdminUI";

export const metadata = { title: "Inventory" };

export default async function Inventory({ searchParams }: { searchParams: Promise<{ low?: string; ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const variants = await db.productVariant.findMany({
    where: { product: { status: { not: "ARCHIVED" } } },
    orderBy: [{ product: { name: "asc" } }, { position: "asc" }],
    include: { product: { select: { id: true, name: true } }, inventory: { include: { batch: { select: { id: true, batchNumber: true, status: true } } } } },
  });
  const rows = variants
    .map((v) => {
      const onHand = v.inventory.reduce((s, i) => s + i.onHand, 0);
      const reserved = v.inventory.reduce((s, i) => s + i.reserved, 0);
      return { v, onHand, reserved, available: onHand - reserved };
    })
    .filter((r) => !sp.low || (r.v.fulfillmentMode === "STOCK" && r.available <= r.v.lowStockThreshold));
  const movements = await db.inventoryMovement.findMany({ orderBy: { createdAt: "desc" }, take: 25, include: { variant: { include: { product: { select: { name: true } } } }, batch: { select: { id: true, batchNumber: true } }, actor: { select: { name: true } } } });
  return (
    <>
      <PageHeader title="Inventory" subtitle="Stock is held per variant and batch. Every change is a recorded movement; nothing is overwritten." actions={<Link className="btn btn-sm" href={sp.low ? "/admin/inventory" : "/admin/inventory?low=1"}>{sp.low ? "Show all" : "Low stock only"}</Link>} />
      <Flash sp={sp} />
      <div className="table-wrap"><table className="table">
        <thead><tr><th>Product · variant</th><th>Mode</th><th>On hand</th><th>Reserved</th><th>Available</th><th>Batches</th></tr></thead>
        <tbody>
          {rows.map(({ v, onHand, reserved, available }) => (
            <tr key={v.id}>
              <td><Link className="link" href={`/admin/products/${v.product.id}`}>{v.product.name}</Link> <span className="muted-note">{v.label} · {v.sku}</span></td>
              <td>{v.fulfillmentMode === "STOCK" ? "stock" : "sourced to order"}</td>
              <td className="tnum">{onHand}</td><td className="tnum">{reserved}</td>
              <td className="tnum">{v.fulfillmentMode === "STOCK" ? <Badge tone={available <= v.lowStockThreshold ? "red" : "line"}>{available}</Badge> : "—"}</td>
              <td>{v.inventory.filter((i) => i.onHand > 0 || i.reserved > 0).map((i) => <div key={i.id}><Link className="link mono" href={`/admin/batches/${i.batch.id}`}>{i.batch.batchNumber}</Link> {i.onHand}/{i.reserved}</div>)}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
      <p className="muted-note" style={{ margin: "10px 0 24px" }}>To add or remove stock, open the batch and record a movement (packed units received, damaged, expired, returned or a manual adjustment).</p>
      <Card title="Latest movements">
        <div className="table-wrap"><table className="table"><tbody>
          {movements.map((m) => (
            <tr key={m.id}>
              <td>{m.createdAt.toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })}</td>
              <td>{m.variant.product.name} <span className="muted-note">{m.variant.label}</span></td>
              <td>{m.type}</td><td className="tnum">{m.quantity > 0 ? "+" : ""}{m.quantity}</td>
              <td>{m.batch ? <Link className="link mono" href={`/admin/batches/${m.batch.id}`}>{m.batch.batchNumber}</Link> : "—"}</td>
              <td className="muted-note">{m.reason} · {m.actor?.name ?? "customer/system"}</td>
            </tr>
          ))}
        </tbody></table></div>
      </Card>
    </>
  );
}
