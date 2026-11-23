import { getT } from "@/i18n";
export default async function Home() {
  const { t } = await getT();
  return <section className="container section"><h1 className="display">{t("home.titleA")} {t("home.titleB")}</h1></section>;
}
