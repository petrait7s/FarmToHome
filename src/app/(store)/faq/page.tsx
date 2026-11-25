import Link from "next/link";
import { getT } from "@/i18n";
import { localized } from "@/i18n/shared";
import { db } from "@/lib/db";
import { FaqList } from "@/components/store/FaqList";
import { Icon } from "@/components/ui/Icon";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("footer.faq") };
}

export default async function FaqPage() {
  const { t, locale } = await getT();
  const items = await db.faqItem.findMany({ where: { active: true }, orderBy: { position: "asc" } });
  return (
    <div className="container narrow page-pad" style={{ paddingTop: 48, paddingBottom: 80 }}>
      <p className="eyebrow"><span className="dot" aria-hidden="true" />{t("nav.concierge")}</p>
      <h1 className="h1" style={{ margin: "10px 0 28px" }}>{t("footer.faq")}</h1>
      <FaqList items={items.map((f) => ({ id: f.id, q: localized(f, "question", locale), a: localized(f, "answer", locale) }))} placeholder={t("faq.search")} empty={t("faq.empty")} />
      <div className="surface" style={{ marginTop: 40, padding: 28, borderRadius: "var(--r-lg)", display: "flex", gap: 20, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", background: "var(--white)", border: "1px solid var(--line)" }}>
        <div>
          <h2 className="h3">{t("faq.stillTitle")}</h2>
          <p style={{ color: "var(--text-muted)", marginTop: 6 }}>{t("faq.stillBody")}</p>
        </div>
        <Link href="/concierge" className="btn btn-primary"><Icon name="headset" /> {t("pilotCta")}</Link>
      </div>
    </div>
  );
}
