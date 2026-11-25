import Link from "next/link";
import { getT } from "@/i18n";
import { db } from "@/lib/db";
import { listSavedMarkets } from "@/server/markets";
import { productsByIds } from "@/server/catalog";
import { formatMoney, formatNumber } from "@/lib/money";
import { RepeatButtons } from "@/components/account/RepeatButtons";
import { ProductVisual } from "@/components/ui/ProductVisual";
import { Icon } from "@/components/ui/Icon";
import { BuyAgain } from "./BuyAgain";
import styles from "./ReorderRow.module.css";

/** Returning customers: their usual saved market and items from recent orders, first thing on the homepage. */
export async function ReorderRow({ user }: { user: { id: string; name: string } }) {
  const { t, locale } = await getT();
  const [markets, recent] = await Promise.all([
    listSavedMarkets(user.id),
    db.order.findMany({
      where: { userId: user.id, status: { not: "CANCELLED" } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { items: { select: { variantId: true, variant: { select: { productId: true } } } } },
    }),
  ]);
  const usual = markets[0] ?? null;
  // Most recent first, one entry per product, remembering the size that was bought.
  const picks = new Map<string, string>();
  for (const o of recent) for (const i of o.items) if (!picks.has(i.variant.productId)) picks.set(i.variant.productId, i.variantId);
  const products = (await productsByIds([...picks.keys()].slice(0, 12))).slice(0, 6);
  if (!usual && !products.length) return null;
  const total = usual ? usual.items.reduce((s, i) => s + i.variant.priceMinor * i.quantity, 0) : 0;
  const first = user.name.trim().split(/\s+/)[0] || user.name;

  return (
    <section className={styles.wrap} aria-labelledby="reorder-title">
      <div className="container">
        <h2 id="reorder-title" className="h2">{t("home.reorder.title", { name: first })}</h2>
        <div className={`${styles.grid} ${usual && products.length ? "" : styles.single}`}>
          {usual ? (
            <article className={styles.usual}>
              <p className="eyebrow"><Icon name="repeat" size={15} />{t("home.reorder.usual")}</p>
              <div className={styles.usualHead}>
                <div className={styles.stack} aria-hidden="true">
                  {usual.items.slice(0, 3).map((i) => <ProductVisual key={i.id} artKey={i.variant.product.artKey} alt="" size="sm" />)}
                </div>
                <div>
                  <h3 className="h3">{usual.name}</h3>
                  <p className="muted-note">{t(`saved.mode.${usual.mode}`)} · {t("home.reorder.usualMeta", { n: formatNumber(usual.items.length, locale), total: formatMoney(total, locale) })}</p>
                </div>
              </div>
              <RepeatButtons id={usual.id} name={usual.name} />
              <Link href="/account/markets" className={`link ${styles.more}`}>{t("home.reorder.allMarkets")}</Link>
            </article>
          ) : null}
          {products.length ? (
            <div className={styles.again}>
              <div className={styles.againHead}>
                <div>
                  <p className="eyebrow"><Icon name="basket" size={15} />{t("home.reorder.buyAgain")}</p>
                  <p className="muted-note">{t("home.reorder.buyAgainLead")}</p>
                </div>
                <Link href="/account/orders" className="link">{t("home.reorder.orders")}</Link>
              </div>
              <BuyAgain items={products.map((p) => ({ product: p, variantId: picks.get(p.id)! }))} />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
