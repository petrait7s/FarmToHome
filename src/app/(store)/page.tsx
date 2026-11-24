import Link from "next/link";
import { getT } from "@/i18n";
import { localized } from "@/i18n/shared";
import { featuredCollections, featuredProducers, featuredProducts, getContent, listCategories, productsBySlugs } from "@/server/catalog";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/store/ProductCard";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { JourneySteps } from "@/components/store/JourneySteps";
import { HeroStage } from "@/components/store/HeroStage";
import { Icon } from "@/components/ui/Icon";
import { formatNumber } from "@/lib/money";
import styles from "./home.module.css";

export default async function HomePage() {
  const { t, locale } = await getT();
  const [hero, pilot, seasonal, categories, producers, collections, heroProducts] = await Promise.all([
    getContent("home.hero"),
    getContent("home.pilot"),
    featuredProducts("seasonal", 4),
    listCategories(),
    featuredProducers(3),
    featuredCollections(),
    productsBySlugs(["khejur-patali-gur", "haor-pabda", "cold-pressed-mustard-oil"]),
  ]);
  const categoryArt = await db.product.findMany({
    where: { status: "ACTIVE" },
    distinct: ["categoryId"],
    orderBy: [{ categoryId: "asc" }, { isFeatured: "desc" }, { isEssential: "desc" }],
    select: { categoryId: true, artKey: true },
  });
  const [productCount, producerCount, zones] = await Promise.all([
    db.product.count({ where: { status: "ACTIVE" } }),
    db.producer.count(),
    db.deliveryZone.findMany({ where: { active: true }, select: { areas: true } }),
  ]);
  const areaCount = new Set(zones.flatMap((z) => z.areas)).size;
  const artFor = (id: string) => categoryArt.find((c) => c.categoryId === id)?.artKey ?? "grain:0";
  const L = <T extends Record<string, unknown>>(row: T | null, field: keyof T & string, fallback: string) => (row ? localized(row, field, locale) || fallback : fallback);

  return (
    <>
      {/* ── Hero ── */}
      <section className={`${styles.hero} on-red`}>
        <svg className={styles.heroArt} viewBox="0 0 600 600" aria-hidden="true">
          <circle className={styles.drift1} cx="380" cy="220" r="170" fill="#DDAA72" />
          <circle className={styles.drift2} cx="240" cy="360" r="130" fill="#F4F1EA" opacity=".14" />
          <circle cx="370" cy="370" r="180" fill="none" stroke="#F4F1EA" strokeWidth="1.2" opacity=".75" />
        </svg>
        <div className={`container ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <p className={styles.pill}><span className="dot" aria-hidden="true" />{L(hero, "eyebrow", t("home.eyebrow"))}</p>
            <h1 className="display">
              {t("home.titleA")} <em className={styles.em}>{t("home.titleB")}</em>
            </h1>
            <p className={styles.heroLead}>{L(hero, "body", t("home.lead"))}</p>
            <div className={styles.heroCtas}>
              <Link href={hero?.ctaHref ?? "/market/weekly"} className="btn btn-ivory btn-lg">
                {L(hero, "ctaLabel", t("home.ctaBuild"))} <Icon name="arrowRight" />
              </Link>
              <Link href="/explore" className="btn btn-outline-ivory btn-lg">{t("home.ctaExplore")}</Link>
            </div>
            <dl className={styles.stats}>
              <div><dt>{formatNumber(productCount, locale)}</dt><dd>{t("home.stats.products")}</dd></div>
              <div><dt>{formatNumber(producerCount, locale)}</dt><dd>{t("home.stats.producers")}</dd></div>
              {areaCount ? <div><dt>{formatNumber(areaCount, locale)}</dt><dd>{t("home.stats.areas")}</dd></div> : null}
            </dl>
          </div>
          <HeroStage
            items={heroProducts.map((p) => ({ id: p.id, artKey: p.artKey, imageUrl: p.imageUrl, name: localized(p, "name", locale), origin: p.originDistrict }))}
            city={t("home.stageCity")}
            cityNote={t("home.stageCityNote")}
            trace={t("home.stageTrace")}
          />
        </div>
      </section>

      {/* ── Promise strip ── */}
      <div className={styles.promise}>
        <div className="container">
          <ul>
            <li><Icon name="leaf" />{t("home.qualityPoints.direct")}</li>
            <li><Icon name="shield" />{t("home.qualityPoints.inspected")}</li>
            <li><Icon name="qr" />{t("home.qualityPoints.traceable")}</li>
            <li><Icon name="tag" />{t("home.qualityPoints.honest")}</li>
          </ul>
        </div>
      </div>

      {/* ── Modes ── */}
      <section className="section">
        <div className="container">
          <p className="eyebrow"><span className="dot" aria-hidden="true" />{t("home.modesTitle")}</p>
          <div className={styles.modes}>
            <Link href="/market/weekly" className={`${styles.mode} ${styles.modeWeekly}`}>
              <span className={styles.modeNum}>01</span>
              <h2 className="h2">{t("home.weeklyTitle")}</h2>
              <p>{t("home.weeklyBody")}</p>
              <span className={styles.modeCta}>{t("home.weeklyCta")} <Icon name="arrowRight" /></span>
            </Link>
            <Link href="/market/monthly" className={`${styles.mode} ${styles.modeMonthly}`}>
              <span className={styles.modeNum}>02</span>
              <h2 className="h2">{t("home.monthlyTitle")}</h2>
              <p>{t("home.monthlyBody")}</p>
              <span className={styles.modeCta}>{t("home.monthlyCta")} <Icon name="arrowRight" /></span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Seasonal ── */}
      {seasonal.length ? (
        <section className={`section ${styles.seasonal}`}>
          <div className="container">
            <div className={styles.head}>
              <div>
                <p className="eyebrow"><span className="dot gold" aria-hidden="true" />{t("market.inSeason")}</p>
                <h2 className="h1">{t("home.seasonalTitle")}</h2>
              </div>
              <p className="lead">{t("home.seasonalLead")}</p>
            </div>
            <div className={styles.cardRow}>
              {seasonal.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Categories ── */}
      <section className="section">
        <div className="container">
          <div className={styles.head}>
            <h2 className="h1">{t("home.categoriesTitle")}</h2>
            <Link href="/explore" className="link">{t("common.viewAll")}</Link>
          </div>
          <ul className={styles.cats}>
            {categories.map((c, i) => (
              <li key={c.id}>
                <Link href={`/explore?category=${c.slug}`} className={styles.cat}>
                  <span className={styles.catNum}>{formatNumber(i + 1, locale).padStart(2, locale === "bn" ? "০" : "0")}</span>
                  <span className={styles.catText}>
                    <span className={styles.catName}>{localized(c, "name", locale)}</span>
                    <span className={styles.catDesc}>{localized(c, "description", locale)}</span>
                  </span>
                  <ProductVisual artKey={artFor(c.id)} alt="" size="md" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Producers ── */}
      <section className={`section ${styles.producers}`}>
        <div className="container">
          <div className={styles.head}>
            <div>
              <p className="eyebrow"><span className="dot" aria-hidden="true" />{t("nav.producers")}</p>
              <h2 className="h1">{t("home.producersTitle")}</h2>
            </div>
            <p className="lead">{t("home.producersLead")}</p>
          </div>
          <div className={styles.producerGrid}>
            {producers.map((p) => (
              <Link key={p.id} href={`/producers/${p.slug}`} className={styles.producer}>
                <div className={styles.producerArt}>
                  <ProductVisual artKey={p.products[0]?.artKey} alt="" size="fill" />
                  <span className={styles.initials}>{p.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
                </div>
                <p className="eyebrow">{p.village} · {p.origin.district} {p.isDemo ? <span className="demo-tag">{t("common.demo")}</span> : null}</p>
                <h3 className="h3">{localized(p, "name", locale)}</h3>
                {p.quote && !p.isDemo ? <blockquote className={styles.quote}>“{p.quote}”</blockquote> : null}
              </Link>
            ))}
          </div>
          <p style={{ marginTop: 28 }}><Link href="/producers" className="link">{t("journey.producersCta")}</Link></p>
        </div>
      </section>

      {/* ── Journey ── */}
      <section className="section">
        <div className="container">
          <div className={styles.head}>
            <div>
              <p className="eyebrow"><span className="dot" aria-hidden="true" />{t("nav.journey")}</p>
              <h2 className="h1">{t("home.journeyTitle")}</h2>
            </div>
            <p className="lead">{t("home.journeyLead")}</p>
          </div>
          <JourneySteps />
        </div>
      </section>

      {/* ── Quality (orange band) ── */}
      <section className={`${styles.quality} on-red`}>
        <div className={`container ${styles.qualityGrid}`}>
          <h2 className="h1">{t("home.qualityTitle")}</h2>
          <div className={styles.qualityCard}>
            <p>{t("home.qualityBody")}</p>
            <Link href="/journey" className="btn btn-primary" style={{ marginTop: 20 }}>{t("nav.journey")} <Icon name="arrowRight" /></Link>
          </div>
        </div>
      </section>

      {/* ── Collections ── */}
      {collections.length ? (
        <section className="section">
          <div className="container">
            <h2 className="h1">{t("home.collectionsTitle")}</h2>
            <div className={styles.collections}>
              {collections.map((c) => (
                <Link key={c.id} href={`/explore?collection=${c.slug}`} className={styles.collection}>
                  <div className={styles.collectionArt}>
                    {c.products.filter((cp) => cp.product.status === "ACTIVE").slice(0, 3).map((cp) => (
                      <ProductVisual key={cp.productId} artKey={cp.product.artKey} alt="" size="md" />
                    ))}
                  </div>
                  <h3 className="h3">{localized(c, "title", locale)}</h3>
                  <p>{localized(c, "description", locale)}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── How it works ── */}
      <section className={`section ${styles.how}`}>
        <div className="container">
          <h2 className="h1">{t("home.howTitle")}</h2>
          <ol className={styles.howGrid}>
            {(["plan", "schedule", "prepare", "receive"] as const).map((k, i) => (
              <li key={k}>
                <span className={styles.howNum}>{formatNumber(i + 1, locale)}</span>
                <h3 className="h3">{t(`home.how.${k}.title`)}</h3>
                <p>{t(`home.how.${k}.body`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Scheduled delivery & recurring ── */}
      <section className="section">
        <div className={`container ${styles.split}`}>
          <div>
            <Icon name="calendar" size={28} className={styles.splitIcon} />
            <h2 className="h2">{t("home.deliveryTitle")}</h2>
            <p className="lead">{t("home.deliveryBody")}</p>
          </div>
          <div>
            <Icon name="repeat" size={28} className={styles.splitIcon} />
            <h2 className="h2">{t("home.recurringTitle")}</h2>
            <p className="lead">{t("home.recurringBody")}</p>
            <Link href="/account/markets" className="link" style={{ display: "inline-block", marginTop: 14 }}>{t("nav.saved")}</Link>
          </div>
        </div>
      </section>

      {/* ── Trace lookup + pilot ── */}
      <section className={`section ${styles.trace}`}>
        <div className={`container ${styles.split}`}>
          <form action="/trace" method="get" className={styles.traceForm}>
            <h2 className="h2">{t("home.traceTitle")}</h2>
            <p>{t("home.traceBody")}</p>
            <label className="sr-only" htmlFor="home-batch">{t("trace.batchLabel")}</label>
            <div className={styles.traceRow}>
              <input id="home-batch" name="batch" className="input" placeholder={t("trace.batchPlaceholder")} autoComplete="off" />
              <button className="btn btn-primary">{t("trace.lookup")}</button>
            </div>
          </form>
          {pilot ? (
            <div className={styles.pilot}>
              <p className="eyebrow"><span className="dot" aria-hidden="true" />{localized(pilot, "eyebrow", locale) || ""}</p>
              <h2 className="h2">{localized(pilot, "title", locale)}</h2>
              <p>{localized(pilot, "body", locale)}</p>
              {zones.length ? (
                <ul className={styles.areas}>
                  {[...new Set(zones.flatMap((z) => z.areas))].map((a) => <li key={a}><Icon name="pin" />{a}</li>)}
                </ul>
              ) : null}
              {pilot.ctaHref ? <Link href={pilot.ctaHref} className="link" style={{ display: "inline-block", marginTop: 12 }}>{localized(pilot, "ctaLabel", locale)}</Link> : null}
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
