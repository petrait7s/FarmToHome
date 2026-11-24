import Link from "next/link";
import { db } from "@/lib/db";
import { saveOrigin } from "@/app/actions/admin/catalog";
import { Badge, Card, F, Flash, FormGrid, PageHeader } from "@/components/admin/AdminUI";

export const metadata = { title: "Producers" };

export default async function Producers({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const producers = await db.producer.findMany({ orderBy: { name: "asc" }, include: { origin: true, _count: { select: { products: true, batches: true, procurements: true } } } });
  return (
    <>
      <PageHeader title="Producers" subtitle="Profiles, verification status and sourcing records." actions={<Link href="/admin/producers/new" className="btn btn-primary btn-sm">New producer</Link>} />
      <Flash sp={sp} />
      <div className="table-wrap"><table className="table">
        <thead><tr><th>Producer</th><th>Origin</th><th>Verification</th><th>Products</th><th>Procurements</th><th>Batches</th></tr></thead>
        <tbody>
          {producers.map((p) => (
            <tr key={p.id}>
              <td><Link className="link" href={`/admin/producers/${p.id}`}>{p.name}</Link> {p.isDemo ? <Badge>demo</Badge> : null} {p.active ? null : <Badge tone="line">inactive</Badge>}<br /><span className="muted-note">{p.craft}</span></td>
              <td>{p.village ? `${p.village}, ` : ""}{p.origin.district}</td>
              <td><Badge tone={p.verificationStatus === "VERIFIED" ? "red" : "line"}>{p.verificationStatus}</Badge></td>
              <td>{p._count.products}</td><td>{p._count.procurements}</td><td>{p._count.batches}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
      <Card title="Add or update an origin district">
        <form action={saveOrigin}>
          <FormGrid>
            <F label="Slug" name="slug" required placeholder="e.g. kushtia" />
            <F label="District" name="district" required />
            <F label="Division" name="division" required />
            <F label="Region" name="region" />
            <F label="Description" name="description" type="textarea" wide />
          </FormGrid>
          <button className="btn btn-sm" style={{ marginTop: 12 }}>Save origin</button>
        </form>
      </Card>
    </>
  );
}
