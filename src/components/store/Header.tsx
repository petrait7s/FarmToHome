import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Icon } from "@/components/ui/Icon";
import { getT } from "@/i18n";
import { getCurrentUser } from "@/server/auth/session";
import { isStaff } from "@/server/auth/guards";
import { setLocale } from "@/app/actions/locale";
import { NavLink } from "./NavLink";
import { BasketButton } from "./BasketButton";
import { SearchButton } from "./SearchButton";
import { getChosenArea } from "@/server/area";
import { defaultZoneRule } from "@/server/markets";
import styles from "./Header.module.css";

export async function Header() {
  const { t, locale } = await getT();
  const [user, chosen, fallback] = await Promise.all([getCurrentUser(), getChosenArea(), defaultZoneRule()]);
  const zone = chosen ? { feeMinor: chosen.feeMinor, freeThresholdMinor: chosen.freeThresholdMinor, area: chosen.area } : fallback ? { ...fallback, area: null } : null;
  const links = [
    // The logo links home; Concierge lives in the footer, FAQ and account area.
    { href: "/explore", label: t("nav.explore") },
    { href: "/market/weekly", label: t("nav.weekly") },
    { href: "/market/monthly", label: t("nav.monthly") },
    { href: "/journey", label: t("nav.journey") },
    { href: "/producers", label: t("nav.producers") },
  ];
  const initial = user ? (Array.from(user.name.trim())[0] ?? "?").toUpperCase() : "";
  return (
    <header className={styles.header}>
      <a href="#main" className={styles.skip}>{t("nav.skip")}</a>
      <div className={`container ${styles.wrap}`}>
        <div className={styles.bar}>
          <BrandLogo />
          <nav aria-label={t("nav.primary")} className={styles.nav}>
            {links.map((l) => (
              <NavLink key={l.href} href={l.href} className={styles.link} activeClassName={styles.active}>
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className={styles.actions}>
            <SearchButton className={styles.iconBtn} />
            <form action={setLocale}>
              <input type="hidden" name="locale" value={locale === "en" ? "bn" : "en"} />
              <button type="submit" className={`${styles.iconBtn} ${styles.lang}`} aria-label={`${t("common.language")}: ${t("meta.other")}`} title={t("meta.other")} lang={locale === "en" ? "bn" : "en"}>
                {t("meta.otherShort")}
              </button>
            </form>
            {isStaff(user) ? (
              <Link href="/admin" className={`${styles.iconBtn} ${styles.hideMobile}`} aria-label={t("nav.admin")} title={t("nav.admin")}>
                <Icon name="grid" />
              </Link>
            ) : null}
            <Link href="/account/markets" className={`${styles.iconBtn} ${styles.hideMobile}`} aria-label={t("nav.saved")} title={t("nav.saved")}>
              <Icon name="bookmark" />
            </Link>
            <Link
              href={user ? "/account" : "/account/login"}
              className={`${styles.iconBtn} ${styles.hideMobile}`}
              aria-label={user ? `${t("nav.account")}: ${user.name}` : t("common.signIn")}
              title={user ? user.name : t("common.signIn")}
            >
              {user ? <span className={styles.avatar} aria-hidden="true">{initial}</span> : <Icon name="user" />}
            </Link>
            <BasketButton label={t("nav.basket")} className={styles.hideMobile} zone={zone} />
          </div>
        </div>
      </div>
    </header>
  );
}
