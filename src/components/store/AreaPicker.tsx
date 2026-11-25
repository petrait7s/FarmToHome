"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { useI18n } from "@/i18n/client";
import { setDeliveryArea } from "@/app/actions/area";
import styles from "./DeliveryStrip.module.css";

type Option = { zoneId: string; zone: string; areas: string[] };

export function AreaPicker({ options, value, label }: { options: Option[]; value: string; label: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState(value);
  const [pending, start] = useTransition();
  const save = (next: string) =>
    start(async () => {
      const fd = new FormData();
      fd.set("area", next);
      await setDeliveryArea(fd);
      setOpen(false);
    });
  return (
    <>
      <button type="button" className={styles.change} onClick={() => { setChoice(value); setOpen(true); }} aria-haspopup="dialog">
        {label}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={t("area.title")} closeLabel={t("common.close")}>
        <form className={styles.form} onSubmit={(e) => { e.preventDefault(); if (choice) save(choice); }}>
          <p className={styles.formBody}>{t("area.body")}</p>
          <label className="label" htmlFor="area-select">{t("area.select")}</label>
          <select id="area-select" className="input" value={choice} onChange={(e) => setChoice(e.target.value)} required>
            <option value="" disabled>{t("area.placeholder")}</option>
            {options.map((o) => (
              <optgroup key={o.zoneId} label={o.zone}>
                {o.areas.map((a) => <option key={a} value={`${o.zoneId}|${a}`}>{a}</option>)}
              </optgroup>
            ))}
          </select>
          <div className={styles.formActions}>
            <button className="btn btn-primary" disabled={!choice || pending}>{t("area.save")}</button>
            {value ? <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => save("")}>{t("area.clear")}</button> : null}
          </div>
          <p className="muted-note"><Link href="/concierge" className="link" onClick={() => setOpen(false)}>{t("area.notListed")}</Link></p>
        </form>
      </Modal>
    </>
  );
}
