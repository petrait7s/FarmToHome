import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { getT } from "@/i18n";
import { getSettings } from "@/server/settings";
import { db } from "@/lib/db";
import styles from "./Footer.module.css";

export async function Footer() {
  const { t } = await getT();
  const settings = await getSettings();
  const pages = await db.page.findMany({ where: { published: true }, select: { slug: true, title: true, titleBn: true }, orderBy: { title: "asc" } });
  const { locale } = await getT();
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.brand}>
          <BrandLogo onRed />
          <p className={styles.promise}>{t("brand.promise")}</p>
          <p className={styles.core}>{t("brand.core")}</p>
        </div>
        <nav aria-label={t("footer.shop")}>
          <h2 className={styles.h}>{t("footer.shop")}</h2>
          <ul>
            <li><Link href="/market/weekly">{t("nav.weekly")}</Link></li>
            <li><Link href="/market/monthly">{t("nav.monthly")}</Link></li>
            <li><Link href="/market/basket">{t("nav.builder")}</Link></li>
            <li><Link href="/explore">{t("nav.explore")}</Link></li>
          </ul>
        </nav>
        <nav aria-label={t("footer.company")}>
          <h2 className={styles.h}>{t("footer.company")}</h2>
          <ul>
            <li><Link href="/journey">{t("nav.journey")}</Link></li>
            <li><Link href="/producers">{t("nav.producers")}</Link></li>
            <li><Link href="/trace">{t("nav.trace")}</Link></li>
          </ul>
        </nav>
        <nav aria-label={t("footer.help")}>
          <h2 className={styles.h}>{t("footer.help")}</h2>
          <ul>
            <li><Link href="/concierge">{t("nav.concierge")}</Link></li>
            <li><Link href="/faq">{t("footer.faq")}</Link></li>
            {pages.map((p) => (
              <li key={p.slug}><Link href={`/pages/${p.slug}`}>{locale === "bn" && p.titleBn ? p.titleBn : p.title}</Link></li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className={styles.h}>{t("footer.contact")}</h2>
          <ul>
            {settings.contactPhone ? <li><a href={`tel:${settings.contactPhone}`}>{settings.contactPhone}</a></li> : null}
            {settings.contactEmail ? <li><a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a></li> : null}
            {settings.conciergeHours ? <li>{settings.conciergeHours}</li> : null}
          </ul>
        </div>
      </div>
      <div className={`container ${styles.bottom}`}>
        <span>{t("footer.rights", { year: new Date().getFullYear() })}</span>
        {settings.demoMode ? <span>{t("footer.demo")}</span> : null}
      </div>
    </footer>
  );
}
