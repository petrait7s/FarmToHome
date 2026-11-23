import { notFound } from "next/navigation";
import { getT } from "@/i18n";
import { getOrderForViewer } from "@/server/orders/access";
import { simulatePaymentAction } from "@/app/actions/orders";
import { formatMoney } from "@/lib/money";

export const metadata = { title: "Simulated payment", robots: { index: false } };

/** Development sandbox page standing in for a real payment provider. Clearly labelled; no money moves. */
export default async function SimulatedPayPage({ params, searchParams }: { params: Promise<{ ref: string; paymentId: string }>; searchParams: Promise<{ t?: string }> }) {
  const { ref, paymentId } = await params;
  const sp = await searchParams;
  const access = await getOrderForViewer(ref, sp.t);
  if (!access || (!access.viewer.owner && !access.viewer.guest)) notFound();
  const payment = access.order.payments.find((p) => p.id === paymentId && p.isSimulated);
  if (!payment) notFound();
  const { t, locale } = await getT();
  return (
    <div className="container narrow page-pad" style={{ paddingTop: 56, paddingBottom: 80 }}>
      <div className="panel" style={{ padding: 32, display: "flex", flexDirection: "column", gap: 16 }}>
        <span className="demo-tag" style={{ alignSelf: "flex-start" }}>{t("checkout.simulatedBadge")}</span>
        <h1 className="h2">{t("pay.title")}</h1>
        <p>{t("pay.body")}</p>
        <p className="h3">{formatMoney(payment.amountMinor, locale)} · <span className="mono">{ref}</span></p>
        <p>{t(`checkout.methods.${payment.method}.title`)} — {t("pay.done", { status: t(`orders.payment.${payment.status}`) })}</p>
        {payment.status === "PENDING" || payment.status === "FAILED" ? (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {(["success", "failure"] as const).map((o) => (
              <form key={o} action={simulatePaymentAction}>
                <input type="hidden" name="ref" value={ref} />
                <input type="hidden" name="paymentId" value={payment.id} />
                <input type="hidden" name="t" value={sp.t ?? ""} />
                <input type="hidden" name="outcome" value={o} />
                <button className={o === "success" ? "btn btn-primary" : "btn"}>{o === "success" ? t("pay.approve") : t("pay.fail")}</button>
              </form>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
