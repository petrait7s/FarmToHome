import { getT } from "@/i18n";
import { localized } from "@/i18n/shared";
import { db } from "@/lib/db";

export const metadata = { title: "FAQ" };

export default async function FaqPage() {
  const { t, locale } = await getT();
  const items = await db.faqItem.findMany({ where: { active: true }, orderBy: { position: "asc" } });
  return (
    <div className="container narrow page-pad" style={{ paddingTop: 48, paddingBottom: 80 }}>
      <h1 className="h1" style={{ marginBottom: 28 }}>{t("footer.faq")}</h1>
      {items.map((f) => (
        <details key={f.id} style={{ borderBottom: "1px solid var(--line)", padding: "18px 0" }}>
          <summary className="serif" style={{ fontSize: 20, cursor: "pointer" }}>{localized(f, "question", locale)}</summary>
          <p style={{ marginTop: 10 }}>{localized(f, "answer", locale)}</p>
        </details>
      ))}
    </div>
  );
}
