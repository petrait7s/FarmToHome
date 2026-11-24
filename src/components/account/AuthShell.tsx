import { getT } from "@/i18n";
import Image from "next/image";
import { photos } from "@/lib/media";
import styles from "./AuthShell.module.css";

export async function AuthShell({ title, lead, children, aside }: { title: string; lead?: string; children: React.ReactNode; aside?: React.ReactNode }) {
  const { t } = await getT();
  return (
    <div className={styles.shell}>
      <section className={`${styles.brand} on-red`} aria-hidden="true">
        <Image src={photos.thali.src} alt="" fill priority sizes="45vw" className={styles.photo} />
        <p className={styles.promise}>{t("brand.promise")}</p>
        <p className={styles.core}>{t("brand.core")}</p>
      </section>
      <section className={styles.form}>
        <div className={styles.inner}>
          <h1 className="h1">{title}</h1>
          {lead ? <p className={styles.lead}>{lead}</p> : null}
          <div className={styles.body}>{children}</div>
          {aside ? <div className={styles.aside}>{aside}</div> : null}
        </div>
      </section>
    </div>
  );
}
