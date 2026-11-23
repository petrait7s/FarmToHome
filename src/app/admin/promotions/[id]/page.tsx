import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { savePromotion } from "@/app/actions/admin/operations";
import { Card, F, Flash, FormGrid, PageHeader } from "@/components/admin/AdminUI";

export const metadata = { title: "Promotion" };

const dt = (d: Date | null) => (d ? d.toISOString().slice(0, 16) : "");

export default async function PromotionEdit({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const isNew = id === "new";
  const [p, products, categories] = await Promise.all([
    isNew ? null : db.promotion.findUnique({ where: { id }, include: { products: { select: { id: true } }, categories: { select: { id: true } }, redemptions: { orderBy: { createdAt: "desc" }, take: 20, include: { order: { select: { reference: true } } } } } }),
    db.product.findMany({ where: { status: { not: "ARCHIVED" } }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.category.findMany({ orderBy: { position: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!isNew && !p) notFound();
  const selP = new Set(p?.products.map((x) => x.id)), selC = new Set(p?.categories.map((x) => x.id));
  return (
    <>
      <PageHeader back={{ href: "/admin/promotions", label: "Promotions" }} title={isNew ? "New promotion" : p!.code} />
      <Flash sp={sp} />
      <Card>
        <form action={savePromotion}>
          {p ? <input type="hidden" name="id" value={p.id} /> : null}
          <FormGrid>
            <F label="Code" name="code" defaultValue={p?.code} required />
            <F label="Type" name="type" defaultValue={p?.type ?? "PERCENT"} required options={[{ value: "PERCENT", label: "Percentage" }, { value: "FIXED", label: "Fixed amount (BDT)" }]} />
            <F label="Value (percent, or BDT for fixed)" name="value" type="number" step="0.01" defaultValue={p ? (p.type === "PERCENT" ? p.value : p.value / 100) : ""} required />
            <F label="Maximum discount (BDT)" name="maxDiscount" type="number" step="0.01" defaultValue={p?.maxDiscountMinor ? p.maxDiscountMinor / 100 : ""} />
            <F label="Minimum subtotal (BDT)" name="minSubtotal" type="number" step="0.01" defaultValue={p?.minSubtotalMinor ? p.minSubtotalMinor / 100 : ""} />
            <F label="Total usage limit" name="usageLimit" type="number" defaultValue={p?.usageLimit ?? ""} />
            <F label="Per-customer limit" name="perCustomerLimit" type="number" defaultValue={p?.perCustomerLimit ?? ""} />
            <F label="Active" name="active" type="checkbox" checked={p?.active ?? true} />
            <F label="Starts" name="startsAt" type="datetime-local" defaultValue={dt(p?.startsAt ?? null)} />
            <F label="Expires" name="endsAt" type="datetime-local" defaultValue={dt(p?.endsAt ?? null)} />
            <F label="Description (internal)" name="description" defaultValue={p?.description} wide />
          </FormGrid>
          <fieldset style={{ border: 0, marginTop: 16 }}>
            <legend className="label">Restrict to categories (optional)</legend>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
              {categories.map((c) => <label key={c.id} className="check"><input type="checkbox" name="categoryIds" value={c.id} defaultChecked={selC.has(c.id)} />{c.name}</label>)}
            </div>
          </fieldset>
          <fieldset style={{ border: 0, marginTop: 16 }}>
            <legend className="label">Restrict to products (optional)</legend>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8, marginTop: 8 }}>
              {products.map((x) => <label key={x.id} className="check"><input type="checkbox" name="productIds" value={x.id} defaultChecked={selP.has(x.id)} />{x.name}</label>)}
            </div>
          </fieldset>
          <button className="btn btn-primary" style={{ marginTop: 16 }}>Save promotion</button>
        </form>
      </Card>
      {p?.redemptions.length ? (
        <Card title="Recent redemptions">
          <ul style={{ listStyle: "none", display: "grid", gap: 6 }}>{p.redemptions.map((r) => <li key={r.id} className="mono">{r.order.reference} · {r.phone} · {(r.amountMinor / 100).toFixed(2)}</li>)}</ul>
        </Card>
      ) : null}
    </>
  );
}
