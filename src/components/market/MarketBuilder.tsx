"use client";

import Link from "next/link";
import Image from "next/image";
import { photos } from "@/lib/media";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { MarketCategory, Mode, ProductDTO, SavedMarketSummary, TraceInfo, ZoneRule } from "./types";
import { suggestPick } from "./types";
import { MarketRow } from "./MarketRow";
import { MarketSummary } from "./MarketSummary";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { useCart } from "@/components/store/CartProvider";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/i18n/client";
import { localized } from "@/i18n/shared";
import { formatMoney, formatNumber, toBanglaDigits } from "@/lib/money";
import { repeatMarket, saveCartAsMarket, saveHouseholdSize } from "@/app/actions/markets";
import styles from "./MarketBuilder.module.css";

export type Bundle = { slug: string; title: string; titleBn: string | null; description: string | null; descriptionBn: string | null; productIds: string[] };

type Props = {
  bundles?: Bundle[];
  mode: Mode;
  products: ProductDTO[];
  categories: MarketCategory[];
  traces: Record<string, TraceInfo>;
  householdSize: number | null;
  /** From the homepage guide; overrides the remembered size and is saved as the new choice. */
  initialPeople?: number | null;
  signedIn: boolean;
  savedMarkets: SavedMarketSummary[];
  history: { variantId: string; quantity: number }[];
  zone: ZoneRule;
};

const HOUSEHOLDS = [2, 4, 6, 8];

function readLocal<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeLocal(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}

