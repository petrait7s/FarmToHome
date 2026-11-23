"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { AddressForm } from "./AccountForms";
import { useI18n } from "@/i18n/client";

type Zone = { division: string; district: string; areas: string[] };
type Address = { id: string; label: string; recipient: string; phone: string; division: string; district: string; area: string; line1: string; landmark: string | null; instructions: string | null };

export function AddressEditor({ zones, initial, label, primary }: { zones: Zone[]; initial?: Address; label: string; primary?: boolean }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { t } = useI18n();
  return (
    <>
      <button type="button" className={`btn ${primary ? "btn-primary" : "btn-sm"}`} onClick={() => setOpen(true)}>{label}</button>
      <Modal open={open} onClose={() => setOpen(false)} title={label} closeLabel={t("common.close")}>
        <AddressForm zones={zones} initial={initial} onDone={() => { setOpen(false); router.refresh(); }} />
      </Modal>
    </>
  );
}
