/**
 * Create (or promote) the first administrator in any environment, including production.
 * Usage: ADMIN_NAME="…" ADMIN_PHONE="01XXXXXXXXX" ADMIN_EMAIL="…" ADMIN_PASSWORD="…" npm run admin:create
 * The password is read from the environment so it never appears in shell history arguments.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";

const { ADMIN_NAME, ADMIN_PHONE, ADMIN_EMAIL, ADMIN_PASSWORD, DATABASE_URL } = process.env;
if (!ADMIN_NAME || !ADMIN_PHONE || !ADMIN_PASSWORD || !DATABASE_URL) {
  console.error("Set ADMIN_NAME, ADMIN_PHONE, ADMIN_PASSWORD (and optionally ADMIN_EMAIL).");
  process.exit(1);
}
if (!/^01[3-9]\d{8}$/.test(ADMIN_PHONE)) { console.error("ADMIN_PHONE must be an 11-digit Bangladesh mobile number."); process.exit(1); }
if (ADMIN_PASSWORD.length < 12) { console.error("Use an administrator password of at least 12 characters."); process.exit(1); }

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: DATABASE_URL }) });
const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
const user = await db.user.upsert({
  where: { phone: ADMIN_PHONE },
  create: { name: ADMIN_NAME, phone: ADMIN_PHONE, email: ADMIN_EMAIL?.toLowerCase() || null, role: "ADMIN", passwordHash, profile: { create: {} } },
  update: { role: "ADMIN", passwordHash, status: "ACTIVE" },
});
await db.siteSettings.upsert({ where: { id: 1 }, create: { id: 1, demoMode: false }, update: {} });
await db.auditLog.create({ data: { actorId: user.id, action: "bootstrap_admin", entity: "User", entityId: user.id } });
console.log(`Administrator ready: ${user.name} (${user.phone}).`);
await db.$disconnect();
