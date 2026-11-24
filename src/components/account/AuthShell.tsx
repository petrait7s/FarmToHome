import { getT } from "@/i18n";
import styles from "./AuthShell.module.css";

export async function AuthShell({ title, lead, children, aside }: { title: string; lead?: string; children: React.ReactNode; aside?: React.ReactNode }) {
  const { t } = await getT();
  return (
    <div className={styles.shell}>
      <section className={`${styles.brand} on-red`} aria-hidden="true">
        <svg className={styles.art} viewBox="0 0 400 400">
          <circle cx="250" cy="150" r="120" fill="#C6A15B" />
          <circle cx="150" cy="240" r="90" fill="#F4EBDD" opacity=".16" />
          <circle cx="240" cy="250" r="130" fill="none" stroke="#F4EBDD" strokeWidth="1.2" opacity=".75" />
        </svg>
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
