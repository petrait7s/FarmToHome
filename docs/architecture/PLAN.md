# FarmToHome — Implementation Plan & Architecture

Status: living document. Update it when the architecture changes.

**Implementation status (Phases 0–10 complete):** storefront, market builder, basket, checkout, orders and tracking, accounts, saved markets, traceability, producers, concierge, admin panel and operational workflows are implemented and covered by unit, integration and end-to-end tests. See the README for setup and `SECURITY.md` / `DEPLOYMENT.md` for operations.

## 1. Audit summary (Phase 0)

| What exists | Use |
|---|---|
| `docs/design/01–07` | Business reading, visual language, IA, journeys, key experiences, motion. Source of truth for design. |
| `docs/design/02-visual-language.md §2.1a` | Earlier brand direction (superseded November 2026 by the five-colour palette in `src/styles/tokens.css`): **Red Orange was the main brand colour**; Ivory surfaces; Sky Blue supporting text; Harvest Gold highlights. Ivory on Red Orange is 2.95:1, so labels on orange stay large and bold; small text sits on Ivory. |
| `prototype/weekly-market/index.html` | Reference for the Weekly Market Builder: category accordion, inline size + quantity, live summary, household hints, suggestions that never auto-add, saved markets, Know Your Origin, checkout, success. **Reference only, not production code.** Its palette-only product illustrations are reused as image fallbacks until real photography exists. |
| Application code, database, dependencies | None. Greenfield. |

## 2. Stack decision

| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js 16 (App Router) + React 19 + TypeScript** | Server components keep JS small on slow mobile connections; server actions and route handlers keep business logic on the server. |
| Database | **PostgreSQL 16** | Transactions and row-level conditional updates for slot capacity and stock reservation. |
| ORM | **Prisma 7** with `@prisma/adapter-pg` | Typed schema and migrations; no native query-engine binary at runtime. |
| Styling | **CSS Modules + global design tokens** (`src/styles/tokens.css`) | Strict five-colour palette (Sapphire Blue, Warm Ivory, Deep Teal Green, Champagne Gold, Charcoal Black) enforced through tokens; no utility framework needed. |
| Auth | **Custom session auth**: bcrypt password hashes, random session tokens stored as HMAC-SHA256 hashes, httpOnly cookies | Small, auditable, no third-party dependency. |
| Validation | **Zod** on every server boundary | One schema per input. |
| i18n | Central dictionaries `src/i18n/{en,bn}.ts`, cookie `fth_lang`, server `getT()` | No hardcoded strings in components; Bangla fonts via `next/font`. Product content has optional `*Bn` columns with English fallback. |
| QR | `qrcode` (SVG) | Batch traceability QR codes. |
| Tests | **Vitest** (unit + DB integration) and **Playwright** (end-to-end) | |

## 3. Module layout

```
prisma/                schema.prisma, migrations/, seed.ts
src/app/(store)/       public storefront, market builder, basket, checkout, account, trace, concierge
src/app/admin/         staff-only administration (role-guarded layout + per-action checks)
src/app/api/           JSON route handlers (cart, QR, simulated payment callback)
src/server/            business logic, no React:
  auth/  catalog/  cart/  pricing/  orders/  inventory/  delivery/  promotions/
  payments/  traceability/  markets/  content/  settings/  concierge/  audit/  rate-limit/  storage/  mail/
src/lib/               db client, money, env, ids, utils
src/components/        ui/ (design system), store/, market/, checkout/, admin/
src/i18n/              dictionaries + helpers
tests/                 unit/, integration/, e2e/
```

## 4. Key business rules

- **Prices, totals, discounts, delivery fees and stock are computed on the server only.** The client sends variant IDs and quantities, never prices.
- **Order placement** is one database transaction: validate contact, address, zone, slot; reserve slot capacity with a conditional update; re-price every line; validate availability; validate promotion; compute delivery fee and total; create order, items, batch allocations, status history and payment; reserve inventory with conditional updates. An **idempotency key** (unique on `Order`) prevents duplicate orders.
- **Inventory** is never a bare editable number. `Inventory` rows (per variant and batch) hold `onHand` and `reserved`; every change writes an `InventoryMovement`. Order items keep their batch allocations: Product → Producer → Procurement → Batch → Inventory → Order.
- **Sourced-to-order** variants (for example fresh fish) skip stock reservation; staff allocate a batch later.
- **Order workflow**: Placed → Confirmed → Procurement → Quality Check → Processing → Packaging → Ready for Dispatch → Out for Delivery → Delivered (or Cancelled). Stages that do not apply to an order (all items already in stock) are skipped. Every change writes `OrderStatusHistory` and a customer notification.
- **Payments**: provider interface with `CashOnDelivery`, `SimulatedMobile`, `SimulatedOnline`. Simulated providers are labelled everywhere and move no money. No card data is collected.
- **Honesty**: `isDemo` flags on producers, products, batches and reports; producer `verificationStatus`; origin class definitions are editable settings and show "definition pending" until the business supplies them. Quality reports without a file show "not yet available".

## 5. Security

Hashed passwords (bcrypt) and hashed session tokens; httpOnly, SameSite=Lax, Secure-in-production cookies; role checks in admin layout **and** in every admin action; ownership checks on orders, addresses and saved markets; Zod validation; DB-backed rate limiting on login, register, password reset, concierge and checkout; Origin checks on JSON mutations (server actions have built-in origin checks); upload validation by size and magic bytes; secrets only in environment variables; audit log for admin operations.

## 6. Milestones

| Phase | Scope |
|---|---|
| 0 | Audit, this plan |
| 1 | Scaffold, schema + migration, auth, tokens, layout, navigation, i18n |
| — | Seed: realistic, clearly labelled demo data |
| 2 | Home, Explore, product detail, search, filters |
| 3 | Weekly Market, Monthly Stock, Build My Basket, shared server cart, saved markets |
| 4–5 | Account (register, login, reset, profile, addresses, orders, notifications) and checkout with server order logic, payments, confirmation, tracking |
| 6 | Traceability (batch pages, QR, journey), producers, origins, Our Journey, Concierge |
| 7–8 | Admin: dashboard, catalog, producers, procurement, batches, inspections, inventory, orders, delivery, customers, promotions, content, settings, audit |
| 9–10 | Unit, integration and e2e tests; security, accessibility, performance and responsive review; deployment docs |

## 8. Deviations from the original plan

- Saved markets require an account (anonymous visitors are asked to sign in), so lists are durable and private.
- The admin panel is English-only; customer-facing UI is fully bilingual.
- `Cart.savedMarketId` was added so orders record which saved market they came from (saved-market history).
- Test databases are prepared with `prisma migrate deploy` plus the seed's guarded wipe instead of `prisma migrate reset`.

## 7. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Ivory-on-orange contrast (2.95:1) | Large bold labels only; small text on Ivory surfaces; documented trade-off. |
| No real photography | Palette illustrations as fallbacks; `ProductImage` supports real uploads. |
| No payment provider credentials | Clean provider interface with clearly labelled simulated providers. |
| No email/SMS provider | `Mailer` interface; development driver logs messages (reset links shown on screen only in development). |
| Undefined O1/O2/O3 and quality grade scales | Editable definitions in settings, shown as "pending" by default. |
| Concurrency on slots and stock | Conditional SQL updates inside transactions; tests cover capacity exhaustion. |
