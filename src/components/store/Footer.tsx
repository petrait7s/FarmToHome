import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Icon } from "@/components/ui/Icon";
import { setLocale } from "@/app/actions/locale";
import { getT } from "@/i18n";
import { getSettings } from "@/server/settings";
import { db } from "@/lib/db";
import styles from "./Footer.module.css";

export async function Footer() {
  const { t, locale } = await getT();
  const settings = await getSettings();
  // tel: links need the international form; Bangladesh mobiles are stored as 01XXXXXXXXX.
  const tel = settings.contactPhone?.replace(/[^\d+]/g, "").replace(/^0(1\d{9})$/, "+880$1");
  const pages = await db.page.findMany({ where: { published: true }, select: { slug: true, title: true, titleBn: true }, orderBy: { title: "asc" } });
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.brand}>
          <BrandLogo onRed />
          <p className={styles.promise}>{t("brand.promise")}</p>
          <p className={styles.core}>{t("brand.core")}</p>
          <p className={styles.area}><span className={styles.ping} aria-hidden="true" />{t("footer.serviceArea")}</p>
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
          <ul className={styles.contact}>
            {settings.contactPhone ? (
              <li>
                <Icon name="headset" />
                <span><a href={`tel:${tel}`} className={styles.phone}>{settings.contactPhone}</a><small>{t("footer.call")}</small></span>
              </li>
            ) : null}
            {settings.contactEmail ? <li><Icon name="globe" /><a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a></li> : null}
            {settings.contactAddress ? <li><Icon name="pin" /><span>{settings.contactAddress}<small>{t("footer.hub")}</small></span></li> : null}
            {settings.conciergeHours ? <li><Icon name="calendar" /><span>{settings.conciergeHours}</span></li> : null}
          </ul>
        </div>
      </div>
      <div className={`container ${styles.bottom}`}>
        <span>{t("footer.rights", { year: new Date().getFullYear() })}</span>
        <span className={styles.bottomLinks}>
          <Link href="/credits">{t("footer.credits")}</Link>
          <form action={setLocale}>
            <input type="hidden" name="locale" value={locale === "en" ? "bn" : "en"} />
            <button type="submit" className={styles.lang} lang={locale === "en" ? "bn" : "en"}><Icon name="globe" size={15} /> {t("footer.languageLabel")}: {t("meta.other")}</button>
          </form>
        </span>
        {settings.demoMode ? <span>{t("footer.demo")}</span> : null}
      </div>
    </footer>
  );
}
