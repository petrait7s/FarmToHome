import type { OrderStatus } from "@/generated/prisma/client";
import { applicableStages } from "@/server/orders/workflow";
import { getT } from "@/i18n";
import styles from "./OrderTimeline.module.css";

/** Shows only the stages that apply to this order, with the time each was reached. */
export async function OrderTimeline({ status, needsSourcing, history }: { status: OrderStatus; needsSourcing: boolean; history: { status: OrderStatus; createdAt: Date; note: string | null }[] }) {
  const { t, locale } = await getT();
  const fmt = (d: Date) => d.toLocaleString(locale === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Dhaka" });
  if (status === "CANCELLED") {
    const c = history.find((h) => h.status === "CANCELLED");
    return (
      <ol className={styles.list}>
        {history.map((h) => (
          <li key={`${h.status}-${h.createdAt.toISOString()}`} className={`${styles.step} ${styles.done}`}>
            <span className={styles.dot} aria-hidden="true" />
            <div><b>{t(`orders.status.${h.status}`)}</b><span>{fmt(h.createdAt)}{h.note && h === c ? ` · ${h.note}` : ""}</span></div>
          </li>
        ))}
      </ol>
    );
  }
  const stages = applicableStages(needsSourcing);
  const currentIdx = stages.indexOf(status);
  return (
    <ol className={styles.list}>
      {stages.map((s, i) => {
        const reached = history.find((h) => h.status === s);
        const state = i < currentIdx ? styles.done : i === currentIdx ? styles.current : styles.todo;
        return (
          <li key={s} className={`${styles.step} ${state}`} aria-current={i === currentIdx ? "step" : undefined}>
            <span className={styles.dot} aria-hidden="true" />
            <div><b>{t(`orders.status.${s}`)}</b>{reached ? <span>{fmt(reached.createdAt)}</span> : null}</div>
          </li>
        );
      })}
    </ol>
  );
}
