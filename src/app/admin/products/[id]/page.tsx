import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { addProductImage, deleteProduct, removeProductImage, saveProduct, saveVariant } from "@/app/actions/admin/catalog";
import { availableByVariant } from "@/server/inventory/availability";
import { ART_TYPES } from "@/components/ui/productArt";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { Badge, Card, F, Flash, FormGrid, PageHeader } from "@/components/admin/AdminUI";

export const metadata = { title: "Product" };

export default async function ProductEdit({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const isNew = id === "new";
  const [product, categories, producers, origins] = await Promise.all([
    isNew ? null : db.product.findUnique({ where: { id }, include: { variants: { orderBy: { position: "asc" } }, images: { orderBy: { position: "asc" } }, batches: { orderBy: { createdAt: "desc" }, take: 8 } } }),
    db.category.findMany({ orderBy: { position: "asc" } }),
    db.producer.findMany({ orderBy: { name: "asc" } }),
    db.origin.findMany({ orderBy: { district: "asc" } }),
  ]);
  if (!isNew && !product) notFound();
  const p = product;
  const avail = p ? await availableByVariant(p.variants.map((v) => v.id)) : new Map();
  const artOptions = ART_TYPES.flatMap((t) => [0, 1, 2, 3].map((v) => ({ value: `${t}:${v}`, label: `${t} ${v}` })));

  return (
    <>
      <PageHeader back={{ href: "/admin/products", label: "Products" }} title={isNew ? "New product" : p!.name}
        actions={p ? <><Link className="btn btn-sm" href={`/products/${p.slug}`} target="_blank">View in store</Link><ConfirmButton action={deleteProduct} fields={{ id: p.id }} label="Delete / archive" confirm="Delete this product? If it has orders or batches it will be archived instead." /></> : null} />
      <Flash sp={sp} />
      <Card title="Details">
        <form action={saveProduct}>
          {p ? <input type="hidden" name="id" value={p.id} /> : null}
          <FormGrid>
            <F label="Name" name="name" defaultValue={p?.name} required />
            <F label="Name (Bangla)" name="nameBn" defaultValue={p?.nameBn} />
            <F label="Slug" name="slug" defaultValue={p?.slug} required />
            <F label="Status" name="status" defaultValue={p?.status ?? "DRAFT"} required options={[{ value: "DRAFT", label: "Draft (hidden)" }, { value: "ACTIVE", label: "Active" }, { value: "ARCHIVED", label: "Archived" }]} />
            <F label="Category" name="categoryId" defaultValue={p?.categoryId} required options={categories.map((c) => ({ value: c.id, label: c.name }))} />
            <F label="Market fit" name="marketFit" defaultValue={p?.marketFit ?? "BOTH"} required options={[{ value: "WEEKLY", label: "Weekly Market only" }, { value: "MONTHLY", label: "Monthly Stock only" }, { value: "BOTH", label: "Both" }]} />
            <F label="Producer" name="producerId" defaultValue={p?.producerId ?? ""} options={[{ value: "", label: "—" }, ...producers.map((x) => ({ value: x.id, label: x.name }))]} />
            <F label="Origin district" name="originId" defaultValue={p?.originId ?? ""} options={[{ value: "", label: "—" }, ...origins.map((o) => ({ value: o.id, label: o.district }))]} />
            <F label="Summary" name="summary" defaultValue={p?.summary} required />
            <F label="Summary (Bangla)" name="summaryBn" defaultValue={p?.summaryBn} />
            <F label="Description" name="description" type="textarea" defaultValue={p?.description} required />
            <F label="Description (Bangla)" name="descriptionBn" type="textarea" defaultValue={p?.descriptionBn} />
            <F label="Production / collection story" name="story" type="textarea" defaultValue={p?.story} />
            <F label="Story (Bangla)" name="storyBn" type="textarea" defaultValue={p?.storyBn} />
            <F label="Origin class" name="originClass" defaultValue={p?.originClass} placeholder="O1 / O2 / O3" />
            <F label="Quality grade" name="qualityGrade" defaultValue={p?.qualityGrade} />
            <F label="Processing information" name="processingInfo" type="textarea" rows={2} defaultValue={p?.processingInfo} />
            <F label="Packaging information" name="packagingInfo" type="textarea" rows={2} defaultValue={p?.packagingInfo} />
            <F label="Storage instructions" name="storageInfo" type="textarea" rows={2} defaultValue={p?.storageInfo} />
            <F label="Food handling" name="handlingInfo" type="textarea" rows={2} defaultValue={p?.handlingInfo} />
            <F label="Household use per person per week" name="householdUsePerPersonWeek" type="number" step="0.01" defaultValue={p?.householdUsePerPersonWeek} hint="Used only for quantity hints. Leave empty if not applicable." />
            <F label="Household use unit" name="householdUseUnit" defaultValue={p?.householdUseUnit} placeholder="kg or L" />
            <F label="Illustration fallback (used until a photo is uploaded)" name="artKey" defaultValue={p?.artKey ?? "grain:0"} options={artOptions} />
            <div />
            <F label="Essential (suggested in markets)" name="isEssential" type="checkbox" checked={p?.isEssential} />
            <F label="Seasonal" name="isSeasonal" type="checkbox" checked={p?.isSeasonal} />
            <F label="New arrival" name="isNew" type="checkbox" checked={p?.isNew} />
            <F label="Featured" name="isFeatured" type="checkbox" checked={p?.isFeatured} />
            <F label="Perishable" name="isPerishable" type="checkbox" checked={p?.isPerishable} />
            <F label="Demo data (labelled in the storefront)" name="isDemo" type="checkbox" checked={p?.isDemo ?? false} />
          </FormGrid>
          <button className="btn btn-primary" style={{ marginTop: 14 }}>{isNew ? "Create product" : "Save product"}</button>
        </form>
      </Card>

      {p ? (
        <>
          <Card title="Variants, pricing & SKUs">
            <p className="muted-note" style={{ marginBottom: 10 }}>Stock is managed through batches and inventory movements, not edited here.</p>
            {p.variants.map((v) => (
              <form key={v.id} action={saveVariant} className="surface" style={{ padding: 14, marginBottom: 10 }}>
                <input type="hidden" name="id" value={v.id} /><input type="hidden" name="productId" value={p.id} />
                <p style={{ marginBottom: 8 }}><b>{v.label}</b> · {avail.get(v.id) === null ? "sourced to order" : `${avail.get(v.id) ?? 0} available`} {v.active ? null : <Badge tone="line">inactive</Badge>}</p>
                <VariantFields v={{ ...v, price: v.priceMinor / 100, compareAt: v.compareAtMinor ? v.compareAtMinor / 100 : null }} />
                <button className="btn btn-sm" style={{ marginTop: 10 }}>Save variant</button>
              </form>
            ))}
            <form action={saveVariant} className="surface" style={{ padding: 14 }}>
              <input type="hidden" name="productId" value={p.id} />
              <p style={{ marginBottom: 8 }}><b>Add variant</b></p>
              <VariantFields v={{ position: p.variants.length, active: true, unit: "kg", fulfillmentMode: "STOCK", lowStockThreshold: 10 }} />
              <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }}>Add variant</button>
            </form>
          </Card>

          <Card title="Images">
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
              {p.images.length === 0 ? <><ProductVisual artKey={p.artKey} alt="" size="md" /><p className="muted-note">No photos yet — the illustration fallback is shown.</p></> : p.images.map((img) => (
                <div key={img.id} style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
                  <ProductVisual imageUrl={img.url} alt={img.alt} size="md" />
                  <ConfirmButton action={removeProductImage} fields={{ id: img.id }} label="Remove" confirm="Remove this image?" />
                </div>
              ))}
            </div>
            <form action={addProductImage} encType="multipart/form-data">
              <input type="hidden" name="productId" value={p.id} />
              <FormGrid>
                <F label="Image (JPEG/PNG/WebP, max 5 MB)" name="file" type="file" accept="image/jpeg,image/png,image/webp" required />
                <F label="Alt text" name="alt" required placeholder="Describe the photo" />
              </FormGrid>
              <button className="btn btn-sm" style={{ marginTop: 10 }}>Upload image</button>
            </form>
          </Card>

          <Card title="Recent batches" actions={<Link className="link" href={`/admin/batches?product=${p.id}`}>All batches</Link>}>
            {p.batches.length === 0 ? <p className="muted-note">No batches yet. Create one from Procurement.</p> : (
              <ul style={{ listStyle: "none", display: "grid", gap: 6 }}>{p.batches.map((b) => <li key={b.id}><Link className="link mono" href={`/admin/batches/${b.id}`}>{b.batchNumber}</Link> · {b.status}</li>)}</ul>
            )}
          </Card>
        </>
      ) : null}
    </>
  );
}

