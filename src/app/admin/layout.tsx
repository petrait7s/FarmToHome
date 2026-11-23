import Link from "next/link";
import { requireStaffPage } from "@/server/auth/guards";
import { getSettings } from "@/server/settings";
import { BrandMark } from "@/components/ui/BrandLogo";
import { NavLink } from "@/components/store/NavLink";
import { Icon, type IconName } from "@/components/ui/Icon";
import { logoutAction } from "@/app/actions/auth";
import styles from "./admin.module.css";

export const metadata = { title: { default: "Admin", template: "%s · Admin · FarmToHome" }, robots: { index: false } };

const NAV: { group: string; items: { href: string; label: string; icon: IconName; admin?: boolean; exact?: boolean }[] }[] = [
  { group: "Overview", items: [{ href: "/admin", label: "Dashboard", icon: "grid", exact: true }] },
  { group: "Operations", items: [
    { href: "/admin/orders", label: "Orders", icon: "box" },
    { href: "/admin/delivery", label: "Delivery", icon: "truck" },
    { href: "/admin/concierge", label: "Concierge", icon: "headset" },
  ] },
  { group: "Sourcing & stock", items: [
    { href: "/admin/procurement", label: "Procurement", icon: "leaf" },
    { href: "/admin/batches", label: "Batches & QC", icon: "qr" },
    { href: "/admin/inventory", label: "Inventory", icon: "scale" },
  ] },
  { group: "Catalogue", items: [
    { href: "/admin/products", label: "Products", icon: "tag" },
    { href: "/admin/categories", label: "Categories", icon: "market" },
    { href: "/admin/producers", label: "Producers", icon: "pin" },
  ] },
  { group: "Customers & marketing", items: [
    { href: "/admin/customers", label: "Customers", icon: "user" },
    { href: "/admin/promotions", label: "Promotions", icon: "sparkle" },
    { href: "/admin/content", label: "Content", icon: "edit" },
  ] },
  { group: "System", items: [
    { href: "/admin/settings", label: "Settings", icon: "globe", admin: true },
    { href: "/admin/team", label: "Team", icon: "shield", admin: true },
    { href: "/admin/audit", label: "Audit log", icon: "info", admin: true },
  ] },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaffPage("/admin");
  const settings = await getSettings();
  return (
    <div className={styles.shell}>
      <aside className={styles.side}>
        <Link href="/admin" className={styles.brand}><BrandMark size={28} /><span>FarmToHome <small>Admin</small></span></Link>
        <nav aria-label="Admin">
          {NAV.map((g) => {
            const items = g.items.filter((i) => !i.admin || user.role === "ADMIN");
            if (!items.length) return null;
            return (
              <div key={g.group} className={styles.group}>
                <p className={styles.groupLabel}>{g.group}</p>
                {items.map((i) => (
                  <NavLink key={i.href} href={i.href} exact={i.exact} className={styles.link} activeClassName={styles.active}>
                    <Icon name={i.icon} size={16} />{i.label}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>
        <div className={styles.me}>
          <p><b>{user.name}</b><br /><span>{user.role}</span></p>
          <div style={{ display: "flex", gap: 6 }}>
            <Link href="/" className="btn btn-sm">Storefront</Link>
            <form action={logoutAction}><button className="btn btn-ghost btn-sm">Sign out</button></form>
          </div>
        </div>
      </aside>
      <div className={styles.main}>
        {settings.demoMode ? <div className={styles.demo}><span className="dot" aria-hidden="true" />Demo mode: catalogue, producers, batches and metrics include demonstration data.</div> : null}
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
