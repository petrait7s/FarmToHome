"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useCart } from "./CartProvider";
import { useI18n } from "@/i18n/client";
import { formatNumber } from "@/lib/money";
import { BasketDrawer, type DrawerZone } from "./BasketDrawer";
import styles from "./BasketButton.module.css";

/**
 * Header basket. Opens a drawer to edit the basket without leaving the page (a plain link on the basket and checkout pages).
 * The count gives a short bump when items are added, and changes are announced politely.
 */
export function BasketButton({ label, className, zone = null }: { label: string; className?: string; zone?: DrawerZone }) {
  const { cart } = useCart();
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const prev = useRef(cart.productCount);
  const [bump, setBump] = useState(0);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (cart.productCount > prev.current) setBump((b) => b + 1);
    prev.current = cart.productCount;
  }, [cart.productCount]);
  useEffect(() => setOpen(false), [pathname]);

  const inner = (
    <>
      <Icon name="basket" />
      <span className={styles.text}>{label}</span>
      <span key={bump} className={`${styles.count} ${cart.productCount ? styles.has : ""} ${bump ? styles.bump : ""}`}>{formatNumber(cart.productCount, locale)}</span>
      <span className="sr-only" aria-live="polite">{bump ? t("common.products", { n: formatNumber(cart.productCount, locale) }) : ""}</span>
    </>
  );
  const aria = `${label}: ${cart.productCount}`;
  if (pathname.startsWith("/basket") || pathname.startsWith("/checkout")) {
    return <Link href="/basket" className={`${styles.btn} ${className ?? ""}`} aria-label={aria}>{inner}</Link>;
  }
  return (
    <>
      <button type="button" className={`${styles.btn} ${className ?? ""}`} aria-label={aria} aria-haspopup="dialog" onClick={() => setOpen(true)}>{inner}</button>
      <BasketDrawer open={open} onClose={() => setOpen(false)} zone={zone} />
    </>
  );
}
