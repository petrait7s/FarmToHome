import { getT } from "@/i18n";
import { areaOptions, getChosenArea } from "@/server/area";
import { formatMoney } from "@/lib/money";
import { slotDay, slotTime } from "@/lib/slots";
import { Icon } from "@/components/ui/Icon";
import { AreaPicker } from "./AreaPicker";
import styles from "./DeliveryStrip.module.css";

/** Slim bar under the header: chosen area, next open slot and the delivery fee, before anything is in the basket. */
export async function DeliveryStrip() {
  const { t, locale } = await getT();
  const [chosen, options] = await Promise.all([getChosenArea(), areaOptions()]);
  if (!options.length) return null;
  const value = chosen ? `${chosen.zoneId}|${chosen.area}` : "";
  return (
    <div className={styles.strip}>
      <div className={`container ${styles.inner}`}>
        <Icon name="pin" size={16} />
        {chosen ? (
          <p className={styles.text}>
            <b>{t("area.deliverTo", { area: chosen.area })}</b>
            <span className={styles.sep} aria-hidden="true">·</span>
            <span>{chosen.next ? t("area.next", { when: `${slotDay(chosen.next.date, locale)}, ${slotTime(chosen.next, locale)}` }) : t("area.noSlot")}</span>
            <span className={styles.sep} aria-hidden="true">·</span>
            <span>
              {t("area.fee", { fee: formatMoney(chosen.feeMinor, locale) })}
              {chosen.freeThresholdMinor ? `, ${t("area.freeOver", { min: formatMoney(chosen.freeThresholdMinor, locale) })}` : ""}
            </span>
          </p>
        ) : (
          <p className={styles.text}><b>{t("area.choose")}</b> <span className={styles.hint}>{t("area.chooseHint")}</span></p>
        )}
        <AreaPicker options={options} value={value} label={chosen ? t("area.change") : t("area.pick")} />
      </div>
    </div>
  );
}
