"use client";

import { useId } from "react";
import { useI18n } from "@/i18n/client";

type Props = {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  as?: "input" | "textarea" | "select";
  children?: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement> & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

/** Labelled form field with accessible error/hint wiring. Error values are i18n keys under `errors.*`. */
export function Field({ label, name, error, hint, optional, as = "input", children, ...rest }: Props) {
  const id = useId();
  const { t } = useI18n();
  const errId = `${id}-err`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;
  const common = { id, name, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy };
  const errorText = error ? (error.includes(" ") ? error : t(`errors.${error}`)) : null;
  return (
    <div className="field" data-invalid={error ? "true" : undefined}>
      <label htmlFor={id} className="label">
        {label} {optional ? <span className="opt">({t("common.optional")})</span> : null}
      </label>
      {as === "textarea" ? (
        <textarea className="textarea" {...common} {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} />
      ) : as === "select" ? (
        <select className="select" {...common} {...(rest as unknown as React.SelectHTMLAttributes<HTMLSelectElement>)}>
          {children}
        </select>
      ) : (
        <input className="input" {...common} {...(rest as React.InputHTMLAttributes<HTMLInputElement>)} />
      )}
      {hint ? <span id={hintId} className="muted-note">{hint}</span> : null}
      {errorText ? <span id={errId} className="field-error">{errorText}</span> : null}
    </div>
  );
}

export function FormError({ code }: { code?: string }) {
  const { t } = useI18n();
  if (!code) return null;
  const key = code === "reset_invalid" ? "account.resetInvalid" : `errors.${code}`;
  return <p className="form-error" role="alert">{t(key)}</p>;
}
