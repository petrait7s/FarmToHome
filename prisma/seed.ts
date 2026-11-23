/**
 * Development seed. Creates clearly labelled demonstration data.
 * Run with: npm run db:seed   (or automatically by `prisma migrate reset`).
 * Refuses to run in production and refuses to run on a database that already has products unless SEED_FORCE=1.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { categories, origins, producers, products, zones, slotTimes } from "./seed-data.ts";

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to seed demo data in production.");
  process.exit(1);
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const day = 864e5;
const daysAgo = (n: number) => new Date(Date.now() - n * day);
const minor = (taka: number) => Math.round(taka * 100);

function batchNumber(cat: string, date: Date, seed: string) {
  const y = String(date.getFullYear()).slice(2), m = String(date.getMonth() + 1).padStart(2, "0"), d = String(date.getDate()).padStart(2, "0");
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) % 9000;
  return `FTH-${cat.slice(0, 3).toUpperCase()}-${y}${m}${d}-${1000 + h}`;
}

async function wipe() {
  // Order matters because of foreign keys. Development only.
  const tables = [
    "PaymentEvent", "Payment", "PromotionRedemption", "OrderItemAllocation", "OrderItem", "OrderStatusHistory", "DeliveryAssignment",
    "InventoryMovement", "Order", "Inventory", "QualityReport", "QualityInspection", "Batch", "ProcurementItem", "Procurement",
    "CartItem", "Cart", "SavedMarketItem", "SavedMarket", "Favorite", "CollectionProduct", "Collection", "ProductImage", "ProductVariant",
    "_PromotionProducts", "_PromotionCategories", "Promotion", "Product", "Producer", "Origin", "Category", "DeliverySlot", "DeliveryZone",
    "ConciergeMessage", "ConciergeRequest", "Notification", "AuditLog", "Address", "PasswordResetToken", "Session", "CustomerProfile", "User",
    "ContentSection", "FaqItem", "Page", "SiteSettings", "RateLimit",
  ];
  for (const t of tables) await db.$executeRawUnsafe(`DELETE FROM "${t}"`);
}

async function main() {
  const existing = await db.product.count();
  if (existing > 0) {
    if (process.env.SEED_FORCE !== "1") {
      console.log("Database already has products. Set SEED_FORCE=1 to wipe and reseed (development only).");
      return;
    }
    await wipe();
  }

  // ── Settings ──
  const settingsData = {
      demoMode: true, minOrderMinor: minor(500), orderCutoffHour: 20, bookingWindowDays: 7,
      contactPhone: "+880 1700-000000 (demo)", contactEmail: "concierge@farmtohome.example", contactAddress: "Dhaka (pilot)",
      conciergeHours: "8 AM – 10 PM daily (demo)",
      originClassDefinitions: { O1: "", O2: "", O3: "" },
  };
  await db.siteSettings.upsert({ where: { id: 1 }, create: { id: 1, ...settingsData }, update: settingsData });

  // ── Users ──
  const admin = await db.user.create({ data: { name: "FarmToHome Admin", phone: "01700000001", email: "admin@farmtohome.test", role: "ADMIN", passwordHash: await bcrypt.hash("Admin#2026demo", 12), profile: { create: {} } } });
  await db.user.create({ data: { name: "Operations Staff", phone: "01700000002", email: "staff@farmtohome.test", role: "STAFF", passwordHash: await bcrypt.hash("Staff#2026demo", 12), profile: { create: {} } } });
  const customer = await db.user.create({
    data: {
      name: "Rahman Family", phone: "01712345678", email: "customer@farmtohome.test", passwordHash: await bcrypt.hash("Customer#2026", 12),
      profile: { create: { householdSize: 4 } },
      addresses: { create: { label: "Home", recipient: "Rahman Family", phone: "01712345678", division: "Dhaka", district: "Dhaka", area: "Banani", line1: "House 12, Road 7, Block C", landmark: "Near Banani lake", instructions: "Hand over to house manager", isDefault: true } },
    },
  });

  // ── Catalogue ──
  const catIds = new Map<string, string>();
  for (const [i, c] of categories.entries()) {
    const row = await db.category.create({ data: { ...c, position: i } });
    catIds.set(c.slug, row.id);
  }
  const originIds = new Map<string, string>();
  for (const o of origins) {
    const row = await db.origin.create({ data: { ...o, isDemo: true } });
    originIds.set(o.slug, row.id);
  }
  const producerRows = new Map<string, { id: string; originId: string }>();
  for (const p of producers) {
    const originId = originIds.get(p.origin)!;
    const row = await db.producer.create({
      data: {
        slug: p.slug, name: p.name, nameBn: p.nameBn, craft: p.craft, village: p.village, originId, quote: p.quote,
        story: `${p.name} is a ${p.craft.toLowerCase()} from ${p.village}. This profile is demonstration content; a verified producer story will replace it once sourcing records are confirmed.`,
        verificationStatus: p.status, isDemo: true,
      },
    });
    producerRows.set(p.slug, { id: row.id, originId });
  }

  const productIds = new Map<string, string>();
  const variantIds = new Map<string, string[]>();
  for (const p of products) {
    const prod = producerRows.get(p.producer)!;
    const row = await db.product.create({
      data: {
        slug: p.slug, name: p.name, nameBn: p.nameBn, summary: p.summary, summaryBn: p.summaryBn, description: p.description,
        story: p.story ?? `${p.description} Sourced from ${p.producer.replace(/-/g, " ")}. (Demonstration story.)`,
        categoryId: catIds.get(p.cat)!, producerId: prod.id, originId: prod.originId, originClass: p.originClass, qualityGrade: p.grade,
        processingInfo: p.processing, packagingInfo: p.packaging, storageInfo: p.storage, handlingInfo: p.handling, artKey: p.art,
        marketFit: p.fit, isEssential: !!p.essential, isSeasonal: !!p.seasonal, isNew: !!p.isNew, isFeatured: !!p.featured, isPerishable: !!p.perishable,
        householdUsePerPersonWeek: p.use?.[0], householdUseUnit: p.use?.[1], isDemo: true,
        variants: {
          create: p.variants.map((v, i) => ({
            sku: `${p.slug.toUpperCase().replace(/[^A-Z0-9]+/g, "-").slice(0, 24)}-${v.label.toUpperCase().replace(/[^A-Z0-9]+/g, "")}`,
            label: v.label, labelBn: v.labelBn, netQuantity: v.qty, unit: v.unit, priceMinor: minor(v.price), position: i,
            fulfillmentMode: v.mode ?? "STOCK", lowStockThreshold: 8,
          })),
        },
      },
      include: { variants: { orderBy: { position: "asc" } } },
    });
    productIds.set(p.slug, row.id);
    variantIds.set(p.slug, row.variants.map((v) => v.id));
  }

  // ── Sourcing: procurement → batch → inspection → report → inventory ──
  let procIndex = 0;
  for (const p of products) {
    const prod = producerRows.get(p.producer)!;
    const productId = productIds.get(p.slug)!;
    const product = await db.product.findUniqueOrThrow({ where: { id: productId }, include: { variants: true } });
    const sourced = product.variants.every((v) => v.fulfillmentMode === "SOURCED_TO_ORDER");
    const collected = daysAgo(Math.max(p.daysSinceHarvest, sourced ? 1 : 2));
    const unitCost = Math.round(p.variants[0].price * 0.62 / p.variants[0].qty * (p.variants[0].unit === "g" ? 1000 : 1));
    const proc = await db.procurement.create({
      data: {
        reference: `PRC-DEMO-${String(++procIndex).padStart(4, "0")}`, producerId: prod.id, status: "RECEIVED", receivedAt: collected, isDemo: true,
        notes: "Demonstration procurement record.",
        items: { create: { productId, quantity: sourced ? 40 : 300, unit: p.variants[0].unit === "pc" ? "pc" : p.variants[0].unit === "L" ? "L" : "kg", unitCostMinor: minor(unitCost), marketReferenceMinor: minor(Math.round(unitCost / 1.3)) } },
      },
      include: { items: true },
    });
    const packed = new Date(collected.getTime() + day);
    const batch = await db.batch.create({
      data: {
        batchNumber: batchNumber(p.cat === "fish-seafood" ? "fish" : p.cat, collected, p.slug), productId, producerId: prod.id, originId: prod.originId,
        procurementItemId: proc.items[0].id, collectedAt: collected, processedAt: sourced ? null : packed, packedAt: sourced ? null : packed,
        receivedQuantity: proc.items[0].quantity, rejectedQuantity: sourced ? 0 : 6, processingLoss: sourced ? 0 : 4, packagingLoss: sourced ? 0 : 1, quantityUnit: proc.items[0].unit,
        qualityGrade: p.grade, processingNotes: p.processing, packagingNotes: p.packaging, storageNotes: p.storage,
        sourceNote: `Collected from ${p.producer.replace(/-/g, " ")} (demonstration).`, status: sourced ? "APPROVED" : "ACTIVE", isDemo: true,
      },
    });
    await db.qualityInspection.create({
      data: {
        batchId: batch.id, inspectorId: admin.id, inspectedAt: new Date(collected.getTime() + day / 2), result: "PASSED", grade: p.grade,
        checks: { visual: "pass", odour: "pass", moisture: p.cat.includes("fish") ? "n/a" : "within limit", foreignMatter: "within limit" },
        notes: "Demonstration inspection record.",
      },
    });
    if (!sourced && ["rice-grains", "spices-herbs", "oils-honey-ghee", "dried-fish"].includes(p.cat)) {
      await db.qualityReport.create({
        data: {
          batchId: batch.id, title: "Quality screening summary", laboratory: null, issuedAt: packed, isDemo: true, isVerified: false,
          summary: "Demonstration summary only — not a real laboratory result. Real reports will be attached as PDF when available.",
        },
      });
    }
    if (!sourced) {
      for (const [i, v] of product.variants.entries()) {
        const units = [48, 30, 14][i] ?? 12;
        await db.inventory.create({ data: { variantId: v.id, batchId: batch.id, onHand: units } });
        await db.inventoryMovement.create({ data: { variantId: v.id, batchId: batch.id, type: "QC_APPROVED", quantity: units, onHandAfter: units, reservedAfter: 0, reason: "Packed units received into stock (demo seed)", actorId: admin.id } });
      }
    }
  }

  // ── Collections ──
  const col = async (slug: string, title: string, titleBn: string, description: string, items: string[], featured = true) =>
    db.collection.create({ data: { slug, title, titleBn, description, featured, products: { create: items.map((s, i) => ({ productId: productIds.get(s)!, position: i })) } } });
  await col("winter-arrivals", "Winter arrivals", "শীতের আগমন", "The first tapping of date-palm gur, new aman chira and hill citrus.", ["khejur-patali-gur", "new-aman-chira", "sylhet-shatkora", "bogura-mishti-doi"]);
  await col("pantry-foundations", "Pantry foundations", "ভাঁড়ারের ভিত্তি", "The staples a household restocks every month.", ["miniket-rice", "deshi-masoor-dal", "cold-pressed-mustard-oil", "hill-turmeric", "red-chili-powder", "lal-atta"]);
  await col("a-bengali-fish-feast", "A Bengali fish feast", "বাঙালির মাছের ভোজ", "Haor pabda, golda prawns and shutki for the weekend table.", ["haor-pabda", "golda-prawns", "katla", "loitta-shutki"]);

  // ── Delivery ──
  for (const z of zones) {
    const zone = await db.deliveryZone.create({ data: { name: z.name, division: z.division, district: z.district, areas: z.areas, feeMinor: minor(z.fee), freeThresholdMinor: minor(z.freeThreshold) } });
    for (let d = 1; d <= 14; d++) {
      const date = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + d));
      for (const [i, [start, end]] of slotTimes.entries()) {
        await db.deliverySlot.create({ data: { zoneId: zone.id, date, startTime: start, endTime: end, capacity: d === 1 && i === 3 ? 1 : 12, booked: d === 1 && i === 3 ? 1 : 0 } });
      }
    }
  }

  // ── Promotions ──
  await db.promotion.create({ data: { code: "WELCOME10", description: "10% off a first market (max ৳300, min ৳1,500). Demo code.", type: "PERCENT", value: 10, minSubtotalMinor: minor(1500), maxDiscountMinor: minor(300), perCustomerLimit: 1 } });
  await db.promotion.create({ data: { code: "WINTER100", description: "৳100 off winter specialties. Demo code.", type: "FIXED", value: minor(100), categories: { connect: { id: catIds.get("regional-seasonal")! } }, endsAt: new Date(Date.now() + 60 * day) } });
  await db.promotion.create({ data: { code: "OLD50", description: "Expired demo code.", type: "FIXED", value: minor(50), endsAt: daysAgo(10), active: true } });

  // ── Content ──
  const sections = [
    { key: "home.hero", eyebrow: "Luxury digital grocery concierge", eyebrowBn: "বিলাসবহুল ডিজিটাল গ্রোসারি কনসিয়ার্জ", title: "Every product has a story.", titleBn: "প্রতিটি পণ্যের একটি গল্প আছে।", body: "Plan your household’s weekly market or monthly stock in minutes. Directly sourced, quality-checked, traceable to the batch, delivered on your schedule.", bodyBn: "কয়েক মিনিটেই আপনার পরিবারের সাপ্তাহিক বাজার বা মাসিক মজুদ পরিকল্পনা করুন। সরাসরি সংগৃহীত, মান যাচাইকৃত, ব্যাচ পর্যন্ত ট্রেসযোগ্য, আপনার সময়মতো ডেলিভারি।", ctaLabel: "Build Your Market", ctaLabelBn: "আপনার বাজার সাজান", ctaHref: "/market/weekly" },
    { key: "home.pilot", title: "Now welcoming founding households in Dhaka", titleBn: "ঢাকায় প্রথম পরিবারগুলোকে স্বাগত জানাচ্ছি", body: "We are starting with a limited number of households in Gulshan, Banani, Baridhara, Dhanmondi and Uttara, so we can get sourcing, quality and delivery right before we grow.", bodyBn: "আমরা গুলশান, বনানী, বারিধারা, ধানমন্ডি ও উত্তরায় সীমিত সংখ্যক পরিবার নিয়ে শুরু করছি, যাতে বড় হওয়ার আগে সংগ্রহ, মান ও ডেলিভারি ঠিক করতে পারি।", ctaLabel: "Ask the concierge", ctaLabelBn: "কনসিয়ার্জকে জিজ্ঞেস করুন", ctaHref: "/concierge" },
  ];
  for (const s of sections) await db.contentSection.create({ data: s });
  const faqs = [
    ["How is FarmToHome different from a grocery delivery app?", "We are built for planned household shopping — a weekly market or monthly stock — delivered on a scheduled slot. Planning lets us source directly, inspect properly and pack with care."],
    ["Where do you deliver?", "During the pilot we deliver to selected areas of Dhaka. Enter your area at checkout to see available slots."],
    ["What does “sourced after you order” mean?", "Fresh fish is collected after your order is placed and cleaned on the morning of delivery, so it reaches you as fresh as possible."],
    ["Are your quality reports real?", "This development build uses clearly labelled demonstration summaries. In production, reports are attached only when a real test has been carried out, and we say so when none exists."],
    ["Is online payment available?", "Cash on Delivery is available. Mobile and online payments are shown as simulated in this development build; no money moves and no card details are collected."],
    ["Can I change or cancel an order?", "You can cancel from your account until the order is confirmed. After that, contact the concierge and we will help."],
  ];
  for (const [i, [q, a]] of faqs.entries()) await db.faqItem.create({ data: { question: q, answer: a, position: i } });
  const draft = "DRAFT FOR DEVELOPMENT — this policy text is a placeholder and has not been reviewed. Replace it with approved legal text before launch.";
  await db.page.create({ data: { slug: "delivery-policy", title: "Delivery policy", body: `${draft}\n\nOrders are delivered in the slot you choose at checkout. Fresh items are packed on ice the morning of delivery. If we cannot deliver in your slot, your concierge will call you to reschedule.` } });
  await db.page.create({ data: { slug: "refund-policy", title: "Refunds & replacements", body: `${draft}\n\nIf any item arrives below standard, tell your concierge within 24 hours with a photo. We will replace it or credit you.` } });
  await db.page.create({ data: { slug: "privacy", title: "Privacy", body: `${draft}\n\nWe use your contact and address details only to fulfil and support your orders. We do not sell personal data.` } });
  await db.page.create({ data: { slug: "terms", title: "Terms of service", body: `${draft}\n\nPrices shown are final at checkout and include packing and quality handling. Promotions are subject to their stated conditions.` } });

  // ── A saved market for the demo customer ──
  const v = (slug: string, i = 0) => variantIds.get(slug)![i];
  await db.savedMarket.create({
    data: {
      userId: customer.id, name: "Our Usual Week", mode: "WEEKLY",
      items: { create: [v("miniket-rice"), v("rui-rohu"), v("tilapia"), v("deshi-masoor-dal"), v("cold-pressed-mustard-oil"), v("hill-turmeric")].map((variantId, i) => ({ variantId, quantity: 1, position: i })) },
    },
  });
  await db.savedMarket.create({
    data: {
      userId: customer.id, name: "Monthly Pantry", mode: "MONTHLY",
      items: { create: [v("miniket-rice", 2), v("cold-pressed-mustard-oil", 2), v("deshi-masoor-dal", 2), v("roasted-mug-dal", 1), v("hill-turmeric", 1), v("red-chili-powder", 1), v("lal-atta", 1)].map((variantId, i) => ({ variantId, quantity: 1, position: i })) },
    },
  });

  console.log("Seed complete.");
  console.log("  Admin:    01700000001 / Admin#2026demo");
  console.log("  Staff:    01700000002 / Staff#2026demo");
  console.log("  Customer: 01712345678 / Customer#2026");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
