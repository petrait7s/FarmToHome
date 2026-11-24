# FarmToHome

A premium digital grocery and household market platform: **Thoughtfully Sourced. Honestly Delivered.**

Customers plan a **Weekly Market** or **Monthly Stock**, save and repeat markets, check out for a scheduled delivery slot and trace every pack back to its producer and batch. The FarmToHome team runs procurement, quality inspection, batch-level inventory, orders, delivery, promotions and content from a role-guarded admin panel.

> **Development build.** Products, producers, batches, inspections and prices in the seed are **demonstration data** and are labelled as such in the UI. Mobile and online payments are **simulated**; only Cash on Delivery is a real method. No card or wallet details are collected.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · PostgreSQL 16 · Prisma 7 (`@prisma/adapter-pg`) · CSS Modules with brand tokens · Zod · bcrypt · Vitest · Playwright.

See [`docs/architecture/PLAN.md`](docs/architecture/PLAN.md) for architecture and business rules, [`docs/architecture/SECURITY.md`](docs/architecture/SECURITY.md) for the security model, [`docs/architecture/DEPLOYMENT.md`](docs/architecture/DEPLOYMENT.md) for production setup, and [`docs/design/`](docs/design) for the design research.

## Getting started

Requirements: Node.js 22+, PostgreSQL 16+.

```bash
npm install
```

```bash
cp .env.example .env
```

Edit `.env`: set `DATABASE_URL`, `APP_URL=http://localhost:3000` and a random `SESSION_SECRET` (32+ characters).

```bash
npx prisma migrate deploy
```

```bash
npm run db:seed
```

```bash
npm run dev
```

Open http://localhost:3000.

### Demo accounts (seed only — development)

| Role | Sign in | Password |
|---|---|---|
| Administrator | `01700000001` or `admin@farmtohome.test` | `Admin#2026demo` |
| Staff | `01700000002` | `Staff#2026demo` |
| Customer | `01712345678` | `Customer#2026` |

Demo promo codes: `WELCOME10` (10% off, min ৳1,500, max ৳300, once per customer), `WINTER100` (৳100 off winter specialties), `OLD50` (expired).

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Develop, build and run the app |
| `npm run typecheck` | TypeScript check |
| `npm run db:migrate` | Create a new migration in development (`prisma migrate dev`) |
| `npm run db:deploy` | Apply migrations (production / CI) |
| `npm run db:seed` | Load demo data into an empty database (refuses in production; re-seeding needs `SEED_FORCE=1` and only runs on local dev or `*_test` databases) |
| `npm run admin:create` | Create or promote an administrator (works in production; see Deployment) |
| `npm test` | Unit + database integration tests (uses `farmtohome_test`, see below) |
| `npm run test:e2e` | Playwright end-to-end tests (desktop + mobile) against the seeded dev database |
| `npm run test:all` | Typecheck, unit/integration and e2e |

### Tests

- **Unit / integration (Vitest):** `tests/unit`, `tests/integration`. They run against a separate database named by `TEST_DATABASE_URL` (default `postgresql://farmtohome:farmtohome_dev@localhost:5432/farmtohome_test`). Global setup applies migrations with `prisma migrate deploy` and reloads seed data. It refuses any database whose name doesn't end in `_test`.
- **End-to-end (Playwright):** `tests/e2e`. Starts `npm run dev` if nothing is listening on port 3000. Tests create uniquely named customers, so they can be re-run.

## Project structure

```
prisma/              schema, migrations, seed (demo data), create-admin
src/app/(store)/     storefront: home, explore, products, market builder, basket, checkout, orders, account, trace, producers, journey, concierge
src/app/admin/       admin panel (staff/admin only)
src/app/actions/     server actions (validated, rate-limited, role-checked)
src/app/api/cart/    JSON cart API used by the market builder
src/server/          business logic: auth, cart, catalog, pricing, promotions, orders, inventory, delivery, payments, traceability, concierge, audit, storage, mail
src/components/      design system (ui), storefront, market builder, checkout, account, admin
src/i18n/            English and Bangla dictionaries
src/styles/          brand tokens (five approved colours only) and global styles
tests/               unit, integration, e2e
docs/                design research and architecture
prototype/           original HTML prototype (reference only)
```

## Brand colours

Only the five approved colours are used, plus opacity variations: **Sapphire Blue `#164A83`** (main brand surfaces, primary actions, selected states), **Warm Ivory `#F4EBDD`** (background and surfaces), **Deep Teal Green `#075B62`** (supporting text and UI), **Champagne Gold `#C6A15B`** (restrained highlights) and **Charcoal Black `#252525`** (body text). See `src/styles/tokens.css`.

**Typefaces:** Montserrat for English and Tiro Bangla for Bangla.

## Preview photography

The preview uses licensed Unsplash stock photographs from `public/images/` (landscape, products, lifestyle, journey). They are illustrative only — they do not show FarmToHome producers, facilities, products or customers — and are listed at `/credits`. The mapping lives in `src/lib/media.ts`; anything uploaded in the admin panel (product images, category and collection images, producer photos) takes precedence. Products without an accurate stock photo (shutki, gur, chira, lentils) keep their drawn illustration. Replace with real photography before launch.

## Languages

English and Bangla. UI strings live in `src/i18n/en.ts` and `src/i18n/bn.ts` (a test checks both have the same keys). Product, category, producer and content records have optional Bangla columns that fall back to English. The choice is stored in a cookie and, for signed-in customers, in their profile. The admin panel is English-only for now.
