import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/account/AuthShell";
import { LoginForm } from "@/components/account/AuthForms";
import { getT } from "@/i18n";
import { getCurrentUser } from "@/server/auth/session";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("account.login") };
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string }> }) {
  const sp = await searchParams;
  if (await getCurrentUser()) redirect(sp.next?.startsWith("/") && !sp.next.startsWith("//") ? sp.next : "/account");
  const { t } = await getT();
  return (
    <AuthShell
      title={t("account.login")}
      lead={t("account.loginLead")}
      aside={<>{t("account.noAccount")} <Link className="link" href={`/account/register${sp.next ? `?next=${encodeURIComponent(sp.next)}` : ""}`}>{t("account.register")}</Link></>}
    >
      <LoginForm next={sp.next} resetDone={sp.reset === "1"} />
    </AuthShell>
  );
}
