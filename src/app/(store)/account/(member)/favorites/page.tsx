import { getT } from "@/i18n";
import { db } from "@/lib/db";
import { requireUserPage } from "@/server/auth/guards";
import { productsBySlugs } from "@/server/catalog";
import { ProductCard } from "@/components/store/ProductCard";

export const metadata = { title: "Favourites" };

export default async function FavoritesPage() {
  const user = await requireUserPage("/account/favorites");
  const { t } = await getT();
  const favs = await db.favorite.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { product: { select: { slug: true } } } });
  const products = await productsBySlugs(favs.map((f) => f.product.slug));
  return (
    <div>
      <h1 className="h1" style={{ marginBottom: 24 }}>{t("account.favorites")}</h1>
      {products.length === 0 ? <p>{t("account.noFavorites")}</p> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 28 }}>
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
