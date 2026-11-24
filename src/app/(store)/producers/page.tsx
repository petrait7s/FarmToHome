import Link from "next/link";
import { getT } from "@/i18n";
import { localized } from "@/i18n/shared";
import { db } from "@/lib/db";
import { ProductVisual } from "@/components/ui/ProductVisual";
import styles from "./producers.module.css";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("producers.title") };
}

export default async function ProducersPage() {
  const { t, locale } = await getT();
  const producers = await db.producer.findMany({
    where: { active: true },
    orderBy: [{ origin: { division: "asc" } }, { name: "asc" }],
    include: { origin: true, products: { where: { status: "ACTIVE" }, select: { slug: true, name: true, artKey: true }, take: 3 } },
  });
  return (
    <div className="page-pad">
      <section className="container" style={{ padding: "48px var(--gutter) 24px" }}>
        <p className="eyebrow"><span className="dot" aria-hidden="true" />{t("nav.producers")}</p>
        <h1 className="h1" style={{ marginTop: 10 }}>{t("producers.title")}</h1>
        <p className="lead" style={{ marginTop: 12 }}>{t("producers.lead")}</p>
      </section>
      <div className={`container ${styles.grid}`}>
        {producers.map((p) => (
          <Link key={p.id} href={`/producers/${p.slug}`} className={styles.card}>
            <div className={styles.art}>
              <ProductVisual artKey={p.products[0]?.artKey} alt="" size="fill" />
              <span className={styles.initials}>{p.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
            </div>
            <p className="eyebrow">{[p.village, p.origin.district].filter(Boolean).join(" · ")} {p.isDemo ? <span className="demo-tag">{t("common.demo")}</span> : null}</p>
            <h2 className="h3">{localized(p, "name", locale)}</h2>
            <p className="muted-note">{localized(p, "craft", locale)} · {t(`producers.verification.${p.verificationStatus}`)}</p>
            {p.products.length ? <p className={styles.products}>{p.products.map((x) => x.name).join(" · ")}</p> : null}
          </Link>
        ))}
      </div>
    </div>
  );
}
