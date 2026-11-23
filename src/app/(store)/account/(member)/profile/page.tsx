import { getT } from "@/i18n";
import { db } from "@/lib/db";
import { requireUserPage } from "@/server/auth/guards";
import { PasswordForm, ProfileForm } from "@/components/account/AccountForms";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUserPage("/account/profile");
  const { t } = await getT();
  const row = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  return (
    <div className="narrow stack" style={{ ["--stack" as string]: "40px" }}>
      <section>
        <h1 className="h1" style={{ marginBottom: 20 }}>{t("account.profile")}</h1>
        <ProfileForm name={row.name} email={row.email} phone={row.phone} />
      </section>
      <section>
        <h2 className="h3" style={{ marginBottom: 16 }}>{t("account.changePassword")}</h2>
        <PasswordForm />
      </section>
    </div>
  );
}