function VariantFields({ v }: { v: Partial<{ sku: string; label: string; labelBn: string | null; netQuantity: number; unit: string; price: number; compareAt: number | null; position: number; fulfillmentMode: string; lowStockThreshold: number; active: boolean }> }) {
  return (
    <FormGrid>
      <F label="Label" name="label" defaultValue={v.label} required placeholder="5 kg" />
      <F label="Label (Bangla)" name="labelBn" defaultValue={v.labelBn} />
      <F label="SKU" name="sku" defaultValue={v.sku} required />
      <F label="Price (BDT)" name="price" type="number" step="0.01" defaultValue={v.price} required />
      <F label="Net quantity" name="netQuantity" type="number" step="0.001" defaultValue={v.netQuantity} required />
      <F label="Unit" name="unit" defaultValue={v.unit} required options={["g", "kg", "ml", "L", "pc"].map((u) => ({ value: u, label: u }))} />
      <F label="Compare-at price (BDT)" name="compareAt" type="number" step="0.01" defaultValue={v.compareAt} />
      <F label="Fulfilment" name="fulfillmentMode" defaultValue={v.fulfillmentMode} required options={[{ value: "STOCK", label: "From stock (reserved at checkout)" }, { value: "SOURCED_TO_ORDER", label: "Sourced after order" }]} />
      <F label="Low-stock threshold" name="lowStockThreshold" type="number" defaultValue={v.lowStockThreshold} required />
      <F label="Position" name="position" type="number" defaultValue={v.position ?? 0} required />
      <F label="Active" name="active" type="checkbox" checked={v.active ?? true} />
    </FormGrid>
  );
}
