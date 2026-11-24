import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/account/AuthShell";
import { RegisterForm } from "@/components/account/AuthForms";
import { getT } from "@/i18n";
import { getCurrentUser } from "@/server/auth/session";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("account.register") };
}

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams;
  if (await getCurrentUser()) redirect("/account");
  const { t } = await getT();
  return (
    <AuthShell
      title={t("account.register")}
      lead={t("account.registerLead")}
      aside={<>{t("account.haveAccount")} <Link className="link" href={`/account/login${sp.next ? `?next=${encodeURIComponent(sp.next)}` : ""}`}>{t("account.login")}</Link></>}
    >
      <RegisterForm next={sp.next} />
    </AuthShell>
  );
}
