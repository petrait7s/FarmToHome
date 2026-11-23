import Link from "next/link";
import { getT } from "@/i18n";
import { db } from "@/lib/db";
import { requireUserPage } from "@/server/auth/guards";
import { markNotificationsReadAction } from "@/app/actions/account";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireUserPage("/account/notifications");
  const { t, locale } = await getT();
  const items = await db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 });
  return (
    <div className="narrow">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <h1 className="h1">{t("account.notifications")}</h1>
        {items.some((i) => !i.readAt) ? <form action={markNotificationsReadAction}><button className="btn btn-sm">{t("account.markRead")}</button></form> : null}
      </div>
      {items.length === 0 ? <p>{t("account.noNotifications")}</p> : (
        <ul style={{ listStyle: "none" }}>
          {items.map((n) => (
            <li key={n.id} style={{ padding: "14px 0", borderBottom: "1px solid var(--line)", display: "grid", gridTemplateColumns: "12px 1fr", gap: 12 }}>
              <span className={n.readAt ? "dot sky" : "dot"} style={{ marginTop: 8, opacity: n.readAt ? 0.3 : 1 }} aria-label={n.readAt ? undefined : "unread"} />
              <div>
                <b>{n.href ? <Link className="link" href={n.href}>{n.title}</Link> : n.title}</b>
                <p>{n.body}</p>
                <p className="muted-note">{n.createdAt.toLocaleString(locale === "bn" ? "bn-BD" : "en-GB", { timeZone: "Asia/Dhaka" })}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
