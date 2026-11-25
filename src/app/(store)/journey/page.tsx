import Link from "next/link";
import Image from "next/image";
import { getT } from "@/i18n";
import { db } from "@/lib/db";
import { JOURNEY_KEYS } from "@/components/store/JourneySteps";
import { Icon } from "@/components/ui/Icon";
import { formatNumber } from "@/lib/money";
import { photos, stagePhoto, altFor } from "@/lib/media";
import styles from "./journey.module.css";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("journey.title"), description: t("journey.lead") };
}

export default async function JourneyPage() {
  const { t, locale } = await getT();
  const origins = await db.origin.findMany({
    where: { producers: { some: { active: true } } },
    orderBy: [{ division: "asc" }, { district: "asc" }],
    include: { producers: { where: { active: true }, select: { slug: true, name: true } } },
  });
  return (
    <div className="page-pad">
      <section className={styles.hero}>
        <Image src={photos.goldenField.src} alt={altFor(photos.goldenField, locale)} fill priority sizes="100vw" className={styles.heroImg} />
        <div className={`container ${styles.heroInner}`}>
          <p className="eyebrow"><span className="dot gold" aria-hidden="true" />{t("nav.journey")}</p>
          <h1 className="display">{t("journey.title")}</h1>
          <p className={styles.heroLead}>{t("journey.lead")}</p>
        </div>
      </section>

      <section className="container section">
        <h2 className="h1" style={{ marginBottom: 12 }}>{t("journey.stepsTitle")}</h2>
        <p className="lead" style={{ color: "var(--text-muted)", marginBottom: 48 }}>{t("home.journeyLead")}</p>
        <ol className={styles.chapters}>
          {JOURNEY_KEYS.map((k, i) => {
            const ph = photos[stagePhoto[k]];
            return (
              <li key={k} className={styles.chapter}>
                <div className={styles.chapterImg}><Image src={ph.src} alt={altFor(ph, locale)} fill sizes="(max-width: 900px) 100vw, 50vw" /></div>
                <div className={styles.chapterText}>
                  <span className={styles.chapterNum}>{formatNumber(i + 1, locale).padStart(2, locale === "bn" ? "০" : "0")}</span>
                  <h3 className="h2">{t(`trace.stages.${k}`)}</h3>
                  <p>{t(`journey.stepBodies.${k}`)}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className={`section on-red ${styles.fair}`}>
        <div className={`container ${styles.fairGrid}`}>
          <div>
            <p className="eyebrow"><span className="dot gold" aria-hidden="true" />30%</p>
            <h2 className="h1">{t("journey.fairTitle")}</h2>
          </div>
          <div>
            <p className={styles.fairBody}>{t("journey.fairBody")}</p>
            <Link href="/producers" className="btn btn-ivory" style={{ marginTop: 24 }}>{t("journey.producersCta")} <Icon name="arrowRight" /></Link>
          </div>
        </div>
      </section>

      <section className="container section">
        <h2 className="h2" style={{ marginBottom: 24 }}>{t("journey.originsTitle")}</h2>
        <ul className={styles.origins}>
          {origins.map((o) => (
            <li key={o.id}>
              <Link href={`/explore?origin=${o.slug}`} className={styles.originName}>{o.district}</Link>
              <span>{o.division} · {o.producers.map((p) => p.name).join(", ")}</span>
            </li>
          ))}
        </ul>
        <p style={{ marginTop: 28 }}><Link className="btn" href="/trace"><Icon name="qr" /> {t("trace.lookup")}</Link></p>
      </section>
    </div>
  );
}
