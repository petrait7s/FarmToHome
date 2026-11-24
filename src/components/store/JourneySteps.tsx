import { getT } from "@/i18n";
import { formatNumber } from "@/lib/money";
import styles from "./JourneySteps.module.css";

export const JOURNEY_KEYS = ["source", "collection", "inspection", "processing", "packaging", "farmtohome", "delivery"] as const;

/** The seven-stage Source → Delivery journey used on Home and Our Journey. */
export async function JourneySteps() {
  const { t, locale } = await getT();
  return (
    <ol className={styles.steps}>
      {JOURNEY_KEYS.map((k, i) => (
        <li key={k} className={styles.step}>
          <span className={styles.num} aria-hidden="true">{formatNumber(i + 1, locale)}</span>
          <h3 className={styles.title}>{t(`trace.stages.${k}`)}</h3>
          <p className={styles.body}>{t(`journey.stepBodies.${k}`)}</p>
        </li>
      ))}
    </ol>
  );
}
