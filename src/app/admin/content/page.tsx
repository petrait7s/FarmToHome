import Link from "next/link";
import { db } from "@/lib/db";
import { saveCollection, saveFaq, savePage, saveSection } from "@/app/actions/admin/system";
import { Badge, Card, F, Flash, FormGrid, PageHeader } from "@/components/admin/AdminUI";

export const metadata = { title: "Content" };

const dt = (d: Date | null) => (d ? d.toISOString().slice(0, 16) : "");

export default async function Content({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const [sections, faqs, pages, collections, products] = await Promise.all([
    db.contentSection.findMany({ orderBy: { key: "asc" } }),
    db.faqItem.findMany({ orderBy: { position: "asc" } }),
    db.page.findMany({ orderBy: { slug: "asc" } }),
    db.collection.findMany({ orderBy: { position: "asc" }, include: { products: { select: { productId: true } } } }),
    db.product.findMany({ where: { status: { not: "ARCHIVED" } }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return (
    <>
      <PageHeader title="Content" subtitle="Homepage sections, collections and seasonal campaigns, FAQ and policy pages (English and Bangla)." />
      <Flash sp={sp} />
      <Card title="Homepage sections">
        <p className="muted-note" style={{ marginBottom: 10 }}>Keys used by the homepage: <code>home.hero</code>, <code>home.pilot</code>.</p>
        {[...sections, null].map((s) => (
          <details key={s?.id ?? "new"} className="surface" style={{ padding: 14, marginBottom: 10 }} open={!s && sections.length === 0}>
            <summary style={{ cursor: "pointer" }}><b>{s ? s.key : "New section"}</b> {s ? <span className="muted-note">· {s.title}</span> : null} {s && !s.active ? <Badge tone="line">hidden</Badge> : null}</summary>
            <form action={saveSection} style={{ marginTop: 12 }}>
              <FormGrid>
                <F label="Key" name="key" defaultValue={s?.key} required />
                <F label="Active" name="active" type="checkbox" checked={s?.active ?? true} />
                <F label="Eyebrow" name="eyebrow" defaultValue={s?.eyebrow} /><F label="Eyebrow (Bangla)" name="eyebrowBn" defaultValue={s?.eyebrowBn} />
                <F label="Title" name="title" defaultValue={s?.title} required /><F label="Title (Bangla)" name="titleBn" defaultValue={s?.titleBn} />
                <F label="Body" name="body" type="textarea" defaultValue={s?.body} /><F label="Body (Bangla)" name="bodyBn" type="textarea" defaultValue={s?.bodyBn} />
                <F label="Button label" name="ctaLabel" defaultValue={s?.ctaLabel} /><F label="Button label (Bangla)" name="ctaLabelBn" defaultValue={s?.ctaLabelBn} />
                <F label="Button link (internal path)" name="ctaHref" defaultValue={s?.ctaHref} placeholder="/market/weekly" />
              </FormGrid>
              <button className="btn btn-sm" style={{ marginTop: 10 }}>Save section</button>
            </form>
          </details>
        ))}
      </Card>

      <Card title="Collections & seasonal campaigns">
        {[...collections, null].map((c) => {
          const sel = new Set(c?.products.map((p) => p.productId));
          return (
            <details key={c?.id ?? "new"} className="surface" style={{ padding: 14, marginBottom: 10 }}>
              <summary style={{ cursor: "pointer" }}><b>{c ? c.title : "New collection"}</b> {c ? <span className="muted-note">· {c.products.length} products {c.featured ? "· featured" : ""}</span> : null} {c ? <Link className="link" href={`/explore?collection=${c.slug}`} target="_blank">view</Link> : null}</summary>
              <form action={saveCollection} style={{ marginTop: 12 }}>
                {c ? <input type="hidden" name="id" value={c.id} /> : null}
                <FormGrid>
                  <F label="Title" name="title" defaultValue={c?.title} required /><F label="Title (Bangla)" name="titleBn" defaultValue={c?.titleBn} />
                  <F label="Slug" name="slug" defaultValue={c?.slug} required /><F label="Position" name="position" type="number" defaultValue={c?.position ?? collections.length} required />
                  <F label="Description" name="description" defaultValue={c?.description} /><F label="Description (Bangla)" name="descriptionBn" defaultValue={c?.descriptionBn} />
                  <F label="Starts (campaign)" name="startsAt" type="datetime-local" defaultValue={dt(c?.startsAt ?? null)} /><F label="Ends (campaign)" name="endsAt" type="datetime-local" defaultValue={dt(c?.endsAt ?? null)} />
                  <F label="Featured on homepage" name="featured" type="checkbox" checked={c?.featured ?? true} /><F label="Active" name="active" type="checkbox" checked={c?.active ?? true} />
                </FormGrid>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 6, marginTop: 12 }}>
                  {products.map((p) => <label key={p.id} className="check"><input type="checkbox" name="productIds" value={p.id} defaultChecked={sel.has(p.id)} />{p.name}</label>)}
                </div>
                <button className="btn btn-sm" style={{ marginTop: 10 }}>Save collection</button>
              </form>
            </details>
          );
        })}
      </Card>

      <Card title="FAQ">
        {[...faqs, null].map((f) => (
          <details key={f?.id ?? "new"} className="surface" style={{ padding: 14, marginBottom: 10 }}>
            <summary style={{ cursor: "pointer" }}><b>{f ? f.question : "New question"}</b></summary>
            <form action={saveFaq} style={{ marginTop: 12 }}>
              {f ? <input type="hidden" name="id" value={f.id} /> : null}
              <FormGrid>
                <F label="Question" name="question" defaultValue={f?.question} required /><F label="Question (Bangla)" name="questionBn" defaultValue={f?.questionBn} />
                <F label="Answer" name="answer" type="textarea" defaultValue={f?.answer} required /><F label="Answer (Bangla)" name="answerBn" type="textarea" defaultValue={f?.answerBn} />
                <F label="Position" name="position" type="number" defaultValue={f?.position ?? faqs.length} required /><F label="Active" name="active" type="checkbox" checked={f?.active ?? true} />
              </FormGrid>
              <button className="btn btn-sm" style={{ marginTop: 10 }}>Save</button>
            </form>
          </details>
        ))}
      </Card>

      <Card title="Policy & editorial pages">
        {[...pages, null].map((p) => (
          <details key={p?.id ?? "new"} className="surface" style={{ padding: 14, marginBottom: 10 }}>
            <summary style={{ cursor: "pointer" }}><b>{p ? p.title : "New page"}</b> {p ? <span className="muted-note">/pages/{p.slug}</span> : null} {p && !p.published ? <Badge tone="line">draft</Badge> : null}</summary>
            <form action={savePage} style={{ marginTop: 12 }}>
              {p ? <input type="hidden" name="id" value={p.id} /> : null}
              <FormGrid>
                <F label="Title" name="title" defaultValue={p?.title} required /><F label="Title (Bangla)" name="titleBn" defaultValue={p?.titleBn} />
                <F label="Slug" name="slug" defaultValue={p?.slug} required /><F label="Published" name="published" type="checkbox" checked={p?.published ?? false} />
                <F label="Body (blank line between paragraphs)" name="body" type="textarea" rows={8} defaultValue={p?.body} required wide />
                <F label="Body (Bangla)" name="bodyBn" type="textarea" rows={6} defaultValue={p?.bodyBn} wide />
              </FormGrid>
              <button className="btn btn-sm" style={{ marginTop: 10 }}>Save page</button>
            </form>
          </details>
        ))}
      </Card>
    </>
  );
}
