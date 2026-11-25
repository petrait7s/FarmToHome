"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { useI18n } from "@/i18n/client";
import { formatMoney } from "@/lib/money";
import type { Suggestions } from "@/server/search";
import styles from "./SearchButton.module.css";

type Option = { id: string; href: string; group: "products" | "categories" | "districts" | "producers" | "all"; label: string; meta?: string; artKey?: string | null; imageUrl?: string | null };

const EMPTY: Suggestions = { products: [], categories: [], districts: [], producers: [] };
const GROUP_ICON: Record<string, IconName> = { categories: "grid", districts: "pin", producers: "user", all: "search" };

/** Header search: a dialog with suggestions as you type (products, categories, districts, producers). */
export function SearchButton({ className }: { className?: string }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [data, setData] = useState<Suggestions>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // The dialog focuses its close button first; move focus to the search field once it has opened.
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(id);
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  // Debounced fetch; earlier requests are aborted so results never arrive out of order.
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setData(EMPTY); setLoading(false); return; }
    const ctrl = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        const json = await res.json();
        if (json?.ok) setData(json);
      } catch { /* aborted or offline */ } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 180);
    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [q]);

  const name = (r: { name: string; nameBn: string | null }) => (locale === "bn" && r.nameBn ? r.nameBn : r.name);
  const options = useMemo<Option[]>(() => {
    const term = q.trim();
    if (term.length < 2) return [];
    return [
      ...data.products.map((p) => ({ id: `p-${p.slug}`, href: `/products/${p.slug}`, group: "products" as const, label: name(p), meta: [p.district, p.priceMinor != null ? formatMoney(p.priceMinor, locale) : null].filter(Boolean).join(" · "), artKey: p.artKey, imageUrl: p.imageUrl })),
      ...data.categories.map((c) => ({ id: `c-${c.slug}`, href: `/explore?category=${c.slug}`, group: "categories" as const, label: name(c) })),
      ...data.districts.map((d) => ({ id: `d-${d.slug}`, href: `/explore?origin=${d.slug}`, group: "districts" as const, label: d.district })),
      ...data.producers.map((p) => ({ id: `r-${p.slug}`, href: `/producers/${p.slug}`, group: "producers" as const, label: name(p), meta: [p.village, p.district].filter(Boolean).join(", ") })),
      { id: "all", href: `/explore?q=${encodeURIComponent(term)}`, group: "all" as const, label: t("search.all", { q: term }) },
    ];
  }, [data, q, locale]);

  useEffect(() => setActive(-1), [options]);
  useEffect(() => {
    if (active < 0) return;
    listRef.current?.querySelector(`#so-${options[active]?.id}`)?.scrollIntoView({ block: "nearest" });
  }, [active, options]);

  const go = (href: string) => { setOpen(false); router.push(href); };
  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!options.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % options.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a <= 0 ? options.length - 1 : a - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); go((options[active] ?? options[options.length - 1]).href); }
  };

  const groups = (["products", "categories", "districts", "producers", "all"] as const).filter((g) => options.some((o) => o.group === g));
  const nothing = q.trim().length >= 2 && !loading && options.length === 1;

  return (
    <>
      <button type="button" className={className} aria-label={t("nav.search")} title={t("nav.search")} aria-haspopup="dialog" onClick={() => { setQ(""); setOpen(true); }}>
        <Icon name="search" />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={t("search.label")} hideTitle closeLabel={t("common.close")} wide>
        <div className={styles.box}>
          <div className={styles.field}>
            <Icon name="search" />
            <input
              ref={inputRef} type="search" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
              placeholder={t("search.placeholder")} aria-label={t("search.label")} className={styles.input}
              role="combobox" aria-expanded={options.length > 0} aria-controls="search-options" aria-autocomplete="list"
              aria-activedescendant={options[active] ? `so-${options[active].id}` : undefined}
            />
          </div>
          <p className="sr-only" aria-live="polite">{nothing ? t("search.none") : ""}</p>
          {q.trim().length < 2 ? <p className={styles.hint}>{t("search.hint")}</p> : null}
          {nothing ? <p className={styles.hint}>{t("search.none")}</p> : null}
          <ul id="search-options" role="listbox" aria-label={t("search.label")} className={styles.list} ref={listRef}>
            {groups.map((g) => (
              <li key={g} role="presentation">
                {g !== "all" ? <p className={styles.group} aria-hidden="true">{t(`search.${g}`)}</p> : null}
                <ul role="group" aria-label={g !== "all" ? t(`search.${g}`) : undefined} className={styles.groupList}>
                  {options.map((o, i) => o.group !== g ? null : (
                    <li key={o.id} id={`so-${o.id}`} role="option" aria-selected={active === i} className={`${styles.opt} ${active === i ? styles.active : ""} ${g === "all" ? styles.all : ""}`}
                      onMouseDown={(e) => e.preventDefault()} onClick={() => go(o.href)} onMouseEnter={() => setActive(i)}>
                      {g === "products" ? <span className={styles.thumb}><ProductVisual artKey={o.artKey ?? null} imageUrl={o.imageUrl ?? null} alt="" size="sm" /></span> : <span className={styles.icon}><Icon name={GROUP_ICON[g]} size={16} /></span>}
                      <span className={styles.text}><b>{o.label}</b>{o.meta ? <small>{o.meta}</small> : null}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </Modal>
    </>
  );
}
