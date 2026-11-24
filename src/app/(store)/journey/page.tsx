import Link from "next/link";
import { getT } from "@/i18n";
import { db } from "@/lib/db";
import { JourneySteps } from "@/components/store/JourneySteps";
import { Icon } from "@/components/ui/Icon";

export const metadata = { title: "Our Journey" };

export default async function JourneyPage() {
  const { t } = await getT();
  const origins = await db.origin.findMany({
    where: { producers: { some: { active: true } } },
    orderBy: [{ division: "asc" }, { district: "asc" }],
    include: { producers: { where: { active: true }, select: { slug: true, name: true } } },
  });
  return (
    <div className="page-pad">
      <section className="on-red" style={{ padding: "64px 0 72px", position: "relative", overflow: "hidden" }}>
        <svg viewBox="0 0 520 520" aria-hidden="true" style={{ position: "absolute", right: -100, top: -140, width: 560, height: 560 }}><circle cx="330" cy="190" r="150" fill="#C6A15B" /><circle cx="320" cy="320" r="150" fill="none" stroke="#F4EBDD" strokeWidth="1.2" opacity=".75" /></svg>
        <div className="container" style={{ position: "relative" }}>
          <h1 className="display">{t("journey.title")}</h1>
          <p style={{ fontSize: 19, fontWeight: 500, marginTop: 16, maxWidth: "52ch" }}>{t("journey.lead")}</p>
        </div>
      </section>
      <section className="container section">
        <h2 className="h1" style={{ marginBottom: 36 }}>{t("journey.stepsTitle")}</h2>
        <JourneySteps />
      </section>
      <section className="section" style={{ background: "var(--gold-15)" }}>
        <div className="container" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 48, alignItems: "center" }}>
          <h2 className="h1">{t("journey.fairTitle")}</h2>
          <div className="panel" style={{ padding: 28 }}>
            <p style={{ fontSize: 17 }}>{t("journey.fairBody")}</p>
            <Link href="/producers" className="btn btn-primary" style={{ marginTop: 20 }}>{t("journey.producersCta")} <Icon name="arrowRight" /></Link>
          </div>
        </div>
      </section>
      <section className="container section">
        <h2 className="h2" style={{ marginBottom: 24 }}>{t("journey.originsTitle")}</h2>
        <ul style={{ listStyle: "none", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "6px 28px" }}>
          {origins.map((o) => (
            <li key={o.id} style={{ padding: "14px 0", borderBottom: "1px solid var(--line)" }}>
              <Link href={`/explore?origin=${o.slug}`} className="serif" style={{ fontSize: 20 }}>{o.district}</Link>
              <span className="muted-note" style={{ display: "block" }}>{o.division} · {o.producers.map((p) => p.name).join(", ")}</span>
            </li>
          ))}
        </ul>
        <p style={{ marginTop: 28 }}><Link className="link" href="/trace">{t("nav.trace")}</Link></p>
      </section>
    </div>
  );
}
