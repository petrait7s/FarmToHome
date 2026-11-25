# UI/UX audit — 25 November 2026

## Method

**What was checked:**
- 31 storefront routes, in the code and in the running app:
  - in English and Bangla
  - at 1440, 1280, 1024, 768, 430, 390 and 360 px
  - signed out and signed in (demo customer)
- Shopping paths exercised in a browser: add from the market, basket, checkout and account.
- Automated checks:
  - axe-core 4.10 for WCAG 2.0/2.1/2.2 A and AA, on 26 pages
  - an overflow and HTTP-status sweep on every route at every width
  - the existing Vitest and Playwright suites

**Constraints given by the owner:**
- Colours stay as they are: Sapphire Blue, Deep Teal Green, Champagne Gold, Charcoal Black, Warm Ivory, plus the approved neutrals.
- Fonts stay as they are: Montserrat and Tiro Bangla.

**Priority scale:**

| Level | Meaning |
|---|---|
| **Critical** | Broken, inaccessible or misleading |
| **High** | Harms the main buying journey or trust |
| **Medium** | Noticeable friction |
| **Low** | Polish |

## Summary of findings

| # | Finding | Where | Priority |
|---|---|---|---|
| 1 | Account area overflows sideways on phones: the account nav row widens the grid item | `/account/*` at ≤ 900 px | Critical |
| 2 | Muted text (#77736C) on Warm Ivory or tinted sections is 3.99–4.38:1, below the 4.5:1 AA minimum | 9 pages, 69 elements (axe `color-contrast`) | Critical |
| 3 | Checkout says "We don't deliver to this area yet" before an area has been chosen | `/checkout` | High |
| 4 | The top nav has Home and Concierge but no Producers, a core trust destination | header | High |
| 5 | No feedback on the basket counter when an item is added outside the market builder | header, tab bar | High |
| 6 | Weekly Market and Monthly Stock are the same interface; only the hero photo and pre-selected pack sizes differ | `/market/*` | High |
| 7 | Household size offers only 2 / 4 / 6 / 8+, with no custom size | `/market/*` | Medium |
| 8 | Monthly Stock has no ready-made pantry bundles, although a "Pantry foundations" collection exists | `/market/monthly` | Medium |
| 9 | The homepage has no customer-reassurance block (pricing, delivery, support, refunds) and no closing call to action | `/` | Medium |
| 10 | The hero's secondary action goes to Producers; shoppers expect a way to browse the food | `/` | Medium |
| 11 | Producers cannot be searched by name or filtered by verification status | `/producers` | Medium |
| 12 | Trace search: no guidance on QR scanning, and no inline validation of the batch format | `/trace` | Medium |
| 13 | The concierge form always shows "Order number", even for questions that have no order | `/concierge` | Medium |
| 14 | Explore has no "available now" filter. Stock is computed per variant at render time, so this needs a query change | `/explore` | Low (documented) |
| 15 | FAQ has search but no categories. The FAQ table has no category column, so a migration is needed | `/faq` | Low (documented) |

**No issues found** for:
- broken links or HTTP errors
- page errors in the console
- missing images
- missing form labels
- keyboard traps

The skip link, visible focus ring, `aria-current` on navigation, and reduced-motion handling are all present.

## Page by page

### Global (header, mobile tab bar, footer)

| Topic | Finding |
|---|---|
| **Structure** | Sticky white pill header: logo, six links, search, language, admin (staff only), saved markets, account, basket. Mobile has a floating glass tab bar (Home, Explore, Basket, Market, Account) and a compact app bar that hides on scroll. Multi-column footer. |
| **Journey** | Browsing works. Swiping between tabs works on mobile. |
| **Hierarchy** | Six text links plus five icons is busy at 1100–1360 px. |
| **UX** | Producers is missing from the main nav (Finding 4). There is no feedback when the basket count changes (Finding 5). |
| **Accessibility** | Good: skip link, labelled icon buttons, `aria-current`. |
| **Mobile** | Good. The tab bar sits clear of content because of `--bottom-nav-h`. |
| **Missing** | No animation on basket count change. |
| **Content** | Consistent across both languages. |
| **Recommendation** | Nav becomes Explore · Weekly Market · Monthly Stock · Our Journey · Producers. The logo goes home. Concierge stays in the footer, FAQ and account. Animate the count. |
| **Priority** | High |

### Home `/`

| Topic | Finding |
|---|---|
| **Structure** | Full-bleed hero, trust strip, Weekly/Monthly photo cards, seasonal carousel, category cards, producer stories, journey timeline, quality band, collections, how it works, planned delivery and saved markets, batch lookup, launch area, harvest news. |
| **Hierarchy** | Strong. The story order follows the brief. |
| **UX** | No reassurance block and no final call to action (Finding 9). The secondary hero action goes to producers (Finding 10). |
| **Accessibility** | Contrast of section leads and category descriptions (Finding 2). |
| **Mobile** | Good. Sections become swipeable rails. |
| **Content** | Counts are real database counts. Producer photos are labelled illustrative/demo. Launch zones come from live data and carry a preview label. |
| **Recommendation** | Add reassurance and closing call-to-action sections. Change the secondary action to "Explore our food". |
| **Priority** | Medium |

### Explore `/explore`

| Topic | Finding |
|---|---|
| **Structure** | Search, category chips, filter sidebar (origin, producer, season, new, featured, sort), product grid, pagination. On mobile, filters open as a bottom sheet. |
| **UX** | No availability filter (Finding 14). |
| **Accessibility** | No violations. |
| **Recommendation** | Add an "available now" filter when the query can support it. |
| **Priority** | Low |

### Weekly Market `/market/weekly`, Monthly Stock `/market/monthly`, Build My Basket `/market/basket`

| Topic | Finding |
|---|---|
| **Structure** | Photo hero, household size, mode switcher, order-steps strip, optional suggestions, category accordions with pack, quantity and unit price, and a sticky summary (mobile: bottom bar and summary sheet). |
| **UX** | The modes are visually alike (Finding 6). There is no custom household size (Finding 7) and no pantry bundles (Finding 8). |
| **Accessibility** | Steppers are labelled. Category headers expose `aria-expanded`. |
| **Mobile** | The bottom summary bar and sheet work (covered by e2e). |
| **Content** | Suggestions are clearly optional ("added only if you choose"). |
| **Recommendation** | Give Monthly a pantry identity: a pantry-bundle strip built from the existing collection that adds only when tapped, monthly wording in the summary, and a distinct accent. Add a custom household-size control. |
| **Priority** | High |

### Product detail `/products/[slug]`

| Topic | Finding |
|---|---|
| **Structure** | Gallery with "Illustrative photo" label, buy box, sticky add bar, story, details, batch card with reports, producer card, related products. |
| **Trust** | Demo badges are shown. Reports are labelled demo or verified. Pending definitions say "definition pending". |
| **Accessibility** | One contrast instance (Finding 2). |
| **Priority** | Low |

### Producers `/producers` and `/producers/[slug]`

| Topic | Finding |
|---|---|
| **Structure** | Banner, district and category filters, photo cards. The profile has a cover photo, story, fair-price note and batches. |
| **UX** | No name search and no verification filter (Finding 11). |
| **Content** | Scene photos are labelled illustrative. Demo quotes are hidden. |
| **Priority** | Medium |

### Our Journey `/journey`

| Topic | Finding |
|---|---|
| **Structure** | Photo hero, seven photo chapters, fair-price band (stated as a target), origins list, trace link. |
| **Accessibility** | 36 contrast instances, from chapter body text in muted colour (Finding 2). |
| **Priority** | Critical (contrast only) |

### Trace `/trace` and `/trace/[batch]`

| Topic | Finding |
|---|---|
| **Structure** | Search with a demo batch list. The result page has a photo hero, timeline with stage photos, identity card, reports and QR code. |
| **UX** | No QR guidance or format hint (Finding 12). Missing stages say "not recorded". |
| **Priority** | Medium |

### Concierge `/concierge` and FAQ `/faq`

| Topic | Finding |
|---|---|
| **Concierge** | Split layout with a validated form. "Order number" is always visible (Finding 13). |
| **FAQ** | Search and accordions are present. Categories need a data change (Finding 15). |
| **Priority** | Medium |

### Basket `/basket` and Checkout `/checkout`

| Topic | Finding |
|---|---|
| **Basket** | Empty state with two photo cards. The populated state shows images, pack, steppers, totals and promo code. |
| **Checkout** | Five steps on one page, summary aside, Cash on Delivery plus clearly labelled simulated methods, prices recalculated on the server. |
| **UX** | Premature "not served" message (Finding 3). |
| **Priority** | High |

### Account `/account/*` and authentication

| Topic | Finding |
|---|---|
| **Structure** | Photo split-screen for sign-in and registration. The account area has a sidebar (dashboard, orders, saved markets, addresses, favourites, notifications, concierge, profile, preferences). |
| **Mobile** | The whole account area overflows sideways (Finding 1). |
| **Priority** | Critical |

### Policies `/pages/[slug]` and Credits `/credits`

| Topic | Finding |
|---|---|
| **Structure** | Table of contents, last-updated date, DRAFT notice preserved, support link. The credits page lists every photo with its licence. |
| **Accessibility** | Contrast of the date and help text (Finding 2). |
| **Priority** | Critical (contrast only) |

## Demonstration content (unchanged, labelled)

- Products, prices, producers, batches, reports and promo codes are demo data and carry demo labels.
- Simulated payment methods are labelled as such.
- Policies are marked DRAFT.
- Photos are illustrative and listed on `/credits`.
