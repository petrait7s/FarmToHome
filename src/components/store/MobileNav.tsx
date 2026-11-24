"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";
import { useCart } from "./CartProvider";
import { useI18n } from "@/i18n/client";
import { formatNumber } from "@/lib/money";
import styles from "./MobileNav.module.css";

export function MobileNav({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const { t, locale } = useI18n();
  const { cart } = useCart();
  const items: { href: string; label: string; icon: IconName; match: (p: string) => boolean }[] = [
    { href: "/", label: t("nav.home"), icon: "home", match: (p) => p === "/" },
    { href: "/explore", label: t("nav.explore"), icon: "compass", match: (p) => p.startsWith("/explore") || p.startsWith("/products") || p.startsWith("/trace") || p.startsWith("/producers") },
    { href: "/basket", label: t("nav.basket"), icon: "basket", match: (p) => p.startsWith("/basket") || p.startsWith("/checkout") },
    { href: "/market/weekly", label: t("nav.market"), icon: "market", match: (p) => p.startsWith("/market") },
    { href: signedIn ? "/account" : "/account/login", label: t("nav.account"), icon: "user", match: (p) => p.startsWith("/account") },
  ];
  return (
    <nav className={styles.nav} aria-label={t("nav.mobile")}>
      {items.map((it) => {
        const active = it.match(pathname);
        return (
          <Link key={it.href} href={it.href} className={`${styles.item} ${it.icon === "basket" ? styles.basket : ""} ${active ? styles.active : ""}`} aria-current={active ? "page" : undefined}>
            <span className={styles.icon}>
              <Icon name={it.icon} size={22} />
              {it.icon === "basket" && cart.productCount > 0 ? <span className={styles.badge}>{formatNumber(cart.productCount, locale)}</span> : null}
            </span>
            <span className={styles.label}>{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
