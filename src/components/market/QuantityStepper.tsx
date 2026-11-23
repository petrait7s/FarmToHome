"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/i18n/client";
import { formatNumber } from "@/lib/money";
import styles from "./QuantityStepper.module.css";

type Props = {
  name: string;
  quantity: number;
  onChange: (next: number) => void;
  max?: number | null;
  size?: "sm" | "md";
  tone?: "red" | "line";
};

/** Accessible − / + control. At quantity 1 the minus button becomes "remove". */
export function QuantityStepper({ name, quantity, onChange, max, size = "md", tone = "red" }: Props) {
  const { t, locale } = useI18n();
  const prev = useRef(quantity);
  const [dir, setDir] = useState<"up" | "down" | null>(null);
  useEffect(() => {
    if (quantity !== prev.current) setDir(quantity > prev.current ? "up" : "down");
    prev.current = quantity;
  }, [quantity]);
  const atMax = max !== null && max !== undefined && quantity >= max;
  return (
    <div className={`${styles.stepper} ${styles[size]} ${styles[tone]}`} role="group" aria-label={`${name}: ${t("common.quantity")}`}>
      <button type="button" onClick={() => onChange(quantity - 1)} aria-label={quantity <= 1 ? t("common.removeItem", { name }) : t("common.decrease", { name })}>
        <Icon name={quantity <= 1 ? "trash" : "minus"} size={size === "sm" ? 13 : 15} strokeWidth={2.2} />
      </button>
      <span className={styles.q} aria-live="polite">
        <span key={quantity} className={dir ? styles[dir] : undefined}>{formatNumber(quantity, locale)}</span>
      </span>
      <button type="button" onClick={() => onChange(quantity + 1)} disabled={atMax} aria-label={t("common.increase", { name })}>
        <Icon name="plus" size={size === "sm" ? 13 : 15} strokeWidth={2.2} />
      </button>
    </div>
  );
}
