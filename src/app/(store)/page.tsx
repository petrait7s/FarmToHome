import Link from "next/link";
import Image from "next/image";
import { getT } from "@/i18n";
import { localized } from "@/i18n/shared";
import { featuredProducers, featuredProducts, getContent, listCategories } from "@/server/catalog";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/store/ProductCard";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { StartGuide } from "@/components/home/StartGuide";
import { ReorderRow } from "@/components/home/ReorderRow";
import { Icon } from "@/components/ui/Icon";
import { formatNumber } from "@/lib/money";
import { photos, categoryPhoto, producerScene, altFor } from "@/lib/media";
import styles from "./home.module.css";

export default async function HomePage() {
  const { t, locale } = await getT();
  const [hero, seasonal, categories, producers, user] = await Promise.all([
    getContent("home.hero"),
    featuredProducts("seasonal", 4),
    listCategories(),
    featuredProducers(3),
    getCurrentUser(),
  ]);
  // Fresh picks: seasonal first, topped up with featured products so the row is full.
  const picks = seasonal.length >= 4 ? seasonal : [...seasonal, ...(await featuredProducts("featured", 8)).filter((p) => !seasonal.some((x) => x.id === p.id))].slice(0, 4);
  const [categoryArt, productCount, producerCount, zones] = await Promise.all([
    db.product.findMany({
      where: { status: "ACTIVE" },
      distinct: ["categoryId"],
      orderBy: [{ categoryId: "asc" }, { isFeatured: "desc" }, { isEssential: "desc" }],
      select: { categoryId: true, artKey: true },
    }),
    db.product.count({ where: { status: "ACTIVE" } }),
    db.producer.count(),
    db.deliveryZone.findMany({ where: { active: true }, select: { areas: true } }),
  ]);
  const areaCount = new Set(zones.flatMap((z) => z.areas)).size;
  const artFor = (id: string) => categoryArt.find((c) => c.categoryId === id)?.artKey ?? "grain:0";
  const L = <T extends Record<string, unknown>>(row: T | null, field: keyof T & string, fallback: string) => (row ? localized(row, field, locale) || fallback : fallback);
  const a = (k: keyof typeof photos) => altFor(photos[k], locale);

  return (
    <>
      {/* ── 1 · Hero ── */}
      <section className={styles.hero}>
        <Image src={photos.thali.src} alt={a("thali")} fill priority sizes="100vw" className={styles.heroBg} />
        <span className={styles.heroShade} aria-hidden="true" />
        <div className={`container ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <p className={styles.where}><Icon name="pin" /> {L(hero, "eyebrow", t("home.eyebrow"))}</p>
            <h1 className={`display ${styles.heroTitle}`}>
              <span className={styles.titleA}>{t("home.titleA")}</span> <span className={styles.hl}>{t("home.titleB")}</span>
            </h1>
            <p className={styles.heroLead}>{L(hero, "body", t("home.lead"))}</p>
            <div className={styles.heroCtas}>
              <Link href={hero?.ctaHref ?? "/market/weekly"} className="btn btn-ivory btn-lg">
                {L(hero, "ctaLabel", t("home.ctaBuild"))} <Icon name="arrowRight" />
              </Link>
              <Link href="/explore" className="btn btn-outline-ivory btn-lg">{t("home.ctaExploreFood")}</Link>
            </div>
            <dl className={styles.stats}>
              <div><dt>{formatNumber(productCount, locale)}</dt><dd>{t("home.stats.products")}</dd></div>
              <div><dt>{formatNumber(producerCount, locale)}</dt><dd>{t("home.stats.producers")}</dd></div>
              {areaCount ? <div><dt>{formatNumber(areaCount, locale)}</dt><dd>{t("home.stats.areas")}</dd></div> : null}
            </dl>
          </div>
          <div className={styles.heroChip}>
            <span className={styles.chipPin}><Icon name="truck" /></span>
            <span><b>{t("home.stageCity")}</b><small>{t("home.stageCityNote")}</small></span>
          </div>
        </div>
      </section>

      {/* ── 1 · Hero trust strip ── */}
      <div className={styles.trust}>
        <ul className="container">
          {([["leaf", "direct"], ["shield", "inspected"], ["qr", "traceable"], ["tag", "pricing"], ["calendar", "scheduled"]] as const).map(([icon, k]) => (
            <li key={k}><Icon name={icon} />{t(`home.trust.${k}`)}</li>
          ))}
        </ul>
      </div>

      {/* ── Returning customers: usual market and buy again ── */}
      {user ? <ReorderRow user={{ id: user.id, name: user.name }} /> : null}

      {/* ── 2 · Start here: household size, then week or month ── */}
      <StartGuide />

      {/* ── 3 · This week's fresh picks, with provenance on every card ── */}
      {picks.length ? (
        <section className={`section ${styles.tint}`}>
          <div className="container">
            <div className={styles.head}>
              <div>
                <p className="eyebrow"><span className="dot gold" aria-hidden="true" />{t("market.inSeason")}</p>
                <h2 className="h1">{t("home.picks.title")}</h2>
              </div>
              <p className="lead">{t("home.picks.lead")}</p>
            </div>
            <div className={`${styles.carousel} rail`} style={{ ["--rail-w" as string]: "68%" }}>
              {picks.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
            <p className={styles.more}><Link href="/explore" className="link">{t("common.viewAll")}</Link></p>
          </div>
        </section>
      ) : null}

      {/* ── 4 · Source to door in three steps, with batch lookup ── */}
      <section className="section">
        <div className="container">
          <div className={styles.head}>
            <div>
              <p className="eyebrow"><span className="dot" aria-hidden="true" />{t("nav.journey")}</p>
              <h2 className="h1">{t("home.steps.title")}</h2>
            </div>
            <p className="lead">{t("home.journeyLead")}</p>
          </div>
          <ol className={`${styles.three} rail`} style={{ ["--rail-w" as string]: "80%" }}>
            {([["source", "harvestWorkers"], ["batch", "greensChilies"], ["door", "riceCurries"]] as const).map(([k, ph], i) => (
              <li key={k} className={styles.threeItem}>
                <span className={styles.threeImg}><Image src={photos[ph].src} alt={a(ph)} fill sizes="(max-width: 900px) 80vw, 30vw" /></span>
                <span className={styles.threeNum} aria-hidden="true">{formatNumber(i + 1, locale)}</span>
                <h3 className="h3">{t(`home.steps.${k}.title`)}</h3>
                <p>{t(`home.steps.${k}.body`)}</p>
              </li>
            ))}
          </ol>
          <div className={styles.traceRow}>
            <form action="/trace" method="get" className={styles.traceForm}>
              <label className="label" htmlFor="home-batch"><Icon name="qr" size={16} /> {t("home.traceTitle")}</label>
              <div>
                <input id="home-batch" name="batch" className="input" placeholder={t("trace.batchPlaceholder")} autoComplete="off" />
                <button className="btn btn-primary">{t("trace.lookup")}</button>
              </div>
            </form>
            <Link href="/journey" className="link">{t("home.steps.more")}</Link>
          </div>
        </div>
      </section>

      {/* ── 5 · Producers ── */}
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

      {/* ── 6 · Categories ── */}
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

      {/* ── 7 · Good to know: what to expect, with links to the actual policies ── */}
      <section className="section">
        <div className="container">
          <h2 className="h2">{t("home.reassureTitle")}</h2>
          <ul className={styles.reassure}>
            {([["tag", "pricing", "/faq"], ["truck", "delivery", "/pages/delivery-policy"], ["headset", "support", "/concierge"], ["repeat", "refunds", "/pages/refund-policy"]] as const).map(([icon, k, href]) => (
              <li key={k}>
                <Icon name={icon} size={22} />
                <h3>{t(`home.reassure.${k}.title`)}</h3>
                <p>{t(`home.reassure.${k}.body`)}</p>
                <Link href={href} className="link">{t(`home.reassure.${k}.cta`)}</Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 8 · Start your market ── */}
      <section className={styles.finalCta}>
        <Image src={photos.vegBaskets.src} alt="" fill sizes="100vw" className={styles.heroBg} />
        <span className={styles.finalShade} aria-hidden="true" />
        <div className={`container ${styles.finalInner}`}>
          <h2 className="h1">{t("home.finalTitle")}</h2>
          <p>{t("home.finalBody")}</p>
          <div className={styles.heroCtas}>
            <Link href="/market/weekly" className="btn btn-ivory btn-lg">{t("home.weeklyPhotoCta")} <Icon name="arrowRight" /></Link>
            <Link href="/market/monthly" className="btn btn-outline-ivory btn-lg">{t("home.monthlyPhotoCta")}</Link>
          </div>
          <p className={styles.updatesLine}>{t("home.updatesLine")} <Link href={user ? "/account/settings" : "/account/register"} className="link">{user ? t("home.updatesCta") : t("home.updatesCtaGuest")}</Link></p>
        </div>
      </section>

    </>
  );
}
