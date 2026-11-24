import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getT } from "@/i18n";
import { localized } from "@/i18n/shared";
import { getBatchJourney, traceQrSvg } from "@/server/traceability";
import { getSettings, originClassDefinition } from "@/server/settings";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { OriginSeal } from "@/components/ui/OriginSeal";
import { Icon } from "@/components/ui/Icon";
import { formatNumber } from "@/lib/money";
import styles from "./trace.module.css";

export async function generateMetadata({ params }: { params: Promise<{ batch: string }> }): Promise<Metadata> {
  const { batch } = await params;
  return { title: `Batch ${decodeURIComponent(batch)}` };
}

export default async function BatchPage({ params }: { params: Promise<{ batch: string }> }) {
  const { batch: raw } = await params;
  const journey = await getBatchJourney(decodeURIComponent(raw));
  if (!journey) notFound();
  const { batch, inspection, stages } = journey;
  const { t, locale } = await getT();
  const [qr, settings] = await Promise.all([traceQrSvg(batch.batchNumber), getSettings()]);
  const fmt = (d: Date | null) => (d ? d.toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Dhaka" }) : null);
  const name = localized(batch.product, "name", locale);
  const clsDef = originClassDefinition(settings.originClassDefinitions, batch.product.originClass);

  return (
    <div className="page-pad">
      <section className={`${styles.hero} on-red`}>
        <div className={`container ${styles.heroGrid}`}>
          <div className={styles.heroThumb}><ProductVisual artKey={batch.product.artKey} alt={name} size="fill" /></div>
          <div>
            <p className={styles.pill}><Icon name="qr" size={14} />{t("trace.title")}</p>
            <h1 className="display" style={{ fontSize: "clamp(34px,5vw,64px)" }}>{name}</h1>
            <p className={styles.batchNo}>{t("trace.batchId")} <span className="mono">{batch.batchNumber}</span></p>
          </div>
        </div>
      </section>

      <div className={`container ${styles.grid}`}>
        <section>
          {batch.isDemo ? <p className="form-ok" style={{ marginBottom: 24 }}>{t("trace.demoNotice")}</p> : null}
          <h2 className="h2">{t("trace.journey")}</h2>
          <ol className={styles.timeline}>
            {stages.map((s, i) => (
              <li key={s.key} className={s.recorded ? styles.recorded : styles.missing} style={{ animationDelay: `${i * 90}ms` }}>
                <span className={styles.num}>{formatNumber(i + 1, locale)}</span>
                <div>
                  <h3>{t(`trace.stages.${s.key}`)}</h3>
                  {s.recorded ? (
                    <>
                      {s.date ? <p className={styles.date}>{fmt(s.date)}</p> : null}
                      <p>{s.key === "inspection" && inspection ? `${t(`trace.result.${inspection.result}`)}${inspection.grade ? ` · ${inspection.grade}` : ""}` : s.key === "delivery" ? t("trace.deliveryNote") : s.detail ?? ""}</p>
                      {s.key === "farmtohome" ? <p className="muted-note">{t("trace.stockedAt")}</p> : null}
                    </>
                  ) : (
                    <p className="muted-note">{s.key === "delivery" ? t("trace.deliveryNote") : t("trace.notRecorded")}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>

          {batch.product.story ? (
            <div className={styles.story}>
              <p className="eyebrow"><span className="dot" aria-hidden="true" />{t("product.story")}</p>
              <p className={styles.storyText}>{localized(batch.product, "story", locale)}</p>
              {batch.producer?.quote && !batch.producer.isDemo ? <blockquote>“{batch.producer.quote}” <cite>— {batch.producer.name}</cite></blockquote> : null}
            </div>
          ) : null}
        </section>

        <aside className={styles.side}>
          <div className={styles.card}>
            <p className="eyebrow">{t("trace.identity")}</p>
            <dl className={styles.dl}>
              <dt>{t("trace.product")}</dt><dd><Link className="link" href={`/products/${batch.product.slug}`}>{name}</Link></dd>
              <dt>{t("trace.producer")}</dt><dd>{batch.producer ? <Link className="link" href={`/producers/${batch.producer.slug}`}>{localized(batch.producer, "name", locale)}</Link> : "—"}{batch.producer ? <span className="muted-note" style={{ display: "block" }}>{t(`producers.verification.${batch.producer.verificationStatus}`)}</span> : null}</dd>
              <dt>{t("trace.location")}</dt><dd>{[batch.producer?.village, batch.origin?.district, batch.origin?.division].filter(Boolean).join(", ") || "—"}</dd>
              <dt>{t("product.originClass")}</dt><dd><OriginSeal cls={batch.product.originClass} /> {clsDef ?? t("common.definitionPending")}</dd>
              <dt>{t("product.grade")}</dt><dd>{batch.qualityGrade ?? "—"}</dd>
              <dt>{t("trace.status")}</dt><dd>{t(`trace.batchStatus.${batch.status}`)}</dd>
              {batch.receivedQuantity ? (<><dt>{t("trace.receivedQty")}</dt><dd>{batch.receivedQuantity} {batch.quantityUnit}</dd></>) : null}
              {batch.receivedQuantity ? (<><dt>{t("trace.losses")}</dt><dd>{batch.rejectedQuantity} / {batch.processingLoss} / {batch.packagingLoss} {batch.quantityUnit}</dd></>) : null}
              {batch.storageNotes ? (<><dt>{t("product.storage")}</dt><dd>{batch.storageNotes}</dd></>) : null}
            </dl>
          </div>
          <div className={styles.card}>
            <p className="label">{t("product.reports")}</p>
            {batch.reports.length === 0 ? <p className="muted-note">{t("product.reportUnavailable")}</p> : batch.reports.map((r) => (
              <div key={r.id} className={styles.report}>
                <b>{r.title}</b>
                {r.laboratory ? <span>{r.laboratory}</span> : null}
                {r.summary ? <span className="muted-note">{r.summary}</span> : null}
                <span className="muted-note">{r.isVerified && !r.isDemo ? t("product.reportVerified") : t("product.reportDemo")}</span>
                {r.fileUrl ? <a className="link" href={r.fileUrl} target="_blank" rel="noopener noreferrer">PDF</a> : null}
              </div>
            ))}
          </div>
          <div className={`${styles.card} ${styles.qr}`}>
            <div className={styles.qrCode} role="img" aria-label={`QR code for batch ${batch.batchNumber}`} dangerouslySetInnerHTML={{ __html: qr }} />
            <p className="muted-note">{t("trace.scanNote")}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
