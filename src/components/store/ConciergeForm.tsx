"use client";

import { useActionState, useState } from "react";
import { submitConciergeAction, type ConciergeState } from "@/app/actions/concierge";
import { Field, FormError } from "@/components/ui/Field";
import { useI18n } from "@/i18n/client";

const TOPICS = ["SHOPPING_HELP", "BUILD_MARKET", "SOURCING", "AVAILABILITY", "SPECIAL_PRODUCT", "DELIVERY", "SUPPORT"] as const;

export function ConciergeForm({ defaults }: { defaults: { name: string; phone: string; email: string; topic?: string; orderRef?: string; productSlug?: string } }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<ConciergeState, FormData>(submitConciergeAction, undefined);
  if (state?.ok) return <p className="form-ok" role="status">{t("concierge.sent", { ref: state.reference ?? "" })}</p>;
  // The order number only matters for delivery and order questions; hide it otherwise.
  const [topic, setTopic] = useState(defaults.topic ?? "SHOPPING_HELP");
  const needsOrder = topic === "SUPPORT" || topic === "DELIVERY" || !!defaults.orderRef;
  return (
    <form action={action} className="stack" style={{ ["--stack" as string]: "14px" }} noValidate>
      <FormError code={state?.errors?._form} />
      <fieldset style={{ border: 0 }}>
        <legend className="label" style={{ marginBottom: 10 }}>{t("concierge.topic")}</legend>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {TOPICS.map((tp) => (
            <label key={tp} className="chip" style={{ cursor: "pointer" }}>
              <input type="radio" name="topic" value={tp} defaultChecked={(defaults.topic ?? "SHOPPING_HELP") === tp} onChange={() => setTopic(tp)} style={{ accentColor: "var(--red)" }} />
              {t(`concierge.topics.${tp}`)}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid-2">
        <Field label={t("concierge.name")} name="name" defaultValue={defaults.name} error={state?.errors?.name} autoComplete="name" />
        <Field label={t("concierge.phone")} name="phone" type="tel" defaultValue={defaults.phone} error={state?.errors?.phone} autoComplete="tel" />
      </div>
      <div className="grid-2">
        <Field label={t("concierge.email")} name="email" type="email" optional defaultValue={defaults.email} error={state?.errors?.email} />
        {needsOrder ? <Field label={t("concierge.orderRef")} name="orderRef" optional defaultValue={defaults.orderRef ?? ""} hint={t("concierge.orderRefHint")} /> : null}
      </div>
      <input type="hidden" name="productSlug" value={defaults.productSlug ?? ""} />
      <div style={{ position: "absolute", left: -9999 }} aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <Field as="textarea" label={t("concierge.message")} name="message" error={state?.errors?.message} rows={6} />
      <button className="btn btn-primary btn-lg" disabled={pending}>{pending ? t("common.loading") : t("concierge.send")}</button>
    </form>
  );
}
