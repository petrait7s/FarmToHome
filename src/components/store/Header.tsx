import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Icon } from "@/components/ui/Icon";
import { getT } from "@/i18n";
import { getCurrentUser } from "@/server/auth/session";
import { isStaff } from "@/server/auth/guards";
import { setLocale } from "@/app/actions/locale";
import { NavLink } from "./NavLink";
import { BasketButton } from "./BasketButton";
import styles from "./Header.module.css";

export async function Header() {
  const { t, locale } = await getT();
  const user = await getCurrentUser();
  const links = [
    { href: "/", label: t("nav.home"), exact: true },
    { href: "/explore", label: t("nav.explore") },
    { href: "/market/weekly", label: t("nav.weekly") },
    { href: "/market/monthly", label: t("nav.monthly") },
    { href: "/journey", label: t("nav.journey") },
    { href: "/concierge", label: t("nav.concierge") },
  ];
  return (
    <header className={styles.header}>
      <a href="#main" className={styles.skip}>{t("nav.skip")}</a>
      <div className={`container ${styles.row}`}>
        <BrandLogo tagline={t("brand.positioning")} />
        <nav aria-label={t("nav.primary")} className={styles.nav}>
          {links.map((l) => (
            <NavLink key={l.href} href={l.href} exact={l.exact} className={styles.link} activeClassName={styles.active}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className={styles.actions}>
          <Link href="/explore#search" className={styles.iconLink} aria-label={t("nav.search")}>
            <Icon name="search" />
          </Link>
          <form action={setLocale}>
            <input type="hidden" name="locale" value={locale === "en" ? "bn" : "en"} />
            <button type="submit" className={styles.lang} aria-label={`${t("common.language")}: ${t("meta.other")}`} lang={locale === "en" ? "bn" : "en"}>
              {t("meta.other")}
            </button>
          </form>
          {isStaff(user) ? (
            <Link href="/admin" className={`${styles.iconLink} ${styles.hideMobile}`}>
              <Icon name="grid" />
              <span className={styles.label}>{t("nav.admin")}</span>
            </Link>
          ) : null}
          <Link href="/account/markets" className={`${styles.iconLink} ${styles.hideMobile}`} aria-label={t("nav.saved")}>
            <Icon name="bookmark" />
          </Link>
          <Link href={user ? "/account" : "/account/login"} className={`${styles.iconLink} ${styles.hideMobile}`}>
            <Icon name="user" />
            <span className={styles.label}>{user ? user.name.split(" ")[0] : t("common.signIn")}</span>
          </Link>
          <BasketButton label={t("nav.myBasket")} className={styles.hideMobile} />
        </div>
      </div>
    </header>
  );
}
