import Link from "next/link";
import { notFound } from "next/navigation";
import { getT } from "@/i18n";
import { localized } from "@/i18n/shared";
import { db } from "@/lib/db";
import { productsBySlugs } from "@/server/catalog";
import { ProductCard } from "@/components/store/ProductCard";
import { Icon } from "@/components/ui/Icon";
import Image from "next/image";
import { producerScene, altFor } from "@/lib/media";

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
      <section className="on-red" style={{ position: "relative", overflow: "hidden", isolation: "isolate", minHeight: 420, display: "flex", alignItems: "flex-end" }}>
        <Image src={producer.photoUrl ?? producerScene(producer.craft, producer.slug).src} alt={producer.photoUrl ? name : altFor(producerScene(producer.craft, producer.slug), locale)} fill priority sizes="100vw" style={{ objectFit: "cover", zIndex: -2 }} />
        <span aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: -1, background: "linear-gradient(180deg, rgb(37 37 37 / 0.1), rgb(22 74 131 / 0.88))" }} />
        <div className="container" style={{ position: "relative", padding: "96px var(--gutter) 48px", width: "100%" }}>
          <p className="eyebrow" style={{ background: "rgb(255 255 255 / 0.9)", color: "var(--sky)", padding: "7px 14px", borderRadius: 999, width: "fit-content" }}><Icon name="pin" size={14} />{[producer.village, producer.origin.district, producer.origin.division].filter(Boolean).join(", ")}</p>
          <h1 className="display" style={{ marginTop: 18, fontSize: "clamp(36px,5.4vw,72px)" }}>{name}</h1>
          <p style={{ fontSize: 19, fontWeight: 500, marginTop: 10 }}>{localized(producer, "craft", locale)}</p>
          {!producer.photoUrl ? <p style={{ fontSize: 12.5, marginTop: 14, opacity: 0.85 }}>{t("product.illustrative")} · {t("home.peopleNote")}</p> : null}
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
