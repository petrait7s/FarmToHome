import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getT } from "@/i18n";
import { localized } from "@/i18n/shared";
import { db } from "@/lib/db";
import { normalizeBatchNumber } from "@/server/traceability";
import { Icon } from "@/components/ui/Icon";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { photos, altFor } from "@/lib/media";
import styles from "./lookup.module.css";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("trace.title"), description: t("trace.lead") };
}

export default async function TraceLookupPage({ searchParams }: { searchParams: Promise<{ batch?: string }> }) {
  const { batch } = await searchParams;
  const { t, locale } = await getT();
  let notFoundQ: string | null = null;
  if (batch?.trim()) {
    const n = normalizeBatchNumber(batch).slice(0, 40);
    const exists = await db.batch.findUnique({ where: { batchNumber: n }, select: { batchNumber: true } });
    if (exists) redirect(`/trace/${exists.batchNumber}`);
    notFoundQ = n;
  }
  const recent = await db.batch.findMany({
    where: { status: { in: ["ACTIVE", "APPROVED", "PACKED"] }, product: { status: "ACTIVE" } },
    orderBy: { collectedAt: "desc" },
    take: 6,
    select: { batchNumber: true, isDemo: true, origin: { select: { district: true } }, product: { select: { name: true, nameBn: true, artKey: true } } },
  });
  return (
    <div className="page-pad">
      <section className={`${styles.hero} on-red`}>
        <Image src={photos.harvestWorkers.src} alt={altFor(photos.harvestWorkers, locale)} fill priority sizes="100vw" className={styles.heroImg} />
        <div className={`container narrow ${styles.heroInner}`}>
          <p className="eyebrow"><Icon name="qr" size={15} />{t("nav.trace")}</p>
          <h1 className="display">{t("trace.title")}</h1>
          <p className={styles.lead}>{t("trace.lead")}</p>
        </div>
      </section>

      <section className={`container narrow ${styles.body}`}>
        <form method="get" action="/trace" className={styles.search} role="search">
          {notFoundQ ? <p className="form-error" role="alert">{t("trace.notFound", { q: notFoundQ })}</p> : null}
          <label className="label" htmlFor="batch">{t("trace.batchLabel")}</label>
          <div className={styles.row}>
            <input id="batch" name="batch" className="input mono" placeholder={t("trace.batchPlaceholder")} defaultValue={batch ?? ""} autoComplete="off" autoCapitalize="characters" spellCheck={false} required aria-describedby="batch-hint" />
            <button className="btn btn-primary btn-lg">{t("trace.lookup")} <Icon name="arrowRight" /></button>
          </div>
          <p id="batch-hint" className={styles.hint}>{t("trace.formatHint")}</p>
        </form>

        <ol className={styles.howto} aria-label={t("trace.howTitle")}>
          {(["find", "scan", "type"] as const).map((k, i) => (
            <li key={k}>
              <span className={styles.num}>{i + 1}</span>
              <h2>{t(`trace.how.${k}.title`)}</h2>
              <p>{t(`trace.how.${k}.body`)}</p>
            </li>
          ))}
        </ol>

        {recent.length ? (
          <div className={styles.recent}>
            <p className="label">{t("trace.tryOne")} <span className="demo-tag">{t("common.demo")}</span></p>
            <ul>
              {recent.map((b) => (
                <li key={b.batchNumber}>
                  <Link href={`/trace/${b.batchNumber}`} className={`${styles.card} press`}>
                    <ProductVisual artKey={b.product.artKey} alt="" size="sm" />
                    <span>
                      <b>{localized(b.product, "name", locale)}</b>
                      <span className="mono">{b.batchNumber}</span>
                      {b.origin?.district ? <small>{b.origin.district}</small> : null}
                    </span>
                    <Icon name="arrowRight" size={16} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </div>
  );
}
