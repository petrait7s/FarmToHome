import Link from "next/link";
import { AuthShell } from "@/components/account/AuthShell";
import { ForgotForm } from "@/components/account/AuthForms";
import { getT } from "@/i18n";

export const metadata = { title: "Reset password" };

export default async function ForgotPage() {
  const { t } = await getT();
  return (
    <AuthShell title={t("account.forgotTitle")} lead={t("account.forgotLead")} aside={<Link className="link" href="/account/login">{t("account.login")}</Link>}>
      <ForgotForm />
    </AuthShell>
  );
}
