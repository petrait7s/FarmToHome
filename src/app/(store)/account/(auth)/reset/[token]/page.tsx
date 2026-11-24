import { AuthShell } from "@/components/account/AuthShell";
import { ResetForm } from "@/components/account/AuthForms";
import { getT } from "@/i18n";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("account.resetTitle"), robots: { index: false } };
}

export default async function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { t } = await getT();
  return (
    <AuthShell title={t("account.resetTitle")}>
      <ResetForm token={token} />
    </AuthShell>
  );
}
