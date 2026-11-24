import Link from "next/link";
import { getT } from "@/i18n";
import { BrandMark } from "@/components/ui/BrandLogo";

export default async function NotFound() {
  const { t } = await getT();
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, maxWidth: 520 }}>
        <BrandMark size={56} />
        <h1 className="h1">{t("common.notFoundTitle")}</h1>
        <p className="lead">{t("common.notFoundBody")}</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/" className="btn btn-primary">{t("common.backHome")}</Link>
          <Link href="/explore" className="btn">{t("nav.explore")}</Link>
        </div>
      </div>
    </main>
  );
}
