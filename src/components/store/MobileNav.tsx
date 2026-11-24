"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";
import { useCart } from "./CartProvider";
import { useI18n } from "@/i18n/client";
import { formatNumber } from "@/lib/money";
import styles from "./MobileNav.module.css";

type Tab = { href: string; label: string; icon: IconName; match: (p: string) => boolean };
const MOBILE = "(max-width: 900px)";

/** True when the touch started on something that scrolls sideways or takes text input. */
function blocksSwipe(start: EventTarget | null) {
  for (let n = start as HTMLElement | null; n && n !== document.body; n = n.parentElement) {
    if (n.dataset?.noswipe !== undefined) return true;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(n.tagName)) return true;
    const ox = getComputedStyle(n).overflowX;
    if ((ox === "auto" || ox === "scroll") && n.scrollWidth > n.clientWidth + 2) return true;
  }
  return false;
}

export function MobileNav({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale } = useI18n();
  const { cart } = useCart();
  const items: Tab[] = [
    { href: "/", label: t("nav.home"), icon: "home", match: (p) => p === "/" },
    { href: "/explore", label: t("nav.explore"), icon: "compass", match: (p) => p.startsWith("/explore") || p.startsWith("/products") || p.startsWith("/trace") || p.startsWith("/producers") },
    { href: "/basket", label: t("nav.basket"), icon: "basket", match: (p) => p.startsWith("/basket") || p.startsWith("/checkout") },
    { href: "/market/weekly", label: t("nav.market"), icon: "market", match: (p) => p.startsWith("/market") },
    { href: signedIn ? "/account" : "/account/login", label: t("nav.account"), icon: "user", match: (p) => p.startsWith("/account") },
  ];
  const tabIndex = items.findIndex((it) => it.match(pathname));
  const tabsRef = useRef(items);
  tabsRef.current = items;
  const prevIndex = useRef(tabIndex);
  const idxRef = useRef(tabIndex);
  idxRef.current = tabIndex;

  // Slide the page in from the side we navigated towards (tab tap or swipe).
  useEffect(() => {
    const prev = prevIndex.current;
    prevIndex.current = tabIndex;
    if (!window.matchMedia(MOBILE).matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (prev < 0 || tabIndex < 0 || prev === tabIndex) return;
    const main = document.getElementById("main");
    if (!main) return;
    main.classList.remove("enter-next", "enter-prev");
    void main.offsetWidth;
    main.classList.add(tabIndex > prev ? "enter-next" : "enter-prev");
    const done = () => main.classList.remove("enter-next", "enter-prev");
    main.addEventListener("animationend", done, { once: true });
  }, [tabIndex]);

  // Swipe left/right on a tab page to move to the neighbouring tab.
  useEffect(() => {
    if (!window.matchMedia(MOBILE).matches) return;
    let sx = 0, sy = 0, st = 0, armed = false;
    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return void (armed = false);
      const p = e.touches[0];
      sx = p.clientX; sy = p.clientY; st = Date.now();
      // Leave the screen edges to the browser's own back/forward gestures.
      armed = sx > 28 && sx < window.innerWidth - 28 && idxRef.current >= 0 && !document.querySelector('[role="dialog"]') && !blocksSwipe(e.target);
    };
    const onEnd = (e: TouchEvent) => {
      if (!armed) return;
      armed = false;
      const p = e.changedTouches[0];
      const dx = p.clientX - sx, dy = p.clientY - sy;
      if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 2 || Date.now() - st > 650) return;
      const next = idxRef.current + (dx < 0 ? 1 : -1);
      const tab = tabsRef.current[next];
      if (tab) router.push(tab.href);
    };
    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchend", onEnd);
    };
  }, [router]);

  // App-style chrome: hide the top bar while scrolling down, bring it back on the way up.
  useEffect(() => {
    const root = document.documentElement;
    let last = window.scrollY, frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (!window.matchMedia(MOBILE).matches || y < 90) root.dataset.chrome = "shown";
        else if (y > last + 8) root.dataset.chrome = "hidden";
        else if (y < last - 8) root.dataset.chrome = "shown";
        root.dataset.scrolled = y > 4 ? "true" : "false";
        last = y;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      root.dataset.chrome = "shown";
    };
  }, []);

  return (
    <nav className={styles.nav} aria-label={t("nav.mobile")}>
      {items.map((it) => {
        const active = it.match(pathname);
        return (
          <Link key={it.href} href={it.href} className={`${styles.item} ${it.icon === "basket" ? styles.basket : ""} ${active ? styles.active : ""}`} aria-current={active ? "page" : undefined}>
            <span className={styles.icon}>
              <Icon name={it.icon} size={22} />
              {it.icon === "basket" && cart.productCount > 0 ? <span className={styles.badge}>{formatNumber(cart.productCount, locale)}</span> : null}
            </span>
            <span className={styles.label}>{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
