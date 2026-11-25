"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Quote } from "@/server/quote";
import type { SlotView } from "@/server/delivery";
import { useCart } from "@/components/store/CartProvider";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/i18n/client";
import { formatMoney, formatNumber, toBanglaDigits } from "@/lib/money";
import { getQuote } from "@/app/actions/cart";
import { getSlots, placeOrderAction } from "@/app/actions/checkout";
import styles from "./CheckoutForm.module.css";

type Address = { id: string; label: string; recipient: string; phone: string; division: string; district: string; area: string; line1: string; landmark: string | null; instructions: string | null };
type Zone = { id: string; name: string; division: string; district: string; areas: string[] };

type Props = {
  idempotencyKey: string;
  user: { name: string; phone: string; email: string | null } | null;
  addresses: Address[];
  zones: Zone[];
  initialQuote: Quote;
  requireEmail: boolean;
};

const METHODS = ["CASH_ON_DELIVERY", "MOBILE_SIMULATED", "ONLINE_SIMULATED"] as const;

function slotText(s: { startTime: string; endTime: string }, locale: string) {
  const f = (t: string) => { const [h, m] = t.split(":").map(Number); const hh = h % 12 || 12; return `${hh}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h >= 12 ? "PM" : "AM"}`; };
  const text = `${f(s.startTime)} – ${f(s.endTime)}`;
  return locale === "bn" ? toBanglaDigits(text) : text;
}