export function MarketBuilder({ mode, products, categories, traces, householdSize, initialPeople = null, signedIn, savedMarkets, history, zone, bundles = [] }: Props) {
  const { t, locale } = useI18n();
  const cart = useCart();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const defaultOpen = useMemo(() => (mode === "CUSTOM" ? categories.slice(0, 1) : categories.slice(0, 2)).map((c) => c.id), [mode, categories]);
  const [open, setOpen] = useState<string[]>(defaultOpen);
  const [household, setHousehold] = useState<number>(initialPeople ?? householdSize ?? 4);
  const [bundleBusy, setBundleBusy] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [sel, setSel] = useState<Record<string, string>>({});
  const [originFor, setOriginFor] = useState<ProductDTO | null>(null);
  const [sheet, setSheet] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [repeatFor, setRepeatFor] = useState<SavedMarketSummary | null>(null);
  const [repeatMenu, setRepeatMenu] = useState(false);
  const [busy, startTransition] = useTransition();
  const modeSynced = useRef(false);

  // Lift toasts above the mobile basket bar while the builder is mounted.
  useEffect(() => {
    document.documentElement.style.setProperty("--basket-bar-h", "76px");
    return () => { document.documentElement.style.removeProperty("--basket-bar-h"); };
  }, []);

  // Restore per-viewer conveniences.
  useEffect(() => {
    setOpen(readLocal(`fth:open:${mode}`, defaultOpen));
    if (initialPeople) {
      writeLocal("fth:household", initialPeople);
      if (signedIn && initialPeople !== householdSize) void saveHouseholdSize(initialPeople);
    } else if (!householdSize) setHousehold(readLocal("fth:household", 4));
  }, [mode, defaultOpen, householdSize, initialPeople, signedIn]);

  const persistOpen = (next: string[]) => { setOpen(next); writeLocal(`fth:open:${mode}`, next); };

  const chooseHousehold = (n: number) => {
    setHousehold(n);
    writeLocal("fth:household", n);
    if (signedIn) startTransition(() => { void saveHouseholdSize(n); });
  };

  const syncMode = useCallback(() => {
    if (!modeSynced.current && cart.cart.mode !== mode) {
      modeSynced.current = true;
      void cart.setMode(mode);
    }
  }, [cart, mode]);

  const term = q.trim().toLowerCase();
  const matches = (p: ProductDTO) =>
    !term || [p.name, p.nameBn ?? "", p.summary, p.originDistrict ?? "", p.producerName ?? ""].join(" ").toLowerCase().includes(term);

  const visibleCats = categories.filter((c) => cat === "all" || cat === c.id);
  const byCat = (id: string) => products.filter((p) => p.categoryId === id && matches(p));
  const inCartVariant = (p: ProductDTO) => p.variants.find((v) => cart.qtyOf(v.id) > 0)?.id ?? null;
  const defaultVariant = (p: ProductDTO) => (mode === "MONTHLY" ? p.variants[p.variants.length - 1] : p.variants[0]).id;
  const catCount = (id: string) => cart.cart.lines.filter((l) => l.categoryId === id);

  // ── Add with a small "fly to basket" cue ──
  const fly = (from: HTMLElement) => {
    const target = document.getElementById(window.matchMedia("(max-width: 1060px)").matches ? "mb-bar-count" : "mb-sum-count");
    if (!target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const a = from.getBoundingClientRect(), b = target.getBoundingClientRect();
    if (b.bottom < 0 || b.top > innerHeight) return;
    const dot = document.createElement("span");
    dot.className = styles.fly;
    dot.style.left = `${a.left + a.width / 2}px`;
    dot.style.top = `${a.top + a.height / 2}px`;
    document.body.appendChild(dot);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    const anim = dot.animate(
      [{ transform: "translate(0,0) scale(.6)" }, { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 90}px) scale(1.1)`, offset: 0.45 }, { transform: `translate(${dx}px, ${dy}px) scale(.35)`, opacity: 0.6 }],
      { duration: 700, easing: "cubic-bezier(.22,1,.36,1)" },
    );
    anim.onfinish = () => dot.remove();
  };

  const add = async (variantId: string, el: HTMLElement | null, quantity = 1) => {
    syncMode();
    if (el) fly(el);
    const ok = await cart.setQuantity(variantId, quantity);
    const p = products.find((x) => x.variants.some((v) => v.id === variantId));
    if (ok && p) toast.show(t("market.addedToast", { name: localized(p, "name", locale) }));
  };

  const setQty = async (variantId: string, quantity: number) => {
    const p = products.find((x) => x.variants.some((v) => v.id === variantId));
    const before = cart.qtyOf(variantId);
    const ok = await cart.setQuantity(variantId, quantity);
    if (ok && quantity <= 0 && p) {
      toast.show(t("market.removed", { name: localized(p, "name", locale) }), { label: t("common.undo"), onClick: () => void cart.setQuantity(variantId, before) });
    }
  };

  const select = (p: ProductDTO, variantId: string) => {
    const current = inCartVariant(p);
    if (current && current !== variantId) void cart.swap(current, variantId);
    setSel((s) => ({ ...s, [p.id]: variantId }));
  };

  const clear = async () => {
    const snapshot = cart.cart.lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity }));
    setSheet(false);
    if (await cart.clear()) toast.show(t("market.cleared"), { label: t("common.undo"), onClick: () => void cart.bulk("replace", snapshot) });
  };

  // ── Suggestions (never auto-added) ──
  const suggestions = useMemo(() => {
    if (mode === "CUSTOM" || term) return [];
    const inCats = new Set(cart.cart.lines.map((l) => l.categoryId));
    const inCart = new Set(cart.cart.lines.map((l) => l.productId));
    const out: { product: ProductDTO; variantId: string; quantity: number; reason: string }[] = [];
    for (const h of history) {
      const p = products.find((x) => x.variants.some((v) => v.id === h.variantId));
      if (!p || inCart.has(p.id) || dismissed.includes(p.id)) continue;
      out.push({ product: p, variantId: h.variantId, quantity: h.quantity, reason: mode === "MONTHLY" ? t("market.replenishTitle") : t("market.frequentTitle") });
      if (out.length >= 3) break;
    }
    for (const p of products) {
      if (out.length >= 3) break;
      if (!p.isEssential || inCats.has(p.categoryId) || inCart.has(p.id) || dismissed.includes(p.id) || out.some((o) => o.product.id === p.id)) continue;
      const pick = suggestPick(p, household, mode);
      if (pick.variant.available !== null && pick.variant.available < pick.quantity) continue;
      out.push({ product: p, variantId: pick.variant.id, quantity: pick.quantity, reason: localized(p, "summary", locale) });
    }
    return out;
  }, [mode, term, cart.cart.lines, history, products, dismissed, household, t, locale]);

  const doRepeat = (m: SavedMarketSummary, how: "replace" | "merge") => {
    setRepeatFor(null);
    setRepeatMenu(false);
    startTransition(async () => {
      const res = await repeatMarket({ id: m.id, mode: how });
      if (res.ok) {
        cart.replaceCart(res.cart);
        toast.show(res.skipped ? t("saved.unavailable", { n: res.skipped }) : t("saved.loaded", { name: m.name }));
      } else toast.show(t("errors.generic"));
    });
  };

  const modeText = t(`market.modes.${mode}.title`);
  const num = (n: number) => formatNumber(n, locale);

  return (
    <>
      {/* ── Hero ── */}
      <section className={`${styles.hero} on-red`}>
        <Image src={(mode === "MONTHLY" ? photos.spiceBowls : mode === "CUSTOM" ? photos.vegMarket : photos.vegBaskets).src} alt="" fill priority sizes="100vw" className={styles.heroImg} />
        <div className={`container ${styles.heroGrid}`}>
          <div>
            <p className={styles.pill}><span className="dot" aria-hidden="true" />{t(`market.modes.${mode}.sub`)}</p>
            <h1 className={styles.h1}>{t(`market.modes.${mode}.h1a`)} <em>{t(`market.modes.${mode}.h1b`)}</em></h1>
            <p className={styles.lead}>{t(`market.modes.${mode}.lead`)}</p>
          </div>
          {mode !== "CUSTOM" ? (
            <div className={styles.hh} role="group" aria-labelledby="hh-label">
              <div className={styles.hhLabel}>
                <span id="hh-label" className="eyebrow">{t("market.household")} · {t("market.householdOptional")}</span>
                <span className={styles.hhValue}>{t("market.people", { n: num(household) })}</span>
              </div>
              <div className={styles.hhOpts}>
                {HOUSEHOLDS.map((n) => (
                  <button key={n} type="button" className={styles.hhOpt} aria-pressed={household === n} onClick={() => chooseHousehold(n)}>{n === 8 ? `${num(8)}+` : num(n)}</button>
                ))}
              </div>
              <div className={styles.hhCustom}>
                <span>{t("market.householdCustom")}</span>
                <button type="button" aria-label={t("common.decrease", { name: t("market.household") })} disabled={household <= 1} onClick={() => chooseHousehold(Math.max(1, household - 1))}>−</button>
                <output aria-live="polite">{num(household)}</output>
                <button type="button" aria-label={t("common.increase", { name: t("market.household") })} disabled={household >= 15} onClick={() => chooseHousehold(Math.min(15, household + 1))}>+</button>
              </div>
              <p className={styles.hhNote}>{t("market.householdNote")}</p>
            </div>
          ) : null}
        </div>
      </section>

      <div className={`container ${styles.modebar}`}>
        <nav className={styles.modes} aria-label={t("market.modeLabel")}>
          {(["WEEKLY", "CUSTOM", "MONTHLY"] as Mode[]).map((m) => (
            <Link key={m} href={m === "WEEKLY" ? "/market/weekly" : m === "MONTHLY" ? "/market/monthly" : "/market/basket"} className={styles.mode} aria-current={m === mode ? "page" : undefined}>
              <span className={styles.modeT}>{t(`market.modes.${m}.title`)}</span>
              <span className={styles.modeS}>{t(`market.modes.${m}.sub`)}</span>
            </Link>
          ))}
        </nav>
      </div>

      <ol className={`container ${styles.progress}`} aria-label={t("market.progressLabel")}>
        {(["choose", "review", "slot", "confirm"] as const).map((k, i) => (
          <li key={k} aria-current={i === 0 ? "step" : undefined}><span>{i + 1}</span>{t(`market.progress.${k}`)}</li>
        ))}
      </ol>

      <div className={`container ${styles.layout} ${mode === "MONTHLY" ? styles.monthly : ""}`}>
        <section className={styles.main} aria-label={modeText}>
          <div className={styles.toolbar}>
            <div className={styles.tbRow}>
              <label className={styles.search}>
                <span className="sr-only">{t("nav.search")}</span>
                <Icon name="search" />
                <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("market.searchPlaceholder")} autoComplete="off" />
                {q ? <button type="button" className={styles.clearQ} onClick={() => setQ("")} aria-label={t("common.clear")}><Icon name="x" size={14} /></button> : null}
              </label>
              {signedIn && savedMarkets.length ? (
                <div className={styles.repeatWrap}>
                  <button type="button" className="btn btn-sm" aria-expanded={repeatMenu} onClick={() => setRepeatMenu((v) => !v)}><Icon name="repeat" size={15} />{t("market.repeatPrev")}</button>
                  {repeatMenu ? (
                    <ul className={styles.repeatMenu}>
                      {savedMarkets.map((m) => (
                        <li key={m.id}>
                          <button type="button" disabled={busy} onClick={() => (cart.cart.lines.length ? setRepeatFor(m) : doRepeat(m, "replace"))}>
                            <b>{m.name}</b><span>{t(`saved.mode.${m.mode}`)} · {t("saved.items", { n: m.itemCount })}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
              <button type="button" className={`${styles.tbLink} ${styles.hideSm}`} onClick={() => persistOpen(categories.map((c) => c.id))}>{t("market.expandAll")}</button>
              <button type="button" className={`${styles.tbLink} ${styles.hideSm}`} onClick={() => persistOpen([])}>{t("market.collapseAll")}</button>
            </div>
            <div className={styles.chips} role="group" aria-label={t("explore.category")}>
              <button type="button" className="chip" aria-pressed={cat === "all"} onClick={() => setCat("all")}>{t("market.allCategories")}</button>
              {categories.map((c) => {
                const n = catCount(c.id).length;
                return (
                  <button key={c.id} type="button" className="chip" aria-pressed={cat === c.id} onClick={() => { setCat(c.id); if (!open.includes(c.id)) persistOpen([...open, c.id]); }}>
                    {localized(c, "name", locale)}
                    {n ? <span className={styles.chipN}>{num(n)}</span> : null}
                  </button>
                );
              })}
            </div>
          </div>

          {mode === "MONTHLY" ? <p className={styles.note}><Icon name="info" size={16} />{t("market.monthlyFocus")}</p> : null}

          {mode === "MONTHLY" && bundles.length ? (
            <section className={styles.bundles} aria-labelledby="bundle-title">
              <div className={styles.suggHead}>
                <h2 id="bundle-title">{t("market.bundlesTitle")}</h2>
                <p>{t("market.bundlesNote", { n: num(household) })}</p>
              </div>
              {bundles.map((b) => {
                const items = b.productIds.map((id) => products.find((p) => p.id === id)).filter((p): p is (typeof products)[number] => !!p);
                const picks = items.map((p) => ({ p, ...suggestPick(p, household, mode) }));
                const total = picks.reduce((sum, x) => sum + x.variant.priceMinor * x.quantity, 0);
                const allIn = picks.every((x) => cart.qtyOf(x.variant.id) >= x.quantity);
                return (
                  <div key={b.slug} className={styles.bundle}>
                    <div className={styles.bundleText}>
                      <h3>{localized(b, "title", locale)}</h3>
                      <p>{localized(b, "description", locale)}</p>
                      <ul>
                        {picks.map((x) => (
                          <li key={x.p.id}>
                            <ProductVisual artKey={x.p.artKey} imageUrl={x.p.imageUrl} alt="" size="sm" />
                            <span><b>{localized(x.p, "name", locale)}</b>{x.quantity > 1 ? `${num(x.quantity)} × ` : ""}{locale === "bn" && x.variant.labelBn ? x.variant.labelBn : x.variant.label}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className={styles.bundleAct}>
                      <span className={styles.bundleTotal}>{formatMoney(total, locale)}</span>
                      <button type="button" className="btn btn-primary" disabled={allIn || bundleBusy} onClick={async () => {
                        setBundleBusy(true);
                        for (const x of picks) if (cart.qtyOf(x.variant.id) < x.quantity) await cart.setQuantity(x.variant.id, x.quantity);
                        setBundleBusy(false);
                        toast.show(t("market.bundleAdded", { name: localized(b, "title", locale) }));
                      }}>
                        {allIn ? <><Icon name="check" /> {t("market.bundleInMarket")}</> : <><Icon name="plus" /> {t("market.bundleAdd")}</>}
                      </button>
                    </div>
                  </div>
                );
              })}
            </section>
          ) : null}

          {suggestions.length ? (
            <section className={styles.sugg} aria-labelledby="sugg-title">
              <div className={styles.suggHead}>
                <h2 id="sugg-title">{t("market.suggestionsTitle", { mode: modeText, n: household })}</h2>
                <p>{t("market.suggestionsNote")}</p>
              </div>
              <div className={styles.suggList}>
                {suggestions.map((s) => {
                  const v = s.product.variants.find((x) => x.id === s.variantId)!;
                  return (
                    <div key={s.product.id} className={styles.sg}>
                      <ProductVisual artKey={s.product.artKey} imageUrl={s.product.imageUrl} alt="" size="sm" />
                      <div>
                        <h3>{localized(s.product, "name", locale)}</h3>
                        <p>{s.reason}</p>
                      </div>
                      <div className={styles.sgAct}>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDismissed((d) => [...d, s.product.id])}>{t("market.notNow")}</button>
                        <button type="button" className="btn btn-primary btn-sm" onClick={(e) => void add(v.id, e.currentTarget, s.quantity)}>
                          {t("market.addSuggested", { size: `${s.quantity > 1 ? `${num(s.quantity)} × ` : ""}${locale === "bn" ? toBanglaDigits(v.label) : v.label}` })}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          <div className={styles.cats}>
            {visibleCats.map((c) => {
              const list = byCat(c.id);
              if (!list.length) return null;
              const isOpen = term ? true : open.includes(c.id);
              const inCat = catCount(c.id);
              const catTotal = inCat.reduce((s, l) => s + l.lineTotalMinor, 0);
              return (
                <section key={c.id} className={`${styles.cat} ${isOpen ? styles.catOpen : ""}`}>
                  <button type="button" className={styles.catHead} aria-expanded={isOpen} aria-controls={`cb-${c.id}`}
                    onClick={() => persistOpen(isOpen ? open.filter((x) => x !== c.id) : [...open, c.id])}>
                    <span className={styles.catNum} aria-hidden="true">{num(categories.indexOf(c) + 1).padStart(2, locale === "bn" ? "০" : "0")}</span>
                    <span>
                      <span className={styles.catName}>{localized(c, "name", locale)}</span>
                      <span className={styles.catStory}>{localized(c, "description", locale)}</span>
                    </span>
                    <span className={styles.catMeta}>
                      <span>{t("market.productsInCategory", { n: list.length })}</span>
                      {inCat.length ? <span className={styles.catIn}><span className="dot" aria-hidden="true" />{t("market.inMarket", { n: inCat.length, amount: formatMoney(catTotal, locale) })}</span> : null}
                    </span>
                    <span className={styles.chev} aria-hidden="true"><Icon name="chevronDown" size={14} /></span>
                  </button>
                  <div className={styles.catBody} id={`cb-${c.id}`} inert={!isOpen}>
                    <div className={styles.catInner}>
                      {list.map((p) => {
                        const cv = inCartVariant(p);
                        return (
                          <MarketRow
                            key={p.id}
                            product={p}
                            mode={mode}
                            household={household}
                            selectedVariantId={sel[p.id] ?? defaultVariant(p)}
                            inCartVariantId={cv}
                            quantity={cv ? cart.qtyOf(cv) : 0}
                            onSelect={(vid) => select(p, vid)}
                            onAdd={(vid, el) => void add(vid, el)}
                            onQuantity={(vid, n) => void setQty(vid, n)}
                            onOrigin={() => setOriginFor(p)}
                          />
                        );
                      })}
                    </div>
                  </div>
                </section>
              );
            })}
            {visibleCats.every((c) => byCat(c.id).length === 0) ? (
              <div className={styles.emptySearch}>
                <h3 className="h3">{t("market.noMatch", { q })}</h3>
                <p>{t("market.noMatchHint")}</p>
                <button type="button" className="btn btn-sm" style={{ marginTop: 14 }} onClick={() => { setQ(""); setCat("all"); }}>{t("common.clear")}</button>
              </div>
            ) : null}
          </div>
        </section>

        <aside className={styles.summary} aria-label={t(`market.summary.${mode}`)}>
          <MarketSummary mode={mode} categories={categories} zone={zone} countId="mb-sum-count" onSave={() => setSaveOpen(true)} onClear={() => void clear()} />
        </aside>
      </div>

      {/* ── Mobile basket bar + sheet ── */}
      <div className={styles.mbar}>
        <button type="button" className={styles.mbarOpen} onClick={() => setSheet(true)} aria-haspopup="dialog">
          <span id="mb-bar-count" className={`${styles.mbarCount} ${cart.cart.productCount ? styles.has : ""}`}>{num(cart.cart.productCount)}</span>
          <span className={styles.mbarTxt}>
            <b>{formatMoney(cart.cart.subtotalMinor, locale)}</b>
            <span>{cart.cart.productCount ? `${t(cart.cart.productCount === 1 ? "common.product" : "common.products", { n: cart.cart.productCount })} · ${t("market.viewMarket")}` : t("market.emptyBar")}</span>
          </span>
        </button>
        {cart.cart.productCount ? <Link href="/basket" className={styles.mbarReview}>{t("market.review")}</Link> : <span className={`${styles.mbarReview} ${styles.disabled}`} aria-disabled="true">{t("market.review")}</span>}
      </div>
      <Modal open={sheet} onClose={() => setSheet(false)} title={t(`market.summary.${mode}`)} hideTitle variant="sheet" closeLabel={t("common.close")}>
        <MarketSummary mode={mode} categories={categories} zone={zone} countId="mb-sheet-count" onSave={() => { setSheet(false); setSaveOpen(true); }} onClear={() => void clear()} />
      </Modal>

      {/* ── Know your origin ── */}
      <Modal open={!!originFor} onClose={() => setOriginFor(null)} title={originFor ? localized(originFor, "name", locale) : ""} closeLabel={t("common.close")}>
        {originFor ? <OriginContent product={originFor} trace={traces[originFor.id]} /> : null}
      </Modal>

      {/* ── Save market ── */}
      <Modal open={saveOpen} onClose={() => setSaveOpen(false)} title={t("market.nameMarket")} closeLabel={t("common.close")}>
        {signedIn ? (
          <SaveForm mode={mode} onDone={(name) => { setSaveOpen(false); toast.show(t("market.savedAs", { name })); }} />
        ) : (
          <div className="stack">
            <p>{t("market.signInToSave")}</p>
            <Link className="btn btn-primary" href={`/account/login?next=${encodeURIComponent(mode === "WEEKLY" ? "/market/weekly" : mode === "MONTHLY" ? "/market/monthly" : "/market/basket")}`}>{t("common.signIn")}</Link>
          </div>
        )}
      </Modal>

      {/* ── Repeat confirm ── */}
      <Modal open={!!repeatFor} onClose={() => setRepeatFor(null)} title={repeatFor?.name ?? ""} closeLabel={t("common.close")}>
        {repeatFor ? (
          <div className={styles.dialogActions}>
            <button type="button" className="btn" onClick={() => doRepeat(repeatFor, "merge")}>{t("saved.addToBasket")}</button>
            <button type="button" className="btn btn-primary" onClick={() => doRepeat(repeatFor, "replace")}>{t("saved.repeat")}</button>
          </div>
        ) : null}
      </Modal>
    </>
  );
}

function SaveForm({ mode, onDone }: { mode: Mode; onDone: (name: string) => void }) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const presets = ["Weekly Family Market", "Monthly Pantry Stock", "Ramadan Market", "Guest Weekend Market"];
  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await saveCartAsMarket({ name: name || presets[mode === "MONTHLY" ? 1 : 0], mode });
          if (res.ok) onDone(res.name);
          else setErr(res.error);
        });
      }}
    >
      <div className="field">
        <label className="label" htmlFor="sm-name">{t("market.marketName")}</label>
        <input id="sm-name" className="input" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder={presets[mode === "MONTHLY" ? 1 : 0]} autoFocus />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {presets.map((p) => <button key={p} type="button" className="chip" onClick={() => setName(p)}>{p}</button>)}
      </div>
      {err ? <p className="form-error" role="alert">{t(`errors.${err}`)}</p> : null}
      <button className="btn btn-primary btn-block" disabled={pending}>{pending ? t("common.saving") : t("market.saveMarket")}</button>
    </form>
  );
}

function OriginContent({ product, trace }: { product: ProductDTO; trace?: TraceInfo }) {
  const { t, locale } = useI18n();
  const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");
  return (
    <div className={styles.origin}>
      <div className={styles.originHead}>
        <ProductVisual artKey={product.artKey} imageUrl={product.imageUrl} alt="" size="md" />
        <div>
          <p className="eyebrow"><Icon name="pin" size={14} />{t("market.knowOrigin")}</p>
          <p className="muted-note">{localized(product, "summary", locale)}</p>
        </div>
      </div>
      <dl className={styles.originDl}>
        <dt>{t("product.origin")}</dt><dd>{product.originDistrict ?? "—"}</dd>
        <dt>{t("product.producer")}</dt><dd>{product.producerSlug ? <Link className="link" href={`/producers/${product.producerSlug}`}>{product.producerName}</Link> : "—"}</dd>
        <dt>{t("product.originClass")}</dt><dd>{product.originClass ?? "—"}</dd>
        <dt>{t("product.grade")}</dt><dd>{product.grade ?? "—"}</dd>
        {trace ? (
          <>
            <dt>{t("product.batch")}</dt><dd className="mono">{trace.batchNumber}</dd>
            <dt>{t("product.harvested")}</dt><dd>{fmt(trace.collectedAt)}</dd>
            {trace.packedAt ? (<><dt>{t("product.packed")}</dt><dd>{fmt(trace.packedAt)}</dd></>) : null}
          </>
        ) : null}
      </dl>
      {product.variants.some((v) => v.fulfillmentMode === "SOURCED_TO_ORDER") ? <p className="muted-note">{t("product.sourcedNote")}</p> : null}
      {trace?.isDemo || product.isDemo ? <p className="muted-note">{t("trace.demoNotice")}</p> : null}
      <div className={styles.dialogActions}>
        <Link href={`/products/${product.slug}`} className="btn">{t("product.details")}</Link>
        {trace ? <Link href={`/trace/${trace.batchNumber}`} className="btn btn-primary">{t("product.viewJourney")}</Link> : null}
      </div>
    </div>
  );
}
