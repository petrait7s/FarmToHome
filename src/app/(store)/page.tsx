import Link from "next/link";
import Image from "next/image";
import { getT } from "@/i18n";
import { localized } from "@/i18n/shared";
import { featuredCollections, featuredProducers, featuredProducts, getContent, listCategories } from "@/server/catalog";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/store/ProductCard";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { JourneySteps } from "@/components/store/JourneySteps";
import { Icon } from "@/components/ui/Icon";
import { formatMoney, formatNumber } from "@/lib/money";
import { photos, categoryPhoto, collectionPhoto, producerScene, altFor } from "@/lib/media";
import styles from "./home.module.css";

export default async function HomePage() {
  const { t, locale } = await getT();
  const [hero, pilot, seasonal, categories, producers, collections, user] = await Promise.all([
    getContent("home.hero"),
    getContent("home.pilot"),
    featuredProducts("seasonal", 8),
    listCategories(),
    featuredProducers(3),
    featuredCollections(),
    getCurrentUser(),
  ]);
  const [categoryArt, productCount, producerCount, zones] = await Promise.all([
    db.product.findMany({
      where: { status: "ACTIVE" },
      distinct: ["categoryId"],
      orderBy: [{ categoryId: "asc" }, { isFeatured: "desc" }, { isEssential: "desc" }],
      select: { categoryId: true, artKey: true },
    }),
    db.product.count({ where: { status: "ACTIVE" } }),
    db.producer.count(),
    db.deliveryZone.findMany({ where: { active: true }, select: { id: true, name: true, areas: true, feeMinor: true, freeThresholdMinor: true }, orderBy: { name: "asc" } }),
  ]);
  const areaCount = new Set(zones.flatMap((z) => z.areas)).size;
  const artFor = (id: string) => categoryArt.find((c) => c.categoryId === id)?.artKey ?? "grain:0";
  const L = <T extends Record<string, unknown>>(row: T | null, field: keyof T & string, fallback: string) => (row ? localized(row, field, locale) || fallback : fallback);
  const a = (k: keyof typeof photos) => altFor(photos[k], locale);

  return (
    <>
      {/* ── 1 · Hero ── */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <p className={styles.where}><Icon name="pin" /> {L(hero, "eyebrow", t("home.eyebrow"))}</p>
            <h1 className={`display ${styles.heroTitle}`}>
              <span className={styles.titleA}>{t("home.titleA")}</span> <span className={styles.hl}>{t("home.titleB")}</span>
            </h1>
            <p className={styles.heroLead}>{L(hero, "body", t("home.lead"))}</p>
            <div className={styles.heroCtas}>
              <Link href={hero?.ctaHref ?? "/market/weekly"} className="btn btn-primary btn-lg">
                {L(hero, "ctaLabel", t("home.ctaBuild"))} <Icon name="arrowRight" />
              </Link>
              <Link href="/producers" className="btn btn-lg">{t("home.ctaProducers")}</Link>
            </div>
            <dl className={styles.stats}>
              <div><dt>{formatNumber(productCount, locale)}</dt><dd>{t("home.stats.products")}</dd></div>
              <div><dt>{formatNumber(producerCount, locale)}</dt><dd>{t("home.stats.producers")}</dd></div>
              {areaCount ? <div><dt>{formatNumber(areaCount, locale)}</dt><dd>{t("home.stats.areas")}</dd></div> : null}
            </dl>
          </div>
          <div className={styles.heroArt}>
            <div className={styles.arch}>
              <Image src={photos.riceCurries.src} alt={a("riceCurries")} fill priority sizes="(max-width: 900px) 90vw, 44vw" />
            </div>
            <div className={styles.inset}>
              <Image src={photos.vegBaskets.src} alt={a("vegBaskets")} fill sizes="(max-width: 900px) 40vw, 16vw" />
            </div>
            <div className={styles.heroChip}>
              <span className={styles.chipPin}><Icon name="truck" /></span>
              <span><b>{t("home.stageCity")}</b><small>{t("home.stageCityNote")}</small></span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2 · Trust ── */}
      <div className={styles.trust}>
        <ul className="container">
          {([["leaf", "direct"], ["shield", "inspected"], ["qr", "traceable"], ["tag", "pricing"], ["calendar", "scheduled"]] as const).map(([icon, k]) => (
            <li key={k}><Icon name={icon} />{t(`home.trust.${k}`)}</li>
          ))}
        </ul>
      </div>

      {/* ── 3 · Weekly & Monthly ── */}
      <section className="section">
        <div className="container">
          <p className="eyebrow"><span className="dot" aria-hidden="true" />{t("home.modesTitle")}</p>
          <div className={`${styles.modes} rail`} style={{ ["--rail-w" as string]: "86%" }}>
            {([["weekly", "/market/weekly", "vegBaskets"], ["monthly", "/market/monthly", "spiceBowls"]] as const).map(([k, href, ph]) => (
              <Link key={k} href={href} className={`${styles.mode} press`}>
                <Image src={photos[ph].src} alt={a(ph)} fill sizes="(max-width: 900px) 86vw, 48vw" className={styles.modeImg} />
                <span className={styles.modeShade} aria-hidden="true" />
                <span className={styles.modeBody}>
                  <span className={styles.modeKicker}>{k === "weekly" ? "01" : "02"}</span>
                  <span className={styles.modeTitle}>{t(`home.${k}Title`)}</span>
                  <span className={styles.modeText}>{t(`home.${k}Body`)}</span>
                  <span className={styles.modeCta}>{t(`home.${k}PhotoCta`)} <Icon name="arrowRight" /></span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4 · Seasonal ── */}
      {seasonal.length ? (
        <section className={`section ${styles.tint}`}>
          <div className="container">
            <div className={styles.head}>
              <div>
                <p className="eyebrow"><span className="dot gold" aria-hidden="true" />{t("market.inSeason")}</p>
                <h2 className="h1">{t("home.seasonalTitle")}</h2>
              </div>
              <p className="lead">{t("home.seasonalLead")}</p>
            </div>
            <div className={`${styles.carousel} rail`} style={{ ["--rail-w" as string]: "68%" }}>
              {seasonal.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── 5 · Categories ── */}
      <section className="section">
        <div className="container">
          <div className={styles.head}>
            <h2 className="h1">{t("home.categoriesTitle")}</h2>
            <Link href="/explore" className="link">{t("common.viewAll")}</Link>
          </div>
          <ul className={styles.cats}>
            {categories.map((c) => {
              const ph = c.imageUrl ? null : categoryPhoto[c.slug];
              return (
                <li key={c.id}>
                  <Link href={`/explore?category=${c.slug}`} className={`${styles.cat} press`}>
                    <span className={styles.catImg}>
                      {c.imageUrl || ph ? (
                        <Image src={c.imageUrl ?? photos[ph!].src} alt="" fill sizes="(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 22vw" />
                      ) : (
                        <ProductVisual artKey={artFor(c.id)} alt="" size="fill" />
                      )}
                    </span>
                    <span className={styles.catName}>{localized(c, "name", locale)}</span>
                    <span className={styles.catDesc}>{localized(c, "description", locale)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ── 6 · Producers ── */}
      <section className={`section ${styles.tint}`}>
        <div className="container">
          <div className={styles.head}>
            <div>
              <p className="eyebrow"><span className="dot" aria-hidden="true" />{t("nav.producers")}</p>
              <h2 className="h1">{t("home.peopleTitle")}</h2>
            </div>
            <p className="lead">{t("home.producersLead")}</p>
          </div>
          <div className={`${styles.people} rail`} style={{ ["--rail-w" as string]: "80%" }}>
            {producers.map((p) => {
              const scene = p.photoUrl ? null : producerScene(p.craft, p.slug);
              return (
                <Link key={p.id} href={`/producers/${p.slug}`} className={`${styles.person} press`}>
                  <span className={styles.personImg}>
                    <Image src={p.photoUrl ?? scene!.src} alt={scene ? altFor(scene, locale) : localized(p, "name", locale)} fill sizes="(max-width: 900px) 80vw, 30vw" />
                    {scene ? <span className={styles.illus}>{t("home.photoCredit")} · {t("common.demo")}</span> : null}
                  </span>
                  <span className={styles.personMeta}>{p.village ? `${p.village} · ` : ""}{p.origin.district}</span>
                  <span className={styles.personName}>{localized(p, "name", locale)} {p.isDemo ? <span className="demo-tag">{t("common.demo")}</span> : null}</span>
                  <span className={styles.personCraft}>{localized(p, "craft", locale)}</span>
                  {p.products.length ? (
                    <span className={styles.supplies}>{t("home.suppliesLabel")}: {p.products.map((pr) => localized(pr, "name", locale)).join(", ")}</span>
                  ) : null}
                </Link>
              );
            })}
          </div>
          <p className={styles.note}>{t("home.peopleNote")} <Link href="/producers" className="link">{t("journey.producersCta")}</Link></p>
        </div>
      </section>

      {/* ── 7 · Journey ── */}
      <section className="section">
        <div className="container">
          <div className={styles.head}>
            <div>
              <p className="eyebrow"><span className="dot" aria-hidden="true" />{t("nav.journey")}</p>
              <h2 className="h1">{t("home.journeyTitle")}</h2>
            </div>
            <p className="lead">{t("home.journeyLead")}</p>
          </div>
          <JourneySteps withPhotos />
        </div>
      </section>

      {/* ── 8 · Quality ── */}
      <section className={`${styles.quality} on-red`}>
        <div className={`container ${styles.qualityGrid}`}>
          <div>
            <p className="eyebrow"><span className="dot gold" aria-hidden="true" />{t("home.qualityPointsTitle")}</p>
            <h2 className="h1">{t("home.qualityTitle")}</h2>
            <p className={styles.qualityBody}>{t("home.qualityBody")}</p>
            <ul className={styles.qualityList}>
              {(["inspection", "cleaning", "grading", "processing", "packaging", "batch"] as const).map((k, i) => (
                <li key={k}><span>{formatNumber(i + 1, locale)}</span>{t(`home.qualitySteps.${k}`)}</li>
              ))}
            </ul>
            <Link href="/journey" className="btn btn-ivory" style={{ marginTop: 28 }}>{t("nav.journey")} <Icon name="arrowRight" /></Link>
          </div>
          <div className={styles.qualityImg}>
            <Image src={photos.greensChilies.src} alt={a("greensChilies")} fill sizes="(max-width: 900px) 90vw, 40vw" />
          </div>
        </div>
      </section>

      {/* ── 9 · Collections ── */}
      {collections.length ? (
        <section className="section">
          <div className="container">
            <h2 className="h1">{t("home.collectionsTitle")}</h2>
            <div className={`${styles.banners} rail`} style={{ ["--rail-w" as string]: "86%" }}>
              {collections.map((c, i) => {
                const ph = c.imageUrl ? null : collectionPhoto[c.slug] ?? "thali";
                return (
                  <Link key={c.id} href={`/explore?collection=${c.slug}`} className={`${styles.banner} ${i === 0 ? styles.bannerWide : ""} press`}>
                    <Image src={c.imageUrl ?? photos[ph!].src} alt="" fill sizes="(max-width: 900px) 86vw, 50vw" className={styles.modeImg} />
                    <span className={styles.modeShade} aria-hidden="true" />
                    <span className={styles.bannerBody}>
                      <span className={styles.bannerTitle}>{localized(c, "title", locale)}</span>
                      <span className={styles.bannerText}>{localized(c, "description", locale)}</span>
                      <span className={styles.modeCta}>{t("common.viewAll")} <Icon name="arrowRight" /></span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── 10 · How it works ── */}
      <section className={`section ${styles.tint}`}>
        <div className="container">
          <h2 className="h1">{t("home.howTitle")}</h2>
          <ol className={`${styles.howGrid} rail`} style={{ ["--rail-w" as string]: "72%" }}>
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

      {/* ── 11 · Scheduled delivery · 12 · Saved markets ── */}
      <section className="section">
        <div className={`container ${styles.planned}`}>
          <div className={styles.plannedImg}>
            <Image src={photos.curryRice.src} alt={a("curryRice")} fill sizes="(max-width: 900px) 90vw, 45vw" />
          </div>
          <div className={styles.plannedCopy}>
            <p className="eyebrow"><span className="dot" aria-hidden="true" />{t("home.deliveryTitle")}</p>
            <h2 className="h1">{t("home.plannedTitle")}</h2>
            <p className="lead">{t("home.deliveryBody")}</p>
            <div className={styles.savedCard}>
              <Icon name="repeat" size={22} />
              <div>
                <h3 className="h3">{t("home.savedTitle")}</h3>
                <p>{t("home.recurringBody")}</p>
                <Link href="/account/markets" className="link">{t("home.savedCta")}</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 13 · Trace CTA ── */}
      <section className={styles.traceBand}>
        <div className={`container ${styles.traceInner}`}>
          <div>
            <Icon name="qr" size={30} />
            <h2 className="h2">{t("home.traceTitle")}</h2>
            <p>{t("home.traceBody")}</p>
          </div>
          <form action="/trace" method="get" className={styles.traceForm}>
            <label className="sr-only" htmlFor="home-batch">{t("trace.batchLabel")}</label>
            <input id="home-batch" name="batch" className="input" placeholder={t("trace.batchPlaceholder")} autoComplete="off" />
            <button className="btn btn-ivory">{t("trace.lookup")}</button>
          </form>
        </div>
      </section>

      {/* ── 14 · Launch area ── */}
      <section className="section">
        <div className={`container ${styles.launch}`}>
          <div>
            <p className="eyebrow"><span className="dot" aria-hidden="true" />{t("home.launchEyebrow")}</p>
            <h2 className="h1">{pilot ? localized(pilot, "title", locale) : t("home.launchTitle")}</h2>
            {pilot ? <p className="lead">{localized(pilot, "body", locale)}</p> : null}
            <p className={styles.note}><span className="demo-tag">{t("common.demo")}</span> {t("home.launchNote")}</p>
            {pilot?.ctaHref ? <Link href={pilot.ctaHref} className="btn" style={{ marginTop: 20 }}>{localized(pilot, "ctaLabel", locale)}</Link> : null}
          </div>
          <div className={styles.zones}>
            <svg className={styles.rings} viewBox="0 0 200 200" aria-hidden="true">
              <circle cx="100" cy="100" r="96" /><circle cx="100" cy="100" r="66" /><circle cx="100" cy="100" r="36" />
              <circle cx="100" cy="100" r="7" className={styles.ringDot} />
            </svg>
            {zones.map((z) => (
              <div key={z.id} className={styles.zone}>
                <h3>{z.name.replace(/^Sylhet — /, "")}</h3>
                <p className={styles.zoneFee}>{t("home.zoneFee", { fee: formatMoney(z.feeMinor, locale), min: z.freeThresholdMinor ? formatMoney(z.freeThresholdMinor, locale) : "—" })}</p>
                <ul>{z.areas.map((ar) => <li key={ar}>{ar}</li>)}</ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 15 · Seasonal updates (uses the existing harvest-news preference) ── */}
      <section className={styles.updates}>
        <div className={`container ${styles.updatesInner}`}>
          <div>
            <h2 className="h2">{t("home.updatesTitle")}</h2>
            <p>{t("home.updatesBody")}</p>
          </div>
          <Link href={user ? "/account/settings" : "/account/register"} className="btn btn-primary">{user ? t("home.updatesCta") : t("home.updatesCtaGuest")} <Icon name="arrowRight" /></Link>
        </div>
      </section>
    </>
  );
}
