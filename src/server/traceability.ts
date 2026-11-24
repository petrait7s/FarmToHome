import "server-only";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

export type StageKey = "source" | "collection" | "inspection" | "processing" | "packaging" | "farmtohome" | "delivery";
export type Stage = { key: StageKey; recorded: boolean; date: Date | null; detail: string | null };

export function normalizeBatchNumber(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}

/** Batch journey built only from recorded data. Missing stages are reported as not recorded — never invented. */
export async function getBatchJourney(batchNumber: string) {
  const batch = await db.batch.findUnique({
    where: { batchNumber: normalizeBatchNumber(batchNumber) },
    include: {
      product: { include: { category: true } },
      producer: { include: { origin: true } },
      origin: true,
      procurementItem: { include: { procurement: true } },
      inspections: { orderBy: { inspectedAt: "asc" } },
      reports: { orderBy: { createdAt: "asc" } },
      movements: { where: { type: { in: ["QC_APPROVED", "PROCUREMENT_RECEIVED"] } }, orderBy: { createdAt: "asc" }, take: 1 },
      allocations: { where: { fulfilled: true }, take: 1, select: { id: true } },
    },
  });
  if (!batch || batch.product.status === "ARCHIVED") return null;
  const inspection = batch.inspections.at(-1) ?? null;
  const stocked = batch.movements[0] ?? null;
  const stages: Stage[] = [
    { key: "source", recorded: !!batch.producer, date: null, detail: batch.producer ? `${batch.producer.name}${batch.producer.village ? `, ${batch.producer.village}` : ""}, ${batch.producer.origin.district}` : null },
    { key: "collection", recorded: !!batch.collectedAt, date: batch.collectedAt, detail: batch.sourceNote },
    { key: "inspection", recorded: !!inspection, date: inspection?.inspectedAt ?? null, detail: inspection ? [inspection.result, inspection.grade].filter(Boolean).join(" · ") : null },
    { key: "processing", recorded: !!batch.processedAt || !!batch.processingNotes, date: batch.processedAt, detail: batch.processingNotes },
    { key: "packaging", recorded: !!batch.packedAt, date: batch.packedAt, detail: batch.packagingNotes },
    { key: "farmtohome", recorded: !!stocked, date: stocked?.createdAt ?? null, detail: batch.storageNotes },
    { key: "delivery", recorded: batch.allocations.length > 0, date: null, detail: null },
  ];
  return { batch, inspection, stages };
}

export function traceUrl(batchNumber: string): string {
  return `${env.APP_URL}/trace/${encodeURIComponent(batchNumber)}`;
}

export async function traceQrSvg(batchNumber: string): Promise<string> {
  return QRCode.toString(traceUrl(batchNumber), { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#0F766E", light: "#F4F1EA" } });
}
