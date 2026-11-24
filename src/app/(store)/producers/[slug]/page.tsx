import Link from "next/link";
import { notFound } from "next/navigation";
import { getT } from "@/i18n";
import { localized } from "@/i18n/shared";
import { db } from "@/lib/db";
import { productsBySlugs } from "@/server/catalog";
import { ProductCard } from "@/components/store/ProductCard";
import { Icon } from "@/components/ui/Icon";

export default async function ProducerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const producer = await db.producer.findUnique({
    where: { slug },
    include: { origin: true, products: { where: { status: "ACTIVE" }, select: { slug: true } }, batches: { orderBy: { collectedAt: "desc" }, take: 6, select: { batchNumber: true, collectedAt: true, product: { select: { name: true } } } } },
  });
  if (!producer || !producer.active) notFound();
  const { t, locale } = await getT();
  const products = await productsBySlugs(producer.products.map((p) => p.slug));
  const name = localized(producer, "name", locale);
  return (
    <div className="page-pad">
      <section className="on-red" style={{ position: "relative", overflow: "hidden" }}>
        <svg viewBox="0 0 400 400" aria-hidden="true" style={{ position: "absolute", right: -60, top: -80, width: 420, height: 420 }}><circle cx="250" cy="150" r="120" fill="#C6A15B" /><circle cx="240" cy="250" r="130" fill="none" stroke="#F4EBDD" strokeWidth="1.2" opacity=".75" /></svg>
        <div className="container" style={{ position: "relative", padding: "56px var(--gutter) 64px" }}>
          <p className="eyebrow" style={{ background: "var(--ivory)", color: "var(--sky)", padding: "7px 14px", borderRadius: 999 }}><Icon name="pin" size={14} />{[producer.village, producer.origin.district, producer.origin.division].filter(Boolean).join(", ")}</p>
          <h1 className="display" style={{ marginTop: 18, fontSize: "clamp(40px,6vw,76px)" }}>{name}</h1>
          <p style={{ fontSize: 19, fontWeight: 500, marginTop: 10 }}>{localized(producer, "craft", locale)}</p>
        </div>
      </section>
      <div className="container layout-aside" style={{ paddingTop: 40, paddingBottom: 48 }}>
        <article className="stack" style={{ ["--stack" as string]: "18px" }}>
          {producer.quote && !producer.isDemo ? <blockquote style={{ font: "400 26px/1.4 var(--font-serif)", paddingLeft: 18, borderLeft: "2px solid var(--gold)" }}>“{producer.quote}”</blockquote> : null}
          <p className="lead">{localized(producer, "story", locale)}</p>
          {producer.isDemo ? <p className="form-ok">{t("producers.demoNotice")}</p> : null}
        </article>
        <aside className="surface" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 12, alignSelf: "start" }}>
          <p className="label">{t(`producers.verification.${producer.verificationStatus}`)}</p>
          <p className="muted-note">{t("journey.fairBody")}</p>
          {producer.batches.length ? (
            <>
              <p className="label" style={{ marginTop: 8 }}>{t("trace.title")}</p>
              <ul style={{ listStyle: "none", display: "grid", gap: 6, fontSize: 13.5 }}>
                {producer.batches.map((b) => <li key={b.batchNumber}><Link className="link mono" href={`/trace/${b.batchNumber}`}>{b.batchNumber}</Link> · {b.product.name}</li>)}
              </ul>
            </>
          ) : null}
        </aside>
      </div>
      {products.length ? (
        <section className="container" style={{ paddingBottom: 72 }}>
          <h2 className="h2" style={{ marginBottom: 24 }}>{t("producers.products", { name })}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 28 }}>{products.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </section>
      ) : null}
    </div>
  );
}
