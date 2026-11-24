/**
 * Apply the Sylhet launch to an existing database (safe for production; does not delete data).
 *
 *   npm run launch:sylhet
 *
 * - Contact phone/address/hours in site settings. The placeholder demo e-mail is cleared;
 *   set CONTACT_EMAIL to publish a real address.
 * - Homepage hero and pilot copy, the "Where do you deliver?" FAQ answer, Bangla policy titles.
 * - Creates the Sylhet delivery zones (if missing) with slots for the booking window, and
 *   deactivates any non-Sylhet zones. Existing orders keep their zone; nothing is deleted.
 * - Catalogue and editorial copy from prisma/content.ts (text fields only).
 * Re-running is harmless.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { contact, deliveryFaq, heroSection, pageTitlesBn, pilotSection, sylhetZones } from "./sylhet-launch.ts";
import { slotTimes } from "./seed-data.ts";
import { applyContent } from "./content.ts";

const { DATABASE_URL, CONTACT_EMAIL } = process.env;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: DATABASE_URL }) });
const minor = (taka: number) => taka * 100;

const current = await db.siteSettings.findUnique({ where: { id: 1 } });
const email = CONTACT_EMAIL?.trim() || (current?.contactEmail?.endsWith(".example") ? null : current?.contactEmail ?? null);
const settings = { contactPhone: contact.phone, contactAddress: contact.address, conciergeHours: contact.hours, contactEmail: email };
await db.siteSettings.upsert({ where: { id: 1 }, create: { id: 1, demoMode: false, ...settings }, update: settings });
console.log(`Settings: phone ${contact.phone}, ${contact.address}${email ? `, ${email}` : " (no e-mail published)"}.`);

for (const s of [heroSection, pilotSection]) {
  const { key, ...data } = s;
  await db.contentSection.upsert({ where: { key }, create: s, update: data });
}
console.log("Homepage hero and pilot sections updated.");

const faq = await db.faqItem.findFirst({ where: { question: deliveryFaq.question } });
if (faq) await db.faqItem.update({ where: { id: faq.id }, data: deliveryFaq });
else await db.faqItem.create({ data: { ...deliveryFaq, position: 3 } });
if (faq) await db.faqItem.update({ where: { id: faq.id }, data: { position: 3 } });

for (const [slug, titleBn] of Object.entries(pageTitlesBn)) {
  await db.page.updateMany({ where: { slug }, data: { titleBn } });
}
console.log("FAQ and policy titles updated.");
console.log(`Catalogue and editorial copy updated (${await applyContent(db)} records).`);

const s = await db.siteSettings.findUniqueOrThrow({ where: { id: 1 } });
const now = new Date();
for (const z of sylhetZones) {
  const existing = await db.deliveryZone.findFirst({ where: { name: z.name } });
  const data = { name: z.name, division: z.division, district: z.district, areas: z.areas, feeMinor: minor(z.fee), freeThresholdMinor: minor(z.freeThreshold), active: true };
  const zone = existing ? await db.deliveryZone.update({ where: { id: existing.id }, data }) : await db.deliveryZone.create({ data });
  let created = 0;
  for (let d = 1; d <= Math.max(s.bookingWindowDays, 7); d++) {
    const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + d));
    for (const [start, end] of slotTimes) {
      const r = await db.deliverySlot.upsert({
        where: { zoneId_date_startTime: { zoneId: zone.id, date, startTime: start } },
        create: { zoneId: zone.id, date, startTime: start, endTime: end, capacity: 12 },
        update: {},
      });
      if (r.booked === 0) created++;
    }
  }
  console.log(`Zone ready: ${z.name} (${created} open slots).`);
}
const off = await db.deliveryZone.updateMany({ where: { district: { not: "Sylhet" }, active: true }, data: { active: false } });
if (off.count) console.log(`Deactivated ${off.count} non-Sylhet zone(s).`);

await db.$disconnect();
console.log("Sylhet launch applied.");
