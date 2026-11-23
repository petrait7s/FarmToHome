import { redirect } from "next/navigation";
import { getT } from "@/i18n";
import { db } from "@/lib/db";
import { normalizeBatchNumber } from "@/server/traceability";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export const metadata = { title: "Know Your Origin" };

export default async function TraceLookupPage({ searchParams }: { searchParams: Promise<{ batch?: string }> }) {
  const { batch } = await searchParams;
  const { t } = await getT();
  let notFoundQ: string | null = null;
  if (batch?.trim()) {
    const n = normalizeBatchNumber(batch).slice(0, 40);
    const exists = await db.batch.findUnique({ where: { batchNumber: n }, select: { batchNumber: true } });
    if (exists) redirect(`/trace/${exists.batchNumber}`);
    notFoundQ = n;
  }
  const recent = await db.batch.findMany({ where: { status: { in: ["ACTIVE", "APPROVED", "PACKED"] }, product: { status: "ACTIVE" } }, orderBy: { collectedAt: "desc" }, take: 6, select: { batchNumber: true, product: { select: { name: true } } } });
  return (
    <div className="page-pad">
      <section className="on-red" style={{ padding: "64px 0 72px" }}>
        <div className="container narrow">
          <p className="eyebrow" style={{ background: "var(--ivory)", color: "var(--sky)", padding: "7px 14px", borderRadius: 999 }}><Icon name="qr" size={15} />{t("nav.trace")}</p>
          <h1 className="display" style={{ marginTop: 20 }}>{t("trace.title")}</h1>
          <p style={{ fontSize: 19, fontWeight: 500, marginTop: 16, maxWidth: "48ch" }}>{t("trace.lead")}</p>
        </div>
      </section>
      <section className="container narrow" style={{ paddingTop: 40, paddingBottom: 72 }}>
        <form method="get" action="/trace" className="panel" style={{ padding: 26, display: "flex", flexDirection: "column", gap: 12 }}>
          {notFoundQ ? <p className="form-error" role="alert">{t("trace.notFound", { q: notFoundQ })}</p> : null}
          <label className="label" htmlFor="batch">{t("trace.batchLabel")}</label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input id="batch" name="batch" className="input mono" style={{ flex: 1, minWidth: 220 }} placeholder={t("trace.batchPlaceholder")} defaultValue={batch ?? ""} autoComplete="off" autoCapitalize="characters" />
            <button className="btn btn-primary">{t("trace.lookup")}</button>
          </div>
        </form>
        {recent.length ? (
          <div style={{ marginTop: 32 }}>
            <p className="label" style={{ marginBottom: 10 }}>{t("common.demoData")}</p>
            <ul style={{ listStyle: "none", display: "grid", gap: 8 }}>
              {recent.map((b) => <li key={b.batchNumber}><Link className="link mono" href={`/trace/${b.batchNumber}`}>{b.batchNumber}</Link> · {b.product.name}</li>)}
            </ul>
          </div>
        ) : null}
      </section>
    </div>
  );
}
