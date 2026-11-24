import "server-only";
import { db } from "@/lib/db";
import { availableByVariant } from "./inventory/availability";
import type { MarketFit, Prisma } from "@/generated/prisma/client";

/** Serializable product shape shared by storefront cards and the market builder. */
export type ProductDTO = {
  id: string;
  slug: string;
  name: string;
  nameBn: string | null;
  summary: string;
  summaryBn: string | null;
  categoryId: string;
  categorySlug: string;
  artKey: string | null;
  imageUrl: string | null;
  originDistrict: string | null;
  originSlug: string | null;
  producerName: string | null;
  producerSlug: string | null;
  originClass: string | null;
  grade: string | null;
  isPerishable: boolean;
  isSeasonal: boolean;
  isNew: boolean;
  isEssential: boolean;
  isDemo: boolean;
  marketFit: MarketFit;
  householdUsePerPersonWeek: number | null;
  householdUseUnit: string | null;
  variants: VariantDTO[];
};

export type VariantDTO = {
  id: string;
  label: string;
  labelBn: string | null;
  netQuantity: number;
  unit: string;
  priceMinor: number;
  fulfillmentMode: "STOCK" | "SOURCED_TO_ORDER";
  available: number | null;
};

const productInclude = {
  category: { select: { id: true, slug: true } },
  origin: { select: { district: true, slug: true } },
  producer: { select: { name: true, slug: true } },
  images: { orderBy: { position: "asc" as const }, take: 1, select: { url: true } },
  variants: { where: { active: true }, orderBy: { position: "asc" as const } },
} satisfies Prisma.ProductInclude;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

async function toDTOs(rows: ProductRow[]): Promise<ProductDTO[]> {
  const avail = await availableByVariant(rows.flatMap((r) => r.variants.map((v) => v.id)));
  return rows
    .filter((r) => r.variants.length > 0)
    .map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      nameBn: r.nameBn,
      summary: r.summary,
      summaryBn: r.summaryBn,
      categoryId: r.category.id,
      categorySlug: r.category.slug,
      artKey: r.artKey,
      imageUrl: r.images[0]?.url ?? null,
      originDistrict: r.origin?.district ?? null,
      originSlug: r.origin?.slug ?? null,
      producerName: r.producer?.name ?? null,
      producerSlug: r.producer?.slug ?? null,
      originClass: r.originClass,
      grade: r.qualityGrade,
      isPerishable: r.isPerishable,
      isSeasonal: r.isSeasonal,
      isNew: r.isNew,
      isEssential: r.isEssential,
      isDemo: r.isDemo,
      marketFit: r.marketFit,
      householdUsePerPersonWeek: r.householdUsePerPersonWeek,
      householdUseUnit: r.householdUseUnit,
      variants: r.variants.map((v) => ({
        id: v.id,
        label: v.label,
        labelBn: v.labelBn,
        netQuantity: v.netQuantity,
        unit: v.unit,
        priceMinor: v.priceMinor,
        fulfillmentMode: v.fulfillmentMode,
        available: avail.has(v.id) ? (avail.get(v.id) as number | null) : 0,
      })),
    }));
}

export async function listCategories() {
  return db.category.findMany({
    where: { active: true },
    orderBy: { position: "asc" },
    include: { _count: { select: { products: { where: { status: "ACTIVE" } } } } },
  });
}

export type ProductQuery = {
  category?: string;
  origin?: string;
  producer?: string;
  collection?: string;
  q?: string;
  seasonal?: boolean;
  isNew?: boolean;
  featured?: boolean;
  fit?: MarketFit[];
  sort?: "curated" | "newest" | "price_asc" | "price_desc" | "popular";
  page?: number;
  pageSize?: number;
};

function whereFor(q: ProductQuery): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [{ status: "ACTIVE" }, { category: { active: true } }];
  if (q.category) and.push({ category: { slug: q.category } });
  if (q.origin) and.push({ origin: { slug: q.origin } });
  if (q.producer) and.push({ producer: { slug: q.producer } });
  if (q.collection) and.push({ collections: { some: { collection: { slug: q.collection, active: true } } } });
  if (q.seasonal) and.push({ isSeasonal: true });
  if (q.isNew) and.push({ isNew: true });
  if (q.featured) and.push({ isFeatured: true });
  if (q.fit?.length) and.push({ marketFit: { in: q.fit } });
  const term = q.q?.trim().slice(0, 80);
  if (term) {
    const c = { contains: term, mode: "insensitive" as const };
    and.push({
      OR: [
        { name: c }, { nameBn: c }, { summary: c }, { description: c },
        { origin: { district: c } }, { origin: { division: c } },
        { producer: { name: c } }, { category: { name: c } },
      ],
    });
  }
  return { AND: and };
}

