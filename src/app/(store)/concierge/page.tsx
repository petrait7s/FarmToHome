import Link from "next/link";
import { getT } from "@/i18n";
import { getCurrentUser } from "@/server/auth/session";
import { getSettings } from "@/server/settings";
import { ConciergeForm } from "@/components/store/ConciergeForm";
import { Icon } from "@/components/ui/Icon";

export const metadata = { title: "Concierge" };

export default async function ConciergePage({ searchParams }: { searchParams: Promise<{ topic?: string; order?: string; product?: string }> }) {
  const sp = await searchParams;
  const { t } = await getT();
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);
  return (
    <div className="page-pad">
      <section className="on-red" style={{ padding: "56px 0 64px" }}>
        <div className="container narrow">
          <p className="eyebrow" style={{ background: "var(--ivory)", color: "var(--sky)", padding: "7px 14px", borderRadius: 999 }}><Icon name="headset" size={15} />{t("nav.concierge")}</p>
          <h1 className="display" style={{ marginTop: 18 }}>{t("concierge.title")}</h1>
          <p style={{ fontSize: 19, fontWeight: 500, marginTop: 14 }}>{t("concierge.lead")}</p>
        </div>
      </section>
      <div className="container layout-aside" style={{ paddingTop: 40, paddingBottom: 80 }}>
        <div className="panel" style={{ padding: 28 }}>
          <ConciergeForm defaults={{ name: user?.name ?? "", phone: user?.phone ?? "", email: user?.email ?? "", topic: sp.topic, orderRef: sp.order, productSlug: sp.product }} />
        </div>
        <aside className="surface" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 10, alignSelf: "start" }}>
          {settings.conciergeHours ? <p><b>{t("concierge.hours")}:</b> {settings.conciergeHours}</p> : null}
          {settings.contactPhone ? <p><a className="link" href={`tel:${settings.contactPhone}`}>{settings.contactPhone}</a></p> : null}
          {settings.contactEmail ? <p><a className="link" href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a></p> : null}
          {user ? <Link className="link" href="/account/concierge">{t("concierge.myRequests")}</Link> : null}
        </aside>
      </div>
    </div>
  );
}
