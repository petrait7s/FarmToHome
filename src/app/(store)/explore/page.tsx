import Link from "next/link";
import { getT } from "@/i18n";
import { localized } from "@/i18n/shared";
import { db } from "@/lib/db";
import { listCategories, listOrigins, listProducersForFilter, searchProducts, type ProductQuery } from "@/server/catalog";
import { ProductCard } from "@/components/store/ProductCard";
import { Icon } from "@/components/ui/Icon";
import styles from "./explore.module.css";

export const metadata = { title: "Explore the market" };

type SP = Record<string, string | undefined>;
const SORTS = ["curated", "newest", "price_asc", "price_desc", "popular"] as const;

function qs(sp: SP, patch: SP): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...sp, ...patch })) if (v) params.set(k, v);
  const s = params.toString();
  return s ? `?${s}` : "";
}

export default async function ExplorePage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { t, locale } = await getT();
  const sort = SORTS.includes(sp.sort as (typeof SORTS)[number]) ? (sp.sort as ProductQuery["sort"]) : "curated";
  const query: ProductQuery = {
    category: sp.category,
    origin: sp.origin,
    producer: sp.producer,
    collection: sp.collection,
    q: sp.q,
    seasonal: sp.seasonal === "1",
    isNew: sp.new === "1",
    featured: sp.featured === "1",
    sort,
    page: Number(sp.page) || 1,
    pageSize: 12,
  };
  const [result, categories, origins, producers, collection] = await Promise.all([
    searchProducts(query),
    listCategories(),
    listOrigins(),
    listProducersForFilter(),
    sp.collection ? db.collection.findUnique({ where: { slug: sp.collection } }) : null,
  ]);
  const activeCategory = categories.find((c) => c.slug === sp.category);
  const hasFilters = !!(sp.category || sp.origin || sp.producer || sp.collection || sp.q || sp.seasonal || sp.new || sp.featured);
  const title = collection ? localized(collection, "title", locale) : activeCategory ? localized(activeCategory, "name", locale) : t("explore.title");
  const lead = collection ? localized(collection, "description", locale) : activeCategory ? localized(activeCategory, "story", locale) || localized(activeCategory, "description", locale) : t("explore.lead");

  return (
    <div className="page-pad">
      <section className={styles.header}>
        <div className="container">
          <p className="eyebrow"><span className="dot" aria-hidden="true" />{t("nav.explore")}</p>
          <h1 className="h1">{title}</h1>
          {lead ? <p className="lead" style={{ marginTop: 12 }}>{lead}</p> : null}
          <form id="search" className={styles.searchForm} action="/explore" method="get" role="search">
            {sp.category ? <input type="hidden" name="category" value={sp.category} /> : null}
            <label className="sr-only" htmlFor="explore-q">{t("nav.search")}</label>
            <Icon name="search" className={styles.searchIcon} />
            <input id="explore-q" name="q" defaultValue={sp.q ?? ""} placeholder={t("market.searchPlaceholder")} className={styles.searchInput} type="search" />
            <button className="btn btn-primary btn-sm">{t("common.search")}</button>
          </form>
          <nav className={styles.catChips} aria-label={t("explore.category")}>
            <Link href={`/explore${qs({ ...sp, page: undefined }, { category: undefined })}`} className="chip" aria-current={!sp.category ? "page" : undefined}>{t("market.allCategories")}</Link>
            {categories.map((c) => (
              <Link key={c.id} href={`/explore${qs({ ...sp, page: undefined }, { category: c.slug })}`} className="chip" aria-current={sp.category === c.slug ? "page" : undefined}>
                {localized(c, "name", locale)}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <div className={`container ${styles.layout}`}>
        <aside className={styles.filters} aria-label={t("explore.filters")}>
          <form action="/explore" method="get" className={styles.filterForm}>
            {sp.category ? <input type="hidden" name="category" value={sp.category} /> : null}
            {sp.q ? <input type="hidden" name="q" value={sp.q} /> : null}
            {sp.collection ? <input type="hidden" name="collection" value={sp.collection} /> : null}
            <div className="field">
              <label className="label" htmlFor="f-origin">{t("explore.origin")}</label>
              <select id="f-origin" name="origin" className="select" defaultValue={sp.origin ?? ""}>
                <option value="">{t("explore.allOrigins")}</option>
                {origins.map((o) => <option key={o.slug} value={o.slug}>{o.district}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="label" htmlFor="f-producer">{t("explore.producer")}</label>
              <select id="f-producer" name="producer" className="select" defaultValue={sp.producer ?? ""}>
                <option value="">{t("explore.allProducers")}</option>
                {producers.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
              </select>
            </div>
            <fieldset className={styles.checks}>
              <legend className="label">{t("explore.show")}</legend>
              <label className="check"><input type="checkbox" name="seasonal" value="1" defaultChecked={sp.seasonal === "1"} />{t("explore.onlySeasonal")}</label>
              <label className="check"><input type="checkbox" name="new" value="1" defaultChecked={sp.new === "1"} />{t("explore.onlyNew")}</label>
              <label className="check"><input type="checkbox" name="featured" value="1" defaultChecked={sp.featured === "1"} />{t("explore.onlyFeatured")}</label>
            </fieldset>
            <div className="field">
              <label className="label" htmlFor="f-sort">{t("explore.sort")}</label>
              <select id="f-sort" name="sort" className="select" defaultValue={sort}>
                {SORTS.map((s) => <option key={s} value={s}>{t(`explore.sorts.${s}`)}</option>)}
              </select>
            </div>
            <button className="btn btn-primary btn-block">{t("common.apply")}</button>
            {hasFilters ? <Link href="/explore" className="link" style={{ textAlign: "center" }}>{t("explore.clearFilters")}</Link> : null}
          </form>
        </aside>

        <section aria-live="polite">
          <p className={styles.count}>{t("explore.results", { n: result.total })}</p>
          {result.items.length === 0 ? (
            <div className={styles.empty}>
              <p className="h3">{t("explore.noResults")}</p>
              <Link href="/explore" className="btn" style={{ marginTop: 16 }}>{t("explore.clearFilters")}</Link>
            </div>
          ) : (
            <div className={styles.grid}>
              {result.items.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 3} />)}
            </div>
          )}
          {result.pages > 1 ? (
            <nav className={styles.pager} aria-label="Pagination">
              {result.page > 1 ? <Link className="btn btn-sm" href={`/explore${qs(sp, { page: String(result.page - 1) })}`}><Icon name="arrowLeft" />{t("common.previous")}</Link> : <span />}
              <span>{t("common.pageOf", { page: result.page, pages: result.pages })}</span>
              {result.page < result.pages ? <Link className="btn btn-sm" href={`/explore${qs(sp, { page: String(result.page + 1) })}`}>{t("common.next")}<Icon name="arrowRight" /></Link> : <span />}
            </nav>
          ) : null}
        </section>
      </div>
    </div>
  );
}
