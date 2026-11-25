import Link from "next/link";
import Image from "next/image";
import { getT } from "@/i18n";
import { localized } from "@/i18n/shared";
import { db } from "@/lib/db";
import { listCategories } from "@/server/catalog";
import { photos, producerScene, altFor } from "@/lib/media";
import styles from "./producers.module.css";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("producers.title"), description: t("producers.lead") };
}

export default async function ProducersPage({ searchParams }: { searchParams: Promise<{ district?: string; category?: string; q?: string; status?: string }> }) {
  const sp = await searchParams;
  const { t, locale } = await getT();
  const [all, categories] = await Promise.all([
    db.producer.findMany({
      where: { active: true },
      orderBy: [{ origin: { division: "asc" } }, { name: "asc" }],
      include: { origin: true, products: { where: { status: "ACTIVE" }, select: { slug: true, name: true, nameBn: true, category: { select: { slug: true } } }, take: 4 } },
    }),
    listCategories(),
  ]);
  const districts = [...new Map(all.map((p) => [p.origin.slug, p.origin.district])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const term = (sp.q ?? "").trim().toLowerCase();
  const producers = all.filter((p) =>
    (!sp.district || p.origin.slug === sp.district) &&
    (!sp.category || p.products.some((x) => x.category.slug === sp.category)) &&
    (!sp.status || p.verificationStatus === sp.status) &&
    (!term || [p.name, p.nameBn ?? "", p.craft ?? "", p.craftBn ?? "", p.village ?? "", p.origin.district].join(" ").toLowerCase().includes(term)));
  return (
    <div className="page-pad">
      <section className={styles.banner}>
        <Image src={photos.cropRowsHills.src} alt={altFor(photos.cropRowsHills, locale)} fill priority sizes="100vw" className={styles.bannerImg} />
        <div className={`container ${styles.bannerInner}`}>
          <p className="eyebrow"><span className="dot gold" aria-hidden="true" />{t("nav.producers")}</p>
          <h1 className="display">{t("home.peopleTitle")}</h1>
          <p className={styles.bannerLead}>{t("producers.lead")}</p>
        </div>
      </section>

      <div className="container">
        <form className={styles.filters} action="/producers" method="get" role="search">
          <label className={`${styles.field} ${styles.grow}`}>
            <span>{t("common.search")}</span>
            <input type="search" name="q" defaultValue={sp.q ?? ""} className="input" placeholder={t("producers.searchPlaceholder")} />
          </label>
          <label className={styles.field}>
            <span>{t("explore.origin")}</span>
            <select name="district" defaultValue={sp.district ?? ""} className="input">
              <option value="">{t("explore.allOrigins")}</option>
              {districts.map(([slug, name]) => <option key={slug} value={slug}>{name}</option>)}
            </select>
          </label>
          <label className={styles.field}>
            <span>{t("explore.category")}</span>
            <select name="category" defaultValue={sp.category ?? ""} className="input">
              <option value="">{t("market.allCategories")}</option>
              {categories.map((c) => <option key={c.slug} value={c.slug}>{localized(c, "name", locale)}</option>)}
            </select>
          </label>
          <label className={styles.field}>
            <span>{t("producers.statusLabel")}</span>
            <select name="status" defaultValue={sp.status ?? ""} className="input">
              <option value="">{t("producers.allStatuses")}</option>
              {(["VERIFIED", "PENDING", "UNVERIFIED"] as const).map((v) => <option key={v} value={v}>{t(`producers.verification.${v}`)}</option>)}
            </select>
          </label>
          <button className="btn btn-primary">{t("explore.show")}</button>
          {sp.district || sp.category || sp.q || sp.status ? <Link href="/producers" className="link">{t("explore.clearFilters")}</Link> : null}
          <span className={styles.count}>{t("producers.count", { n: producers.length })}</span>
        </form>
        <p className={styles.note}>{t("home.peopleNote")}</p>

        {producers.length ? (
          <div className={styles.grid}>
            {producers.map((p) => {
              const scene = p.photoUrl ? null : producerScene(p.craft, p.slug);
              return (
                <Link key={p.id} href={`/producers/${p.slug}`} className={`${styles.card} press`}>
                  <div className={styles.art}>
                    <Image src={p.photoUrl ?? scene!.src} alt={scene ? altFor(scene, locale) : localized(p, "name", locale)} fill sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 33vw" />
                    {scene ? <span className={styles.illus}>{t("product.illustrative")}</span> : null}
                  </div>
                  <div className={styles.cardBody}>
                    <p className={styles.meta}>{[p.village, p.origin.district].filter(Boolean).join(" · ")} {p.isDemo ? <span className="demo-tag">{t("common.demo")}</span> : null}</p>
                    <h2 className={styles.name}>{localized(p, "name", locale)}</h2>
                    <p className={styles.craft}>{localized(p, "craft", locale)} · {t(`producers.verification.${p.verificationStatus}`)}</p>
                    {p.products.length ? <p className={styles.products}>{p.products.map((x) => localized(x, "name", locale)).join(" · ")}</p> : null}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className={styles.empty}>{t("explore.noResults")}</p>
        )}
      </div>
    </div>
  );
}
