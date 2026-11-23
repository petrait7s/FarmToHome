import Link from "next/link";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import type { Prisma, ProductStatus } from "@/generated/prisma/client";
import { availableByVariant } from "@/server/inventory/availability";
import { Badge, Empty, Flash, PageHeader } from "@/components/admin/AdminUI";
import { ProductVisual } from "@/components/ui/ProductVisual";

export const metadata = { title: "Products" };

export default async function Products({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; category?: string; ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const where: Prisma.ProductWhereInput = {};
  if (sp.status && ["DRAFT", "ACTIVE", "ARCHIVED"].includes(sp.status)) where.status = sp.status as ProductStatus;
  if (sp.category) where.categoryId = sp.category;
  if (sp.q?.trim()) where.OR = [{ name: { contains: sp.q.trim(), mode: "insensitive" } }, { variants: { some: { sku: { contains: sp.q.trim().toUpperCase() } } } }];
  const [products, categories] = await Promise.all([
    db.product.findMany({ where, orderBy: [{ category: { position: "asc" } }, { name: "asc" }], include: { category: true, producer: true, variants: { orderBy: { position: "asc" } }, images: { take: 1 } } }),
    db.category.findMany({ orderBy: { position: "asc" } }),
  ]);
  const avail = await availableByVariant(products.flatMap((p) => p.variants.map((v) => v.id)));
  return (
    <>
      <PageHeader title="Products" subtitle={`${products.length} products`} actions={<Link href="/admin/products/new" className="btn btn-primary btn-sm">New product</Link>} />
      <Flash sp={sp} />
      <form className="surface" style={{ padding: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end", marginBottom: 16 }}>
        <div className="field" style={{ flex: 1, minWidth: 180 }}><label className="label" htmlFor="q">Search</label><input id="q" name="q" className="input" defaultValue={sp.q ?? ""} placeholder="Name or SKU" /></div>
        <div className="field"><label className="label" htmlFor="category">Category</label><select id="category" name="category" className="select" defaultValue={sp.category ?? ""}><option value="">All</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div className="field"><label className="label" htmlFor="status">Status</label><select id="status" name="status" className="select" defaultValue={sp.status ?? ""}><option value="">All</option><option>ACTIVE</option><option>DRAFT</option><option>ARCHIVED</option></select></div>
        <button className="btn btn-sm btn-primary">Filter</button>
      </form>
      {products.length === 0 ? <Empty>No products.</Empty> : (
        <div className="table-wrap"><table className="table">
          <thead><tr><th></th><th>Product</th><th>Category</th><th>Variants (price · available)</th><th>Status</th></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td><ProductVisual artKey={p.artKey} imageUrl={p.images[0]?.url} alt="" size="sm" /></td>
                <td><Link className="link" href={`/admin/products/${p.id}`}>{p.name}</Link> {p.isDemo ? <Badge>demo</Badge> : null}<br /><span className="muted-note">{p.producer?.name ?? "no producer"} · {p.marketFit}</span></td>
                <td>{p.category.name}</td>
                <td>{p.variants.map((v) => {
                  const a = avail.get(v.id);
                  return <div key={v.id} style={{ opacity: v.active ? 1 : 0.5 }}>{v.label} · {formatMoney(v.priceMinor)} · {a === null ? "sourced to order" : `${a ?? 0} avail.`}{a !== null && (a ?? 0) <= v.lowStockThreshold ? <> <Badge tone="red">low</Badge></> : null}</div>;
                })}</td>
                <td><Badge tone={p.status === "ACTIVE" ? "red" : "line"}>{p.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </>
  );
}
