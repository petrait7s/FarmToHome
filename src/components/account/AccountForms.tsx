"use client";

import { useActionState, useState } from "react";
import { changePasswordAction, saveAddressAction, savePreferencesAction, updateProfileAction, type FormState } from "@/app/actions/account";
import { Field, FormError } from "@/components/ui/Field";
import { useI18n } from "@/i18n/client";

export function ProfileForm({ name, email, phone }: { name: string; email: string | null; phone: string }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfileAction, undefined);
  return (
    <form action={action} className="stack" style={{ ["--stack" as string]: "14px" }}>
      {state?.ok ? <p className="form-ok" role="status">{t("account.profileSaved")}</p> : null}
      <FormError code={state?.errors?._form} />
      <Field label={t("account.name")} name="name" defaultValue={name} error={state?.errors?.name} autoComplete="name" />
      <Field label={t("checkout.email")} name="email" type="email" defaultValue={email ?? ""} optional error={state?.errors?.email} autoComplete="email" />
      <Field label={t("checkout.phone")} name="phone_display" defaultValue={phone} disabled hint={t("account.phoneHint")} />
      <button className="btn btn-primary" disabled={pending}>{pending ? t("common.saving") : t("common.save")}</button>
    </form>
  );
}

export function PasswordForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<FormState, FormData>(changePasswordAction, undefined);
  return (
    <form action={action} className="stack" style={{ ["--stack" as string]: "14px" }}>
      {state?.ok ? <p className="form-ok" role="status">{t("account.passwordChanged")}</p> : null}
      <FormError code={state?.errors?._form} />
      <Field label={t("account.currentPassword")} name="current" type="password" autoComplete="current-password" error={state?.errors?.current} />
      <div className="grid-2">
        <Field label={t("account.newPassword")} name="password" type="password" autoComplete="new-password" hint={t("account.passwordHint")} error={state?.errors?.password} />
        <Field label={t("account.confirmPassword")} name="confirm" type="password" autoComplete="new-password" error={state?.errors?.confirm} />
      </div>
      <button className="btn" disabled={pending}>{t("account.changePassword")}</button>
    </form>
  );
}

type Zone = { division: string; district: string; areas: string[] };
type Address = { id?: string; label: string; recipient: string; phone: string; division: string; district: string; area: string; line1: string; landmark: string | null; instructions: string | null };

export function AddressForm({ zones, initial, onDone }: { zones: Zone[]; initial?: Address; onDone?: () => void }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<FormState, FormData>(async (p, fd) => {
    const r = await saveAddressAction(p, fd);
    if (r?.ok) onDone?.();
    return r;
  }, undefined);
  const [division, setDivision] = useState(initial?.division ?? zones[0]?.division ?? "");
  const [district, setDistrict] = useState(initial?.district ?? zones[0]?.district ?? "");
  const divisions = [...new Set(zones.map((z) => z.division))];
  const districts = [...new Set(zones.filter((z) => z.division === division).map((z) => z.district))];
  const areas = zones.filter((z) => z.district === district).flatMap((z) => z.areas).sort();
  return (
    <form action={action} className="stack" style={{ ["--stack" as string]: "14px" }}>
      <FormError code={state?.errors?._form} />
      {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      <div className="grid-2">
        <Field label={t("account.label")} name="label" defaultValue={initial?.label ?? "Home"} error={state?.errors?.label} />
        <Field label={t("account.recipient")} name="recipient" defaultValue={initial?.recipient ?? ""} error={state?.errors?.recipient} autoComplete="name" />
      </div>
      <Field label={t("checkout.phone")} name="phone" type="tel" defaultValue={initial?.phone ?? ""} error={state?.errors?.phone} autoComplete="tel" />
      <div className="grid-2">
        <Field as="select" label={t("checkout.division")} name="division" value={division} onChange={(e) => { setDivision(e.target.value); setDistrict(""); }}>
          {divisions.map((d) => <option key={d}>{d}</option>)}
        </Field>
        <Field as="select" label={t("checkout.district")} name="district" value={district} onChange={(e) => setDistrict(e.target.value)}>
          <option value="">—</option>
          {districts.map((d) => <option key={d}>{d}</option>)}
        </Field>
      </div>
      <Field as="select" label={t("checkout.area")} name="area" defaultValue={initial?.area ?? ""} error={state?.errors?.area}>
        <option value="">—</option>
        {areas.map((a) => <option key={a}>{a}</option>)}
      </Field>
      <Field label={t("checkout.line1")} name="line1" defaultValue={initial?.line1 ?? ""} error={state?.errors?.line1} autoComplete="street-address" />
      <div className="grid-2">
        <Field label={t("checkout.landmark")} name="landmark" optional defaultValue={initial?.landmark ?? ""} />
        <Field label={t("checkout.instructions")} name="instructions" optional defaultValue={initial?.instructions ?? ""} />
      </div>
      <button className="btn btn-primary" disabled={pending}>{pending ? t("common.saving") : t("common.save")}</button>
    </form>
  );
}

export function PreferencesForm({ language, householdSize, prefs }: { language: "EN" | "BN"; householdSize: number | null; prefs: { notifyOrderUpdates: boolean; notifyHarvestNews: boolean; notifyBySms: boolean; notifyByEmail: boolean } }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<FormState, FormData>(savePreferencesAction, undefined);
  return (
    <form action={action} className="stack" style={{ ["--stack" as string]: "16px" }}>
      {state?.ok ? <p className="form-ok" role="status">{t("common.saved")}</p> : null}
      <div className="grid-2">
        <Field as="select" label={t("account.prefs.language")} name="language" defaultValue={language}>
          <option value="EN">English</option>
          <option value="BN">বাংলা</option>
        </Field>
        <Field label={t("account.prefs.household")} name="householdSize" type="number" min={1} max={20} defaultValue={householdSize ?? ""} />
      </div>
      <fieldset style={{ border: 0, display: "grid", gap: 10 }}>
        <legend className="label" style={{ marginBottom: 8 }}>{t("account.notifications")}</legend>
        <label className="check"><input type="checkbox" name="notifyOrderUpdates" defaultChecked={prefs.notifyOrderUpdates} />{t("account.prefs.orderUpdates")}</label>
        <label className="check"><input type="checkbox" name="notifyHarvestNews" defaultChecked={prefs.notifyHarvestNews} />{t("account.prefs.harvestNews")}</label>
        <label className="check"><input type="checkbox" name="notifyBySms" defaultChecked={prefs.notifyBySms} />{t("account.prefs.sms")}</label>
        <label className="check"><input type="checkbox" name="notifyByEmail" defaultChecked={prefs.notifyByEmail} />{t("account.prefs.email")}</label>
      </fieldset>
      <button className="btn btn-primary" disabled={pending}>{t("common.save")}</button>
    </form>
  );
}
