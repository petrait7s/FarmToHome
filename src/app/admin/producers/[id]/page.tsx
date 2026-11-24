import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { saveProducer } from "@/app/actions/admin/catalog";
import { Card, F, Flash, FormGrid, PageHeader } from "@/components/admin/AdminUI";

export const metadata = { title: "Producer" };

export default async function ProducerEdit({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const isNew = id === "new";
  const [producer, origins] = await Promise.all([
    isNew ? null : db.producer.findUnique({ where: { id }, include: { procurements: { orderBy: { createdAt: "desc" }, take: 10, include: { items: { include: { product: { select: { name: true } } } } } }, products: { select: { id: true, name: true } } } }),
    db.origin.findMany({ orderBy: { district: "asc" } }),
  ]);
  if (!isNew && !producer) notFound();
  const p = producer;
  return (
    <>
      <PageHeader back={{ href: "/admin/producers", label: "Producers" }} title={isNew ? "New producer" : p!.name} />
      <Flash sp={sp} />
      <Card>
        <form action={saveProducer} encType="multipart/form-data">
          {p ? <input type="hidden" name="id" value={p.id} /> : null}
          <FormGrid>
            <F label="Name" name="name" defaultValue={p?.name} required />
            <F label="Name (Bangla)" name="nameBn" defaultValue={p?.nameBn} />
            <F label="Slug" name="slug" defaultValue={p?.slug} required />
            <F label="Craft" name="craft" defaultValue={p?.craft} placeholder="e.g. Ghani oil presser" />
            <F label="Craft (বাংলা)" name="craftBn" defaultValue={p?.craftBn} placeholder="যেমন ঘানির তেল ভাঙানো কারিগর" />
            <F label="Village / place" name="village" defaultValue={p?.village} />
            <F label="Origin district" name="originId" defaultValue={p?.originId} required options={origins.map((o) => ({ value: o.id, label: `${o.district}, ${o.division}` }))} />
            <F label="Verification status" name="verificationStatus" defaultValue={p?.verificationStatus ?? "UNVERIFIED"} required options={[{ value: "UNVERIFIED", label: "Unverified" }, { value: "PENDING", label: "Pending" }, { value: "VERIFIED", label: "Verified (records confirmed)" }]} hint="Only mark Verified when sourcing records and consent are confirmed." />
            <F label="Contact phone (staff only)" name="contactPhone" defaultValue={p?.contactPhone} />
            <F label="Quote" name="quote" defaultValue={p?.quote} wide />
            <F label="Story" name="story" type="textarea" defaultValue={p?.story} />
            <F label="Story (Bangla)" name="storyBn" type="textarea" defaultValue={p?.storyBn} />
            <F label="Contact / sourcing notes (staff only)" name="contactNotes" type="textarea" defaultValue={p?.contactNotes} wide />
            <F label="Photograph (JPEG/PNG/WebP, max 5 MB)" name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
            <div />
            <F label="Active" name="active" type="checkbox" checked={p?.active ?? true} />
            <F label="Demo data (labelled in the storefront)" name="isDemo" type="checkbox" checked={p?.isDemo ?? false} />
          </FormGrid>
          <button className="btn btn-primary" style={{ marginTop: 14 }}>Save producer</button>
        </form>
      </Card>
      {p ? (
        <Card title="Sourcing records" actions={<Link className="link" href={`/admin/procurement?producer=${p.id}`}>Procurement</Link>}>
          {p.procurements.length === 0 ? <p className="muted-note">No procurements recorded.</p> : (
            <div className="table-wrap"><table className="table"><tbody>
              {p.procurements.map((pr) => (
                <tr key={pr.id}>
                  <td className="mono">{pr.reference}</td><td>{pr.status}</td><td>{pr.receivedAt?.toLocaleDateString("en-GB") ?? "—"}</td>
                  <td>{pr.items.map((i) => {
                    const premium = i.marketReferenceMinor ? Math.round((i.unitCostMinor / i.marketReferenceMinor - 1) * 100) : null;
                    return <div key={i.id}>{i.product.name}: {i.quantity} {i.unit} @ {formatMoney(i.unitCostMinor)}{premium !== null ? <span className="muted-note"> (reference {formatMoney(i.marketReferenceMinor!)}, {premium >= 0 ? "+" : ""}{premium}%)</span> : null}</div>;
                  })}</td>
                </tr>
              ))}
            </tbody></table></div>
          )}
        </Card>
      ) : null}
    </>
  );
}
