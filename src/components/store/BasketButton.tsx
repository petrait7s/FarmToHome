"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useCart } from "./CartProvider";
import { useI18n } from "@/i18n/client";
import { formatNumber } from "@/lib/money";
import styles from "./BasketButton.module.css";

/** Header basket link. The count gives a short bump when items are added, and changes are announced politely. */
export function BasketButton({ label, className }: { label: string; className?: string }) {
  const { cart } = useCart();
  const { t, locale } = useI18n();
  const prev = useRef(cart.productCount);
  const [bump, setBump] = useState(0);
  useEffect(() => {
    if (cart.productCount > prev.current) setBump((b) => b + 1);
    prev.current = cart.productCount;
  }, [cart.productCount]);
  return (
    <Link href="/basket" className={`${styles.btn} ${className ?? ""}`} aria-label={`${label}: ${cart.productCount}`}>
      <Icon name="basket" />
      <span className={styles.text}>{label}</span>
      <span key={bump} className={`${styles.count} ${cart.productCount ? styles.has : ""} ${bump ? styles.bump : ""}`}>{formatNumber(cart.productCount, locale)}</span>
      <span className="sr-only" aria-live="polite">{bump ? t("common.products", { n: formatNumber(cart.productCount, locale) }) : ""}</span>
    </Link>
  );
}
