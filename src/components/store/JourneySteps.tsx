import { getT } from "@/i18n";
import { formatNumber } from "@/lib/money";
import Image from "next/image";
import { photos, stagePhoto, altFor } from "@/lib/media";
import styles from "./JourneySteps.module.css";

export const JOURNEY_KEYS = ["source", "collection", "inspection", "processing", "packaging", "farmtohome", "delivery"] as const;

/** The seven-stage Source → Delivery journey used on Home and Our Journey. */
export async function JourneySteps({ withPhotos = false }: { withPhotos?: boolean } = {}) {
  const { t, locale } = await getT();
  return (
    <ol className={`${styles.steps} ${withPhotos ? styles.photoSteps : ""}`}>
      {JOURNEY_KEYS.map((k, i) => (
        <li key={k} className={styles.step}>
          {withPhotos ? (
            <span className={styles.photo}>
              <Image src={photos[stagePhoto[k]].src} alt={altFor(photos[stagePhoto[k]], locale)} fill sizes="(max-width: 900px) 60vw, 14vw" />
            </span>
          ) : null}
          <span className={styles.num} aria-hidden="true">{formatNumber(i + 1, locale)}</span>
          <h3 className={styles.title}>{t(`trace.stages.${k}`)}</h3>
          <p className={styles.body}>{t(`journey.stepBodies.${k}`)}</p>
        </li>
      ))}
    </ol>
  );
}
