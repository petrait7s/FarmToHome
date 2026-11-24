import Link from "next/link";
import { getT } from "@/i18n";
import { db } from "@/lib/db";
import { requireUserPage } from "@/server/auth/guards";
import { customerReplyAction } from "@/app/actions/concierge";

export const metadata = { title: "Concierge requests" };

export default async function MyConciergePage() {
  const user = await requireUserPage("/account/concierge");
  const { t, locale } = await getT();
  const requests = await db.conciergeRequest.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, include: { messages: { orderBy: { createdAt: "asc" } } } });
  const fmt = (d: Date) => d.toLocaleString(locale === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Dhaka" });
  return (
    <div className="narrow">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        <h1 className="h1">{t("concierge.myRequests")}</h1>
        <Link className="btn btn-primary btn-sm" href="/concierge">{t("concierge.send")}</Link>
      </div>
      {requests.length === 0 ? <p>{t("concierge.noRequests")}</p> : requests.map((r) => (
        <article key={r.id} className="surface" style={{ padding: 20, marginBottom: 14 }}>
          <p style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <b className="serif" style={{ fontSize: 18, fontWeight: 500 }}>{t(`concierge.topics.${r.topic}`)}</b>
            <span className="badge badge-red">{t(`concierge.status.${r.status}`)}</span>
          </p>
          <p className="muted-note mono">{r.reference}</p>
          <ul style={{ listStyle: "none", display: "grid", gap: 10, margin: "14px 0" }}>
            {r.messages.map((m) => (
              <li key={m.id} style={{ padding: "10px 14px", borderRadius: 14, background: m.fromStaff ? "var(--red-06)" : "var(--ivory)", border: "1px solid var(--line)" }}>
                <p className="muted-note">{m.fromStaff ? "FarmToHome" : user.name} · {fmt(m.createdAt)}</p>
                <p style={{ whiteSpace: "pre-wrap" }}>{m.body}</p>
              </li>
            ))}
          </ul>
          <form action={customerReplyAction} style={{ display: "flex", gap: 8 }}>
            <input type="hidden" name="requestId" value={r.id} />
            <label className="sr-only" htmlFor={`reply-${r.id}`}>{t("concierge.reply")}</label>
            <input id={`reply-${r.id}`} name="body" className="input" required maxLength={2000} />
            <button className="btn btn-sm">{t("concierge.reply")}</button>
          </form>
        </article>
      ))}
    </div>
  );
}
