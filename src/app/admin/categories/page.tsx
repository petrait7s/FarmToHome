import { db } from "@/lib/db";
import { saveCategory } from "@/app/actions/admin/catalog";
import { Badge, Card, F, Flash, FormGrid, PageHeader } from "@/components/admin/AdminUI";

export const metadata = { title: "Categories" };

export default async function Categories({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const cats = await db.category.findMany({ orderBy: { position: "asc" }, include: { _count: { select: { products: true } } } });
  return (
    <>
      <PageHeader title="Categories" subtitle="Order, names (English/Bangla), stories and visibility." />
      <Flash sp={sp} />
      {cats.map((c) => (
        <details key={c.id} className="surface" style={{ padding: 16, marginBottom: 10 }}>
          <summary style={{ cursor: "pointer", display: "flex", gap: 10, alignItems: "center" }}>
            <b className="serif" style={{ fontSize: 18, fontWeight: 500 }}>{c.position}. {c.name}</b> <span className="muted-note">{c.nameBn}</span>
            <span className="muted-note">· {c._count.products} products</span> {c.active ? null : <Badge tone="line">hidden</Badge>}
          </summary>
          <form action={saveCategory} style={{ marginTop: 14 }}>
            <input type="hidden" name="id" value={c.id} />
            <CategoryFields c={c} />
            <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>Save</button>
          </form>
        </details>
      ))}
      <Card title="New category">
        <form action={saveCategory}>
          <CategoryFields c={{ position: cats.length, active: true }} />
          <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>Create category</button>
        </form>
      </Card>
    </>
  );
}

function CategoryFields({ c }: { c: Partial<{ slug: string; name: string; nameBn: string | null; description: string | null; descriptionBn: string | null; story: string | null; storyBn: string | null; position: number; active: boolean }> }) {
  return (
    <FormGrid>
      <F label="Name" name="name" defaultValue={c.name} required />
      <F label="Name (Bangla)" name="nameBn" defaultValue={c.nameBn} />
      <F label="Slug" name="slug" defaultValue={c.slug} required hint="Used in URLs, e.g. rice-grains" />
      <F label="Position" name="position" type="number" defaultValue={c.position ?? 0} required />
      <F label="Short description" name="description" defaultValue={c.description} />
      <F label="Short description (Bangla)" name="descriptionBn" defaultValue={c.descriptionBn} />
      <F label="Story" name="story" type="textarea" defaultValue={c.story} />
      <F label="Story (Bangla)" name="storyBn" type="textarea" defaultValue={c.storyBn} />
      <F label="Active (visible in the storefront)" name="active" type="checkbox" checked={c.active ?? true} wide />
    </FormGrid>
  );
}
