# UI/UX implementation report — 25 November 2026

This pass follows `docs/UI-UX-AUDIT.md` and `docs/UI-UX-DIRECTION.md`. Colours and fonts were kept as the owner instructed.

## What changed

| Audit # | Change | Files |
|---|---|---|
| 1 Critical | Account area no longer overflows on phones: the grid item gets `min-width: 0` and the account nav scrolls inside its own row | `account/(member)/account.module.css` |
| 2 Critical | New `--text-muted` token: Charcoal at 72%, about 7:1 on Ivory. All muted text uses it. Journey chapter numbers moved from gold to teal. | `tokens.css`, 14 style files, `journey.module.css` |
| 3 High | Checkout asks the shopper to choose an area first, instead of saying "not served" before any area is picked | `CheckoutForm.tsx`, i18n |
| 4 High | Nav is now Explore · Weekly Market · Monthly Stock · Our Journey · Producers. The logo goes home. | `Header.tsx` |
| 5 High | The basket count bumps when items are added, and the new count is announced politely to screen readers. The tab-bar badge bumps too. | `BasketButton.tsx`, `MobileNav.*` |
| 6 High | Monthly Stock has its own identity: champagne accents and pantry bundles | `MarketBuilder.*` |
| 7 Medium | Household size has an exact-size stepper (1–15) alongside the 2 / 4 / 6 / 8+ presets | `MarketBuilder.tsx` |
| 8 Medium | Pantry bundles on Monthly Stock, built from the "Pantry foundations" collection | `market/load.tsx`, `MarketBuilder.tsx` |
| 9 Medium | Homepage reassurance block (prices, delivery, support, refunds — each linking to the real page) and a closing call to action | `page.tsx`, `home.module.css` |
| 10 Medium | The hero's secondary action is now "Explore our food" | `page.tsx` |
| 11 Medium | Producers can be searched by name, village or craft, and filtered by verification status | `producers/page.tsx` |
| 12 Medium | Trace lookup redesigned: photo hero, large input with a format hint, three-step guide to QR scanning, demo batches as photo cards | `trace/page.tsx`, `trace/lookup.module.css` |
| 13 Medium | Concierge shows "Order number" only for order or delivery questions, with a helper hint | `ConciergeForm.tsx` |
| — | Performance: the homepage seasonal carousel hydrates 4 cards instead of 8. Mobile Lighthouse performance went from 71 to 88. | `page.tsx` |
| — | Accessibility: product-card link names now match their visible text, the mobile tab bar is more opaque, Explore's heading order is fixed and filter checkboxes are larger | `ProductCard.tsx`, `MobileNav.module.css`, `explore/*` |

**How pantry bundles behave:**
- Quantities follow the household size.
- The bundle's total price is shown.
- Nothing is added until the shopper taps.
- After adding, the button reads "In your market".

## Results

### Automated checks

| Check | Result |
|---|---|
| TypeScript | passes |
| Vitest unit + integration | 47 / 47 pass |
| Playwright e2e (desktop + mobile) | 15 / 15 pass |
| Production build | passes |
| axe-core WCAG 2.0/2.1/2.2 A+AA, 26 pages (EN), 20 pages (BN) | **0 violations**. Before: 69 contrast failures on 9 pages. |
| Overflow and status sweep: 29 routes (incl. 9 signed-in account pages) × 9 widths (360, 375, 390, 430, 768, 1024, 1280, 1440, 1920) | **0 issues**: no overflow, no HTTP errors, no broken images, no page errors |

### Lighthouse 12

Measured on a clean production build, local server. "Mobile" means the default simulated slow 4G with 4× CPU throttling.

| Page | Mobile perf / a11y / BP / SEO | Desktop perf / a11y / BP / SEO | Mobile LCP / TBT / CLS |
|---|---|---|---|
| `/` | 88 / 100 / 100 / 100 | 99 / 100 / 100 / 100 | 3.9 s / 60 ms / 0 |
| `/explore` | 85 / 100* / 100 / 100 | 99 / 100* / 100 / 100 | 4.4 s / 50 ms / 0 |
| `/products/haor-pabda` | 87 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 3.9 s / 70 ms / 0.001 |
| `/market/weekly` | 87 / 100 / 100 / 100 | 99 / 100 / 100 / 100 | 4.0 s / 80 ms / 0 |
| `/market/monthly` | 85 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 4.3 s / 120 ms / 0 |
| `/trace` | 91 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 3.4 s / 70 ms / 0 |
| `/producers` | 89 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 3.8 s / 60 ms / 0 |
| `/journey` | 89 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 3.8 s / 60 ms / 0 |
| `/basket` | 91 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 3.4 s / 80 ms / 0 |
| `/account/login` | 93 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 3.2 s / 50 ms / 0 |

\* Explore scored 98 for accessibility before the heading-order and checkbox fixes, and 100 after.

On simulated mobile, Largest Contentful Paint is set by the large photographs. Vercel's image CDN, and real (smaller) product photos when they replace the stock images, should lower it further.

### Manual checks

- Add from the market, the pantry bundle, the basket count bump and the sticky product bar.
- Checkout prompt before choosing an area.
- Concierge conditional field.
- Producer search and filters.
- Trace lookup.
- Account pages on a phone.
- Language switch.

## Functionality preserved

- Routing, cart and pricing logic, saved markets, checkout (server recalculation and idempotency), authentication, traceability, admin, localisation and every API are unchanged.
- No database migration and no data changes in this pass.

## Not done

| Item | Why | Status |
|---|---|---|
| "Available now" filter on Explore | Availability is computed per variant after the paginated query | Needs a query change |
| FAQ categories | The FAQ table has no category column | Needs a small migration plus admin field |
| In-browser QR scanning | Phone cameras already open the QR link | The guide explains this; a `BarcodeDetector` scanner could be added where supported |
| Geographic map of producers and zones | Origins have no coordinates | Lists are used for now |
| WhatsApp contact | No WhatsApp number is configured | — |
| Social links | No accounts are configured | — |
| Producer portraits and verified biographies | Need real producer material | Profiles stay labelled demo/illustrative |
| Policy texts | Need legal review | Remain DRAFT |
