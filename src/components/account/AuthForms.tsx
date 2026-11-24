"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, registerAction, requestResetAction, resetPasswordAction, type AuthState } from "@/app/actions/auth";
import { Field, FormError } from "@/components/ui/Field";
import { useI18n } from "@/i18n/client";

export function LoginForm({ next, resetDone }: { next?: string; resetDone?: boolean }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<AuthState, FormData>(loginAction, undefined);
  return (
    <form action={action} className="stack" style={{ ["--stack" as string]: "16px" }} noValidate>
      {resetDone ? <p className="form-ok" role="status">{t("account.resetDone")}</p> : null}
      <FormError code={state?.errors?._form} />
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label={t("account.identifier")} name="identifier" autoComplete="username" required error={state?.errors?.identifier} />
      <Field label={t("account.password")} name="password" type="password" autoComplete="current-password" required error={state?.errors?.password} />
      <button className="btn btn-primary btn-block btn-lg" disabled={pending}>{pending ? t("common.loading") : t("account.login")}</button>
      <p className="muted-note"><Link className="link" href="/account/forgot">{t("account.forgot")}</Link></p>
    </form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<AuthState, FormData>(registerAction, undefined);
  return (
    <form action={action} className="stack" style={{ ["--stack" as string]: "16px" }} noValidate>
      <FormError code={state?.errors?._form} />
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label={t("account.name")} name="name" autoComplete="name" required error={state?.errors?.name} />
      <Field label={t("checkout.phone")} name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" required error={state?.errors?.phone} />
      <Field label={t("checkout.email")} name="email" type="email" autoComplete="email" optional error={state?.errors?.email} />
      <div className="grid-2">
        <Field label={t("account.password")} name="password" type="password" autoComplete="new-password" hint={t("account.passwordHint")} required error={state?.errors?.password} />
        <Field label={t("account.confirmPassword")} name="confirm" type="password" autoComplete="new-password" required error={state?.errors?.confirm} />
      </div>
      <button className="btn btn-primary btn-block btn-lg" disabled={pending}>{pending ? t("common.loading") : t("account.register")}</button>
    </form>
  );
}

export function ForgotForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<AuthState, FormData>(requestResetAction, undefined);
  return (
    <form action={action} className="stack" style={{ ["--stack" as string]: "16px" }} noValidate>
      <FormError code={state?.errors?._form} />
      {state?.ok ? <p className="form-ok" role="status">{t("account.resetSent")}</p> : null}
      {state?.devLink ? (
        <p className="muted-note">
          {t("account.devResetLink")} <a className="link" href={state.devLink}>{state.devLink}</a>
        </p>
      ) : null}
      <Field label={t("account.identifier")} name="identifier" autoComplete="username" required error={state?.errors?.identifier} />
      <button className="btn btn-primary btn-block btn-lg" disabled={pending}>{t("account.sendLink")}</button>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<AuthState, FormData>(resetPasswordAction, undefined);
  return (
    <form action={action} className="stack" style={{ ["--stack" as string]: "16px" }} noValidate>
      <FormError code={state?.errors?._form} />
      <input type="hidden" name="token" value={token} />
      <Field label={t("account.newPassword")} name="password" type="password" autoComplete="new-password" hint={t("account.passwordHint")} required error={state?.errors?.password} />
      <Field label={t("account.confirmPassword")} name="confirm" type="password" autoComplete="new-password" required error={state?.errors?.confirm} />
      <button className="btn btn-primary btn-block btn-lg" disabled={pending}>{t("common.save")}</button>
    </form>
  );
}