export async function searchProducts(q: ProductQuery): Promise<{ items: ProductDTO[]; total: number; page: number; pages: number }> {
  const pageSize = Math.min(48, Math.max(1, q.pageSize ?? 24));
  const page = Math.max(1, q.page ?? 1);
  const where = whereFor(q);
  const total = await db.product.count({ where });

  let rows: ProductRow[];
  if (q.sort === "price_asc" || q.sort === "price_desc" || q.sort === "popular") {
    // Sort in application code by min variant price or order volume; catalogue size per page is small.
    const all = await db.product.findMany({ where, include: productInclude });
    let sorted = all;
    if (q.sort === "popular") {
      const counts = await db.orderItem.groupBy({ by: ["variantId"], _sum: { quantity: true } });
      const byVariant = new Map(counts.map((c) => [c.variantId, c._sum.quantity ?? 0]));
      const score = (p: ProductRow) => p.variants.reduce((s, v) => s + (byVariant.get(v.id) ?? 0), 0);
      sorted = [...all].sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name));
    } else {
      const minPrice = (p: ProductRow) => Math.min(...p.variants.map((v) => v.priceMinor), Number.MAX_SAFE_INTEGER);
      sorted = [...all].sort((a, b) => (q.sort === "price_asc" ? minPrice(a) - minPrice(b) : minPrice(b) - minPrice(a)));
    }
    rows = sorted.slice((page - 1) * pageSize, page * pageSize);
  } else {
    rows = await db.product.findMany({
      where,
      include: productInclude,
      orderBy: q.sort === "newest" ? [{ createdAt: "desc" }] : [{ isFeatured: "desc" }, { category: { position: "asc" } }, { name: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }
  return { items: await toDTOs(rows), total, page, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

/** All active products for a market-builder mode, grouped by category order. */
export async function productsForMarket(fit: MarketFit[] | null): Promise<ProductDTO[]> {
  const rows = await db.product.findMany({
    where: whereFor({ fit: fit ?? undefined }),
    include: productInclude,
    orderBy: [{ category: { position: "asc" } }, { isEssential: "desc" }, { isFeatured: "desc" }, { name: "asc" }],
  });
  return toDTOs(rows);
}

export async function productsBySlugs(slugs: string[]): Promise<ProductDTO[]> {
  const rows = await db.product.findMany({ where: { slug: { in: slugs }, status: "ACTIVE" }, include: productInclude });
  const dtos = await toDTOs(rows);
  return slugs.map((s) => dtos.find((d) => d.slug === s)).filter((d): d is ProductDTO => !!d);
}

export async function featuredProducts(kind: "seasonal" | "new" | "featured", take = 8): Promise<ProductDTO[]> {
  const rows = await db.product.findMany({
    where: whereFor({ seasonal: kind === "seasonal", isNew: kind === "new", featured: kind === "featured" }),
    include: productInclude,
    orderBy: [{ updatedAt: "desc" }],
    take,
  });
  return toDTOs(rows);
}

export async function popularProducts(take = 8): Promise<ProductDTO[]> {
  return (await searchProducts({ sort: "popular", pageSize: take })).items;
}

export async function getProductDetail(slug: string) {
  const product = await db.product.findUnique({
    where: { slug },
    include: {
      category: true,
      origin: true,
      producer: { include: { origin: true } },
      images: { orderBy: { position: "asc" } },
      variants: { where: { active: true }, orderBy: { position: "asc" } },
      batches: {
        where: { status: { in: ["ACTIVE", "APPROVED", "PACKED"] } },
        orderBy: [{ packedAt: "desc" }, { collectedAt: "desc" }],
        take: 1,
        include: { reports: true, inspections: { orderBy: { inspectedAt: "desc" }, take: 1 } },
      },
    },
  });
  if (!product || product.status !== "ACTIVE") return null;
  const [dto] = await toDTOs([
    { ...product, category: { id: product.category.id, slug: product.category.slug }, origin: product.origin ? { district: product.origin.district, slug: product.origin.slug } : null, producer: product.producer ? { name: product.producer.name, slug: product.producer.slug } : null, images: product.images.slice(0, 1) } as ProductRow,
  ]);
  return { product, dto, batch: product.batches[0] ?? null };
}

export async function relatedProducts(productId: string, categoryId: string, originId: string | null, take = 4) {
  const [sameCategory, sameOrigin] = await Promise.all([
    db.product.findMany({ where: { ...whereFor({}), categoryId, id: { not: productId } }, include: productInclude, take }),
    originId ? db.product.findMany({ where: { ...whereFor({}), originId, id: { not: productId } }, include: productInclude, take }) : Promise.resolve([]),
  ]);
  return { sameCategory: await toDTOs(sameCategory), sameOrigin: await toDTOs(sameOrigin) };
}

export async function listOrigins() {
  return db.origin.findMany({
    where: { products: { some: { status: "ACTIVE" } } },
    orderBy: { district: "asc" },
    select: { slug: true, district: true, division: true },
  });
}

export async function listProducersForFilter() {
  return db.producer.findMany({
    where: { active: true, products: { some: { status: "ACTIVE" } } },
    orderBy: { name: "asc" },
    select: { slug: true, name: true },
  });
}

export async function featuredProducers(take = 3) {
  return db.producer.findMany({
    where: { active: true, products: { some: { status: "ACTIVE", isFeatured: true } } },
    include: { origin: true, products: { where: { status: "ACTIVE" }, select: { artKey: true, name: true, slug: true }, take: 3 } },
    take,
    orderBy: { name: "asc" },
  });
}

export async function featuredCollections() {
  const now = new Date();
  return db.collection.findMany({
    where: { active: true, featured: true, OR: [{ endsAt: null }, { endsAt: { gte: now } }], AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }] },
    orderBy: { position: "asc" },
    include: { products: { orderBy: { position: "asc" }, include: { product: { select: { slug: true, name: true, nameBn: true, artKey: true, status: true } } } } },
  });
}

export async function getContent(key: string) {
  return db.contentSection.findFirst({ where: { key, active: true } });
}
