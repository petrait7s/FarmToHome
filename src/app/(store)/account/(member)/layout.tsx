import { getT } from "@/i18n";
import { requireUserPage } from "@/server/auth/guards";
import { db } from "@/lib/db";
import { logoutAction } from "@/app/actions/auth";
import { NavLink } from "@/components/store/NavLink";
import { Icon, type IconName } from "@/components/ui/Icon";
import styles from "./account.module.css";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUserPage("/account");
  const { t } = await getT();
  const unread = await db.notification.count({ where: { userId: user.id, readAt: null } });
  const links: { href: string; label: string; icon: IconName; exact?: boolean; badge?: number }[] = [
    { href: "/account", label: t("account.title"), icon: "user", exact: true },
    { href: "/account/orders", label: t("account.orders"), icon: "box" },
    { href: "/account/markets", label: t("account.markets"), icon: "bookmark" },
    { href: "/account/addresses", label: t("account.addresses"), icon: "pin" },
    { href: "/account/favorites", label: t("account.favorites"), icon: "heart" },
    { href: "/account/notifications", label: t("account.notifications"), icon: "bell", badge: unread },
    { href: "/account/concierge", label: t("account.concierge"), icon: "headset" },
    { href: "/account/profile", label: t("account.profile"), icon: "edit" },
    { href: "/account/settings", label: t("account.settings"), icon: "globe" },
  ];
  return (
    <div className={`container ${styles.shell} page-pad`}>
      <aside className={styles.nav}>
        <p className={styles.hello}>{t("account.welcome", { name: user.name.split(" ")[0] })}</p>
        <nav aria-label={t("account.title")}>
          {links.map((l) => (
            <NavLink key={l.href} href={l.href} exact={l.exact} className={styles.link} activeClassName={styles.active}>
              <Icon name={l.icon} size={17} />
              <span>{l.label}</span>
              {l.badge ? <span className={styles.badge}>{l.badge}</span> : null}
            </NavLink>
          ))}
        </nav>
        <form action={logoutAction}>
          <button className={styles.link}><Icon name="logout" size={17} />{t("common.signOut")}</button>
        </form>
      </aside>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
