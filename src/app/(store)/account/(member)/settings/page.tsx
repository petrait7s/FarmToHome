import { getT } from "@/i18n";
import { db } from "@/lib/db";
import { requireUserPage } from "@/server/auth/guards";
import { PreferencesForm } from "@/components/account/AccountForms";

export const metadata = { title: "Preferences" };

export default async function SettingsPage() {
  const user = await requireUserPage("/account/settings");
  const { t } = await getT();
  const p = await db.customerProfile.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {} });
  return (
    <div className="narrow">
      <h1 className="h1" style={{ marginBottom: 24 }}>{t("account.settings")}</h1>
      <PreferencesForm language={p.preferredLanguage} householdSize={p.householdSize} prefs={p} />
    </div>
  );
}
