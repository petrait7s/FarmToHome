import { AuthShell } from "@/components/account/AuthShell";
import { ResetForm } from "@/components/account/AuthForms";
import { getT } from "@/i18n";

export const metadata = { title: "Choose a new password", robots: { index: false } };

export default async function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { t } = await getT();
  return (
    <AuthShell title={t("account.resetTitle")}>
      <ResetForm token={token} />
    </AuthShell>
  );
}
