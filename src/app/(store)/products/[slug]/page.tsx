import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getT } from "@/i18n";
import { localized } from "@/i18n/shared";
import { db } from "@/lib/db";
import { getProductDetail, relatedProducts } from "@/server/catalog";
import { getCurrentUser } from "@/server/auth/session";
import { getSettings, originClassDefinition } from "@/server/settings";
import { toggleFavorite } from "@/app/actions/favorites";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { OriginSeal } from "@/components/ui/OriginSeal";
import { ProductBuyBox } from "@/components/store/ProductBuyBox";
import { ProductCard } from "@/components/store/ProductCard";
import { Icon } from "@/components/ui/Icon";
import styles from "./product.module.css";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await db.product.findUnique({ where: { slug }, select: { name: true, summary: true } });
  return p ? { title: p.name, description: p.summary } : {};
}

function fmtDate(d: Date | null, locale: string) {
  return d ? d.toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short", year: "numeric" }) : null;
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const detail = await getProductDetail(slug);
  if (!detail?.dto) notFound();
  const { product, dto, batch } = detail;
  const { t, locale } = await getT();
  const [user, settings, related] = await Promise.all([getCurrentUser(), getSettings(), relatedProducts(product.id, product.categoryId, product.originId)]);
  const fav = user ? await db.favorite.findUnique({ where: { userId_productId: { userId: user.id, productId: product.id } } }) : null;
  const name = localized(product, "name", locale);
  const clsDef = originClassDefinition(settings.originClassDefinitions, product.originClass);
  const allSourced = product.variants.every((v) => v.fulfillmentMode === "SOURCED_TO_ORDER");
  const inspection = batch?.inspections[0];

  return (
    <div className="page-pad">
      <nav className={`container ${styles.crumbs}`} aria-label="Breadcrumb">
        <Link href="/explore">{t("nav.explore")}</Link>
        <Icon name="chevronRight" size={14} />
        <Link href={`/explore?category=${product.category.slug}`}>{localized(product.category, "name", locale)}</Link>
      </nav>

      <section className={`container ${styles.top}`}>
        <div className={styles.gallery}>
          <ProductVisual artKey={product.artKey} imageUrl={product.images[0]?.url} alt={product.images[0]?.alt ?? name} size="lg" priority />
          {product.images.length > 1 ? (
            <div className={styles.thumbs}>
              {product.images.slice(1, 5).map((img) => <ProductVisual key={img.id} imageUrl={img.url} alt={img.alt} size="md" />)}
            </div>
          ) : null}
        </div>
        <div className={styles.info}>
          <p className="eyebrow">
            {product.origin?.district ?? ""} <OriginSeal cls={product.originClass} title={`${t("product.originClass")} ${product.originClass}: ${clsDef ?? t("common.definitionPending")}`} /> {product.qualityGrade}
            {product.isDemo ? <span className="demo-tag">{t("common.demoData")}</span> : null}
          </p>
          <h1 className="h1">{name}</h1>
          <p className="lead">{localized(product, "summary", locale)}</p>
          {product.producer ? (
            <p className={styles.byline}>
              <Link href={`/producers/${product.producer.slug}`} className="link">{product.producer.name}</Link> · {product.producer.village}, {product.producer.origin.district}
            </p>
          ) : null}
          <ProductBuyBox product={dto} />
          <ul className={styles.notes}>
            {product.isPerishable ? <li><Icon name="info" size={16} />{t("product.perishable")}</li> : null}
            {allSourced ? <li><Icon name="truck" size={16} />{t("product.sourcedNote")}</li> : null}
          </ul>
          {user ? (
            <form action={toggleFavorite}>
              <input type="hidden" name="productId" value={product.id} />
              <input type="hidden" name="slug" value={product.slug} />
              <button className="btn btn-ghost"><Icon name="heart" />{fav ? t("product.unfavorite") : t("product.favorite")}</button>
            </form>
          ) : null}
        </div>
      </section>

      <section className={`container ${styles.body}`}>
        <article className={styles.story}>
          <p className="eyebrow"><span className="dot" aria-hidden="true" />{t("product.story")}</p>
          <p className={styles.storyText}>{localized(product, "story", locale) || localized(product, "description", locale)}</p>
          <p>{localized(product, "description", locale)}</p>
          {product.producer?.quote ? <blockquote className={styles.quote}>“{product.producer.quote}” <cite>— {product.producer.name}</cite></blockquote> : null}

          <h2 className="h3" style={{ marginTop: 40 }}>{t("product.details")}</h2>
          <dl className={styles.dl}>
            <dt>{t("product.origin")}</dt><dd>{product.producer?.village ? `${product.producer.village}, ` : ""}{product.origin?.district}{product.origin?.division ? `, ${product.origin.division}` : ""}</dd>
            {product.originClass ? (<><dt>{t("product.originClass")}</dt><dd>{product.originClass} — {clsDef ?? t("common.definitionPending")}</dd></>) : null}
            {product.qualityGrade ? (<><dt>{t("product.grade")}</dt><dd>{product.qualityGrade}</dd></>) : null}
            {product.processingInfo ? (<><dt>{t("product.processing")}</dt><dd>{product.processingInfo}</dd></>) : null}
            {product.packagingInfo ? (<><dt>{t("product.packaging")}</dt><dd>{product.packagingInfo}</dd></>) : null}
            {product.storageInfo ? (<><dt>{t("product.storage")}</dt><dd>{product.storageInfo}</dd></>) : null}
            {product.handlingInfo ? (<><dt>{t("product.handling")}</dt><dd>{product.handlingInfo}</dd></>) : null}
            <dt>{t("product.netWeight")}</dt><dd>{product.variants.map((v) => v.label).join(" · ")}</dd>
          </dl>
        </article>

        <aside className={styles.trace}>
          <div className={styles.traceCard}>
            <p className="eyebrow"><Icon name="qr" size={16} />{t("trace.title")}</p>
            {batch ? (
              <>
                <dl className={styles.cert}>
                  <dt>{t("product.batch")}</dt><dd className="mono">{batch.batchNumber}</dd>
                  {batch.collectedAt ? (<><dt>{t("product.harvested")}</dt><dd>{fmtDate(batch.collectedAt, locale)}</dd></>) : null}
                  {batch.packedAt ? (<><dt>{t("product.packed")}</dt><dd>{fmtDate(batch.packedAt, locale)}</dd></>) : null}
                  {inspection ? (<><dt>{t("trace.inspection")}</dt><dd>{t(`trace.result.${inspection.result}`)}{inspection.grade ? ` · ${inspection.grade}` : ""}</dd></>) : null}
                  {batch.qualityGrade ? (<><dt>{t("product.grade")}</dt><dd>{batch.qualityGrade}</dd></>) : null}
                </dl>
                <div className={styles.reports}>
                  <p className="label">{t("product.reports")}</p>
                  {batch.reports.length === 0 ? <p className="muted-note">{t("product.reportUnavailable")}</p> : batch.reports.map((r) => (
                    <div key={r.id} className={styles.report}>
                      <b>{r.title}</b>
                      <span className="muted-note">{r.isVerified && !r.isDemo ? t("product.reportVerified") : t("product.reportDemo")}</span>
                      {r.fileUrl ? <a className="link" href={r.fileUrl} target="_blank" rel="noopener noreferrer">PDF</a> : null}
                    </div>
                  ))}
                </div>
                {batch.isDemo ? <p className="muted-note">{t("trace.demoNotice")}</p> : null}
                <Link href={`/trace/${batch.batchNumber}`} className="btn btn-primary btn-block">{t("product.viewJourney")} <Icon name="arrowRight" /></Link>
              </>
            ) : (
              <p className="muted-note">{allSourced ? t("product.sourcedNote") : t("trace.notRecorded")}</p>
            )}
          </div>
          {product.producer ? (
            <Link href={`/producers/${product.producer.slug}`} className={styles.producerCard}>
              <span className={styles.avatar} aria-hidden="true">{product.producer.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
              <span>
                <b className="serif">{t("product.meetProducer", { name: product.producer.name })}</b>
                <span className="muted-note" style={{ display: "block" }}>{product.producer.craft} · {t(`producers.verification.${product.producer.verificationStatus}`)}</span>
              </span>
            </Link>
          ) : null}
        </aside>
      </section>

      {related.sameCategory.length ? (
        <section className="container section">
          <h2 className="h2" style={{ marginBottom: 28 }}>{t("product.related")}</h2>
          <div className={styles.related}>{related.sameCategory.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </section>
      ) : null}
      {related.sameOrigin.length ? (
        <section className="container" style={{ paddingBottom: 64 }}>
          <h2 className="h2" style={{ marginBottom: 28 }}>{t("product.sameOrigin")}</h2>
          <div className={styles.related}>{related.sameOrigin.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </section>
      ) : null}
    </div>
  );
}
