import "server-only";
import { db } from "@/lib/db";

export type Suggestions = {
  products: { slug: string; name: string; nameBn: string | null; artKey: string | null; imageUrl: string | null; priceMinor: number | null; district: string | null }[];
  categories: { slug: string; name: string; nameBn: string | null }[];
  districts: { slug: string; district: string }[];
  producers: { slug: string; name: string; nameBn: string | null; village: string | null; district: string }[];
};

/** Typeahead suggestions across products, categories, districts and producers, in English or Bangla. */
export async function suggest(raw: string): Promise<Suggestions> {
  const q = raw.trim().slice(0, 60);
  if (q.length < 2) return { products: [], categories: [], districts: [], producers: [] };
  const c = { contains: q, mode: "insensitive" as const };
  const [products, categories, districts, producers] = await Promise.all([
    db.product.findMany({
      where: { status: "ACTIVE", category: { active: true }, OR: [{ name: c }, { nameBn: c }, { summary: c }, { summaryBn: c }] },
      orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
      take: 6,
      select: {
        slug: true, name: true, nameBn: true, artKey: true,
        origin: { select: { district: true } },
        images: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
        variants: { where: { active: true }, orderBy: { priceMinor: "asc" }, take: 1, select: { priceMinor: true } },
      },
    }),
    db.category.findMany({ where: { active: true, OR: [{ name: c }, { nameBn: c }] }, orderBy: { position: "asc" }, take: 4, select: { slug: true, name: true, nameBn: true } }),
    db.origin.findMany({ where: { products: { some: { status: "ACTIVE" } }, OR: [{ district: c }, { division: c }] }, orderBy: { district: "asc" }, take: 4, select: { slug: true, district: true } }),
    db.producer.findMany({
      where: { active: true, OR: [{ name: c }, { nameBn: c }, { village: c }, { craft: c }, { craftBn: c }] },
      orderBy: { name: "asc" },
      take: 4,
      select: { slug: true, name: true, nameBn: true, village: true, origin: { select: { district: true } } },
    }),
  ]);
  return {
    products: products.map((p) => ({ slug: p.slug, name: p.name, nameBn: p.nameBn, artKey: p.artKey, imageUrl: p.images[0]?.url ?? null, priceMinor: p.variants[0]?.priceMinor ?? null, district: p.origin?.district ?? null })),
    categories,
    districts,
    producers: producers.map((p) => ({ slug: p.slug, name: p.name, nameBn: p.nameBn, village: p.village, district: p.origin.district })),
  };
}