export function CheckoutForm({ idempotencyKey, user, addresses, zones, initialQuote, requireEmail }: Props) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { cart } = useCart();
  const def = addresses[0];
  const [contact, setContact] = useState({ name: user?.name ?? "", phone: user?.phone ?? "", email: user?.email ?? "" });
  const [addressId, setAddressId] = useState<string>(def?.id ?? "new");
  const [addr, setAddr] = useState({ division: def?.division ?? zones[0]?.division ?? "", district: def?.district ?? zones[0]?.district ?? "", area: def?.area ?? "", line1: def?.line1 ?? "", landmark: def?.landmark ?? "", instructions: def?.instructions ?? "" });
  const [saveAddress, setSaveAddress] = useState(!!user && addresses.length === 0);
  const [slots, setSlots] = useState<SlotView[]>([]);
  const [date, setDate] = useState<string | null>(null);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [method, setMethod] = useState<(typeof METHODS)[number]>("CASH_ON_DELIVERY");
  const [note, setNote] = useState("");
  const [quote, setQuote] = useState(initialQuote);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<{ code: string; meta?: Record<string, string | number> } | null>(null);
  const [pending, start] = useTransition();
  const [loadingSlots, startSlots] = useTransition();

  const divisions = useMemo(() => [...new Set(zones.map((z) => z.division))], [zones]);
  const districts = useMemo(() => [...new Set(zones.filter((z) => z.division === addr.division).map((z) => z.district))], [zones, addr.division]);
  const areas = useMemo(() => zones.filter((z) => z.district === addr.district).flatMap((z) => z.areas).sort(), [zones, addr.district]);
  const zone = useMemo(() => zones.find((z) => z.district === addr.district && z.areas.includes(addr.area)) ?? null, [zones, addr.district, addr.area]);

  // Apply a saved address.
  useEffect(() => {
    const a = addresses.find((x) => x.id === addressId);
    if (a) {
      setAddr({ division: a.division, district: a.district, area: a.area, line1: a.line1, landmark: a.landmark ?? "", instructions: a.instructions ?? "" });
      setContact((c) => ({ ...c, name: c.name || a.recipient, phone: c.phone || a.phone }));
    }
  }, [addressId, addresses]);

  // Load slots and a zone-specific quote whenever the delivery zone changes.
  useEffect(() => {
    setSlotId(null);
    setDate(null);
    if (!zone) { setSlots([]); return; }
    startSlots(async () => {
      const [s, q] = await Promise.all([getSlots(zone.id), getQuote(zone.id)]);
      setSlots(s);
      setQuote(q);
      const firstOpen = s.find((x) => x.remaining > 0);
      if (firstOpen) setDate(firstOpen.date);
    });
  }, [zone]);

  const dates = useMemo(() => [...new Set(slots.map((s) => s.date))], [slots]);
  const daySlots = slots.filter((s) => s.date === date);
  const hasPerishable = cart.lines.some((l) => l.isPerishable);
  const fmtDay = (iso: string, opt: Intl.DateTimeFormatOptions) => new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", { ...opt, timeZone: "UTC" });

  const submit = () => {
    setFormError(null);
    const local: Record<string, string> = {};
    if (!slotId) local.slotId = "slot_invalid";
    if (!zone) local.area = "zone_invalid";
    if (requireEmail && !contact.email) local.email = "required";
    setErrors(local);
    if (Object.keys(local).length) {
      document.getElementById(local.area ? "sec-address" : "sec-schedule")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    start(async () => {
      const res = await placeOrderAction({
        idempotencyKey,
        name: contact.name, phone: contact.phone, email: contact.email,
        addressId: addressId !== "new" ? addressId : undefined,
        ...addr, slotId, paymentMethod: method, note, saveAddress: addressId === "new" && saveAddress,
      });
      if (res.ok) {
        router.push(res.redirectTo);
        router.refresh();
        return;
      }
      if (res.fields) {
        setErrors(res.fields);
        const first = Object.keys(res.fields)[0];
        document.getElementById(["name", "phone", "email"].includes(first) ? "sec-contact" : first === "slotId" ? "sec-schedule" : "sec-address")?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        setFormError({ code: res.error ?? "generic", meta: res.meta });
        if (res.error === "slot_full" && zone) startSlots(async () => setSlots(await getSlots(zone.id)));
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  };

  const errText = (code: string, meta?: Record<string, string | number>) =>
    t(`errors.${code}`, { ...(meta ?? {}), amount: meta?.amount ? formatMoney(Number(meta.amount), locale) : "" });

  return (
    <form className={styles.grid} onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
      <div className={styles.main}>
        <ol className={styles.steps} aria-hidden="true">
          {(["contact", "address", "schedule", "review", "payment"] as const).map((s, i) => (
            <li key={s}><i>{formatNumber(i + 1, locale)}</i>{t(`checkout.steps.${s}`)}</li>
          ))}
        </ol>
        {formError ? <p className="form-error" role="alert">{errText(formError.code, formError.meta)}</p> : null}

        <fieldset id="sec-contact" className={styles.fs}>
          <legend><span>01 —</span>{t("checkout.steps.contact")}</legend>
          <div className="grid-2">
            <Field label={t("checkout.fullName")} name="name" autoComplete="name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} error={errors.name} required />
            <Field label={t("checkout.phone")} name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} error={errors.phone} required />
          </div>
          <Field label={t("checkout.email")} name="email" type="email" autoComplete="email" optional={!requireEmail} value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} error={errors.email} />
        </fieldset>

        <fieldset id="sec-address" className={styles.fs}>
          <legend><span>02 —</span>{t("checkout.steps.address")}</legend>
          {addresses.length ? (
            <div className={styles.addrList} role="radiogroup" aria-label={t("checkout.savedAddresses")}>
              {addresses.map((a) => (
                <button key={a.id} type="button" role="radio" aria-checked={addressId === a.id} className={styles.addr} onClick={() => setAddressId(a.id)}>
                  <span className={styles.radio} aria-hidden="true" />
                  <span><b>{a.label}</b><span>{a.line1}, {a.area}, {a.district}</span></span>
                </button>
              ))}
              <button type="button" role="radio" aria-checked={addressId === "new"} className={styles.addr} onClick={() => setAddressId("new")}>
                <span className={styles.radio} aria-hidden="true" /><span><b>{t("checkout.newAddress")}</b></span>
              </button>
            </div>
          ) : null}
          <div className={styles.addrFields}>
            <div className="grid-2">
              <Field as="select" label={t("checkout.division")} name="division" value={addr.division} onChange={(e) => setAddr({ ...addr, division: e.target.value, district: "", area: "" })} disabled={addressId !== "new"}>
                {divisions.map((d) => <option key={d} value={d}>{d}</option>)}
              </Field>
              <Field as="select" label={t("checkout.district")} name="district" value={addr.district} onChange={(e) => setAddr({ ...addr, district: e.target.value, area: "" })} disabled={addressId !== "new"}>
                <option value="">—</option>
                {districts.map((d) => <option key={d} value={d}>{d}</option>)}
              </Field>
            </div>
            <Field as="select" label={t("checkout.area")} name="area" value={addr.area} onChange={(e) => setAddr({ ...addr, area: e.target.value })} error={errors.area} disabled={addressId !== "new"}>
              <option value="">—</option>
              {areas.map((a) => <option key={a} value={a}>{a}</option>)}
            </Field>
            <Field label={t("checkout.line1")} name="line1" autoComplete="street-address" value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} error={errors.line1} disabled={addressId !== "new"} />
            <div className="grid-2">
              <Field label={t("checkout.landmark")} name="landmark" optional value={addr.landmark} onChange={(e) => setAddr({ ...addr, landmark: e.target.value })} disabled={addressId !== "new"} />
              <Field label={t("checkout.instructions")} name="instructions" optional placeholder={t("checkout.instructionsPlaceholder")} value={addr.instructions} onChange={(e) => setAddr({ ...addr, instructions: e.target.value })} disabled={addressId !== "new"} />
            </div>
            {user && addressId === "new" ? <label className="check" style={{ marginTop: 12 }}><input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />{t("checkout.saveAddress")}</label> : null}
            {addr.area && !zone ? <p className="field-error" style={{ marginTop: 10 }}>{t("checkout.zoneNotServed")}</p> : null}
          </div>
        </fieldset>

        <fieldset id="sec-schedule" className={styles.fs} aria-busy={loadingSlots}>
          <legend><span>03 —</span>{t("checkout.steps.schedule")}</legend>
          {!zone ? <p className="muted-note">{addr.area ? t("checkout.zoneNotServed") : t("checkout.chooseAreaFirst")}</p> : (
            <>
              <p className="label" id="date-label">{t("checkout.date")}</p>
              <div className={styles.opts} role="radiogroup" aria-labelledby="date-label">
                {dates.map((d) => {
                  const open = slots.some((s) => s.date === d && s.remaining > 0);
                  return (
                    <button key={d} type="button" role="radio" aria-checked={date === d} disabled={!open} className={styles.opt} onClick={() => { setDate(d); setSlotId(null); }}>
                      <span className={styles.d1}>{fmtDay(d, { weekday: "short" })}</span>
                      <span className={styles.d2}>{fmtDay(d, { day: "numeric" })}</span>
                      <span className={styles.d3}>{fmtDay(d, { month: "short" })}</span>
                    </button>
                  );
                })}
              </div>
              <p className="label" id="slot-label" style={{ marginTop: 20 }}>{t("checkout.slot")}</p>
              {daySlots.length === 0 ? <p className="muted-note">{t("checkout.noSlots")}</p> : (
                <div className={`${styles.opts} ${styles.slots}`} role="radiogroup" aria-labelledby="slot-label">
                  {daySlots.map((s) => (
                    <button key={s.id} type="button" role="radio" aria-checked={slotId === s.id} disabled={s.remaining <= 0} className={styles.opt} onClick={() => setSlotId(s.id)}>
                      <span className={styles.slotTime}>{slotText(s, locale)}</span>
                      <span className={styles.d3}>{s.remaining <= 0 ? t("checkout.slotFull") : t("checkout.slotsLeft", { n: s.remaining })}</span>
                    </button>
                  ))}
                </div>
              )}
              {errors.slotId ? <p className="field-error" style={{ marginTop: 10 }}>{t(`errors.${errors.slotId}`)}</p> : null}
              {hasPerishable ? <p className={styles.info}><Icon name="info" size={16} />{t("checkout.perishableNote")}</p> : null}
            </>
          )}
        </fieldset>

        <fieldset className={styles.fs}>
          <legend><span>04 —</span>{t("checkout.reviewTitle")}</legend>
          <ul className={styles.review}>
            {cart.lines.filter((l) => l.available).map((l) => (
              <li key={l.variantId}><span>{locale === "bn" && l.productNameBn ? l.productNameBn : l.productName} <small>{l.variantLabel} × {formatNumber(l.quantity, locale)}</small></span><span>{formatMoney(l.lineTotalMinor, locale)}</span></li>
            ))}
          </ul>
          <Field as="textarea" label={t("checkout.note")} name="note" optional value={note} onChange={(e) => setNote(e.target.value)} />
        </fieldset>

        <fieldset className={styles.fs}>
          <legend><span>05 —</span>{t("checkout.payment")}</legend>
          <div className={styles.pay} role="radiogroup" aria-label={t("checkout.payment")}>
            {METHODS.map((m) => (
              <button key={m} type="button" role="radio" aria-checked={method === m} className={styles.payOpt} onClick={() => setMethod(m)}>
                <span className={styles.radio} aria-hidden="true" />
                <span>
                  <b>{t(`checkout.methods.${m}.title`)} {m !== "CASH_ON_DELIVERY" ? <span className="demo-tag">{t("checkout.simulatedBadge")}</span> : null}</b>
                  <span>{t(`checkout.methods.${m}.body`)}</span>
                </span>
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <aside className={`panel ${styles.summary}`} aria-busy={loadingSlots}>
        <h2 className="h3">{t(`market.summary.${cart.mode}`)}</h2>
        <dl className={styles.totals}>
          <div><dt>{t("common.subtotal")}</dt><dd>{formatMoney(quote.subtotalMinor, locale)}</dd></div>
          {quote.discountMinor ? <div><dt>{t("common.discount")} {quote.promoCode ? `(${quote.promoCode})` : ""}</dt><dd>− {formatMoney(quote.discountMinor, locale)}</dd></div> : null}
          <div><dt>{t("common.delivery")}</dt><dd>{quote.deliveryFeeMinor ? formatMoney(quote.deliveryFeeMinor, locale) : t("common.free")}</dd></div>
          <div className={styles.total}><dt>{t("common.total")}</dt><dd>{formatMoney(quote.totalMinor, locale)}</dd></div>
        </dl>
        {slotId ? (
          <p className={styles.when}><Icon name="truck" size={16} />{fmtDay(slots.find((s) => s.id === slotId)!.date, { weekday: "long", day: "numeric", month: "long" })} · {slotText(slots.find((s) => s.id === slotId)!, locale)}</p>
        ) : null}
        <button className="btn btn-primary btn-lg btn-block" disabled={pending}>{pending ? t("checkout.placing") : t("checkout.placeOrder")}</button>
        <p className="muted-note">{t("checkout.serverNote")}</p>
        <p className="muted-note">{t("checkout.agree")}</p>
      </aside>
    </form>
  );
}
