"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { useCart } from "./CartProvider";
import { useI18n } from "@/i18n/client";
import { formatNumber } from "@/lib/money";
import styles from "./BasketButton.module.css";

export function BasketButton({ label, className }: { label: string; className?: string }) {
  const { cart } = useCart();
  const { locale } = useI18n();
  return (
    <Link href="/basket" className={`${styles.btn} ${className ?? ""}`} aria-label={`${label}: ${cart.productCount}`}>
      <Icon name="basket" />
      <span className={styles.text}>{label}</span>
      <span className={`${styles.count} ${cart.productCount ? styles.has : ""}`}>{formatNumber(cart.productCount, locale)}</span>
    </Link>
  );
}
