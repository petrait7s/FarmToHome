import { db } from "@/lib/db";
import { getCurrentUser } from "@/server/auth/session";
import { listCategories, productsForMarket } from "@/server/catalog";
import { defaultZoneRule, historySuggestions, latestBatchByProduct } from "@/server/markets";
import { MarketBuilder } from "@/components/market/MarketBuilder";
import type { Mode } from "@/components/market/types";

/** Shared server loader for the three market-building modes (common cart and product system). */
export async function MarketPage({ mode }: { mode: Mode }) {
  const fit = mode === "WEEKLY" ? (["WEEKLY", "BOTH"] as const) : mode === "MONTHLY" ? (["MONTHLY", "BOTH"] as const) : null;
  const [user, categories, products, zone] = await Promise.all([
    getCurrentUser(),
    listCategories(),
    productsForMarket(fit ? [...fit] : null),
    defaultZoneRule(),
  ]);
  const usedCategoryIds = new Set(products.map((p) => p.categoryId));
  const cats = categories.filter((c) => usedCategoryIds.has(c.id)).map((c) => ({
    id: c.id, slug: c.slug, name: c.name, nameBn: c.nameBn, story: c.story, storyBn: c.storyBn, description: c.description, descriptionBn: c.descriptionBn,
  }));
  const [traces, profile, saved, history] = await Promise.all([
    latestBatchByProduct(products.map((p) => p.id)),
    user ? db.customerProfile.findUnique({ where: { userId: user.id }, select: { householdSize: true } }) : null,
    user ? db.savedMarket.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, select: { id: true, name: true, mode: true, _count: { select: { items: true } } } }) : [],
    user && mode !== "CUSTOM" ? historySuggestions(user.id, mode) : [],
  ]);
  return (
    <MarketBuilder
      mode={mode}
      products={products}
      categories={cats}
      traces={traces}
      householdSize={profile?.householdSize ?? null}
      signedIn={!!user}
      savedMarkets={saved.map((s) => ({ id: s.id, name: s.name, mode: s.mode, itemCount: s._count.items }))}
      history={history}
      zone={zone}
    />
  );
}
