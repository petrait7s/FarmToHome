import Link from "next/link";
import { db } from "@/lib/db";
import type { BatchStatus, Prisma } from "@/generated/prisma/client";
import { Badge, Empty, PageHeader, Pager } from "@/components/admin/AdminUI";

export const metadata = { title: "Batches" };

const STATUSES: BatchStatus[] = ["RECEIVED", "INSPECTING", "APPROVED", "REJECTED", "PROCESSING", "PACKED", "ACTIVE", "DEPLETED", "RECALLED"];

export default async function Batches({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; product?: string; page?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where: Prisma.BatchWhereInput = {};
  if (sp.status && STATUSES.includes(sp.status as BatchStatus)) where.status = sp.status as BatchStatus;
  if (sp.product) where.productId = sp.product;
  if (sp.q?.trim()) where.OR = [{ batchNumber: { contains: sp.q.trim().toUpperCase() } }, { product: { name: { contains: sp.q.trim(), mode: "insensitive" } } }];
  const [rows, count] = await Promise.all([
    db.batch.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * 30, take: 30, include: { product: { select: { name: true } }, producer: { select: { name: true } }, inventory: true, _count: { select: { inspections: true, reports: true } } } }),
    db.batch.count({ where }),
  ]);
  return (
    <>
      <PageHeader title="Batches & quality control" subtitle={`${count} batches`} />
      <form className="surface" style={{ padding: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end", marginBottom: 16 }}>
        <div className="field" style={{ flex: 1, minWidth: 180 }}><label className="label" htmlFor="q">Search</label><input id="q" name="q" className="input" defaultValue={sp.q ?? ""} placeholder="Batch number or product" /></div>
        <div className="field"><label className="label" htmlFor="status">Status</label><select id="status" name="status" className="select" defaultValue={sp.status ?? ""}><option value="">All</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
        <button className="btn btn-sm btn-primary">Filter</button>
      </form>
      {rows.length === 0 ? <Empty>No batches.</Empty> : (
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Batch</th><th>Product</th><th>Producer</th><th>Status</th><th>Collected</th><th>QC</th><th>Stock (on hand / reserved)</th></tr></thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id}>
                <td><Link className="link mono" href={`/admin/batches/${b.id}`}>{b.batchNumber}</Link> {b.isDemo ? <Badge>demo</Badge> : null}</td>
                <td>{b.product.name}</td><td>{b.producer?.name ?? "—"}</td>
                <td><Badge tone={["ACTIVE", "APPROVED", "PACKED"].includes(b.status) ? "red" : "line"}>{b.status}</Badge></td>
                <td>{b.collectedAt?.toLocaleDateString("en-GB") ?? "—"}</td>
                <td>{b._count.inspections} insp. · {b._count.reports} reports</td>
                <td className="tnum">{b.inventory.reduce((s, i) => s + i.onHand, 0)} / {b.inventory.reduce((s, i) => s + i.reserved, 0)}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
      <Pager page={page} pages={Math.ceil(count / 30)} base={`/admin/batches?${new URLSearchParams(Object.entries({ q: sp.q, status: sp.status, product: sp.product }).filter(([, v]) => v) as [string, string][]).toString()}`} />
    </>
  );
}
