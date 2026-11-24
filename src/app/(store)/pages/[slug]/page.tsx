import Link from "next/link";
import { notFound } from "next/navigation";
import { getT } from "@/i18n";
import { localized } from "@/i18n/shared";
import { db } from "@/lib/db";
import styles from "./policy.module.css";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await db.page.findUnique({ where: { slug }, select: { title: true, titleBn: true } });
  const { locale } = await getT();
  return { title: page ? localized(page, "title", locale) : undefined };
}

export default async function ContentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [page, all] = await Promise.all([
    db.page.findUnique({ where: { slug } }),
    db.page.findMany({ where: { published: true }, select: { slug: true, title: true, titleBn: true }, orderBy: { title: "asc" } }),
  ]);
  if (!page || !page.published) notFound();
  const { t, locale } = await getT();
  const paras = localized(page, "body", locale).split(/\n{2,}/);
  const isDraft = /^(DRAFT|খসড়া)/.test(paras[0] ?? "");
  const updated = page.updatedAt.toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Dhaka" });
  return (
    <div className={`container page-pad ${styles.layout}`}>
      <aside className={styles.toc} aria-label={t("footer.policies")}>
        <p className="label">{t("footer.policies")}</p>
        <ul>
          {all.map((p) => (
            <li key={p.slug}><Link href={`/pages/${p.slug}`} aria-current={p.slug === slug ? "page" : undefined}>{localized(p, "title", locale)}</Link></li>
          ))}
        </ul>
      </aside>
      <article className={styles.article}>
        <h1 className="h1">{localized(page, "title", locale)}</h1>
        <p className={styles.meta}>{t("policy.updated", { date: updated })}</p>
        {isDraft ? <p className={styles.draft}>{paras[0]}</p> : null}
        {(isDraft ? paras.slice(1) : paras).map((para, i) => <p key={i} className={styles.para}>{para}</p>)}
        <p className={styles.help}>{t("faq.stillBody")} <Link href="/concierge" className="link">{t("pilotCta")}</Link></p>
      </article>
    </div>
  );
}
