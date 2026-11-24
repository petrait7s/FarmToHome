import Image from "next/image";
import { getT } from "@/i18n";
import { photos, altFor } from "@/lib/media";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("credits.title") };
}

/** Lists every illustrative stock photograph used in the preview, with its source. */
export default async function CreditsPage() {
  const { t, locale } = await getT();
  return (
    <div className="container page-pad" style={{ paddingTop: 48, paddingBottom: 88 }}>
      <h1 className="h1">{t("credits.title")}</h1>
      <p className="lead" style={{ color: "var(--muted)", marginTop: 12, maxWidth: "70ch" }}>{t("credits.body")}</p>
      <ul style={{ listStyle: "none", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 18, marginTop: 32 }}>
        {Object.values(photos).map((p) => (
          <li key={p.src} style={{ background: "var(--white)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
            <span style={{ position: "relative", display: "block", aspectRatio: "4 / 3" }}><Image src={p.src} alt={altFor(p, locale)} fill sizes="240px" style={{ objectFit: "cover" }} /></span>
            <span style={{ display: "block", padding: "10px 12px", fontSize: 13 }}>
              {altFor(p, locale)}
              <a href={p.credit} target="_blank" rel="noopener noreferrer" className="link" style={{ display: "block", marginTop: 4, fontSize: 12 }}>Unsplash · {t("credits.license")}</a>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
