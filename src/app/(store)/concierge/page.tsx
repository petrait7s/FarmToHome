import Link from "next/link";
import { getT } from "@/i18n";
import { getCurrentUser } from "@/server/auth/session";
import { getSettings } from "@/server/settings";
import { ConciergeForm } from "@/components/store/ConciergeForm";
import { Icon } from "@/components/ui/Icon";
import Image from "next/image";
import { photos, altFor } from "@/lib/media";
import styles from "./concierge.module.css";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("concierge.title"), description: t("concierge.lead") };
}

export default async function ConciergePage({ searchParams }: { searchParams: Promise<{ topic?: string; order?: string; product?: string }> }) {
  const sp = await searchParams;
  const { t, locale } = await getT();
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);
  return (
    <div className="page-pad">
      <div className={`container ${styles.split}`}>
        <section className={styles.intro}>
          <p className="eyebrow"><Icon name="headset" size={15} />{t("nav.concierge")}</p>
          <h1 className="h1">{t("concierge.title")}</h1>
          <p className="lead">{t("concierge.lead")}</p>
          <div className={styles.photo}><Image src={photos.vegMarket.src} alt={altFor(photos.vegMarket, locale)} fill sizes="(max-width: 900px) 100vw, 40vw" /></div>
          <ul className={styles.contact}>
            {settings.contactPhone ? <li><Icon name="headset" /><span><a className="link" href={`tel:${settings.contactPhone}`}>{settings.contactPhone}</a>{settings.conciergeHours ? <small>{t("concierge.hours")}: {settings.conciergeHours}</small> : null}</span></li> : null}
            {settings.contactEmail ? <li><Icon name="globe" /><a className="link" href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a></li> : null}
            <li><Icon name="info" /><Link className="link" href="/faq">{t("footer.faq")}</Link></li>
            {user ? <li><Icon name="repeat" /><Link className="link" href="/account/concierge">{t("concierge.myRequests")}</Link></li> : null}
          </ul>
        </section>
        <section className={styles.formPanel}>
          <ConciergeForm defaults={{ name: user?.name ?? "", phone: user?.phone ?? "", email: user?.email ?? "", topic: sp.topic, orderRef: sp.order, productSlug: sp.product }} />
        </section>
      </div>
    </div>
  );
}
