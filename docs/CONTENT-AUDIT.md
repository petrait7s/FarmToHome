# Content audit — November 2026

Scope: every customer-facing route, the UI dictionaries, and the database content that customers see. The admin panel is an internal English-only tool and is out of scope.

## 1. Routes inspected

| Area | Routes |
|---|---|
| Home and discovery | `/`, `/explore` (search, filters, collections), `/products/[slug]` |
| Market builder | `/market` (redirects), `/market/weekly`, `/market/monthly`, `/market/basket` |
| Trust and story | `/journey`, `/producers`, `/producers/[slug]`, `/trace`, `/trace/[batch]`, `/faq`, `/pages/[slug]` (delivery policy, refunds, privacy, terms) |
| Service | `/concierge` |
| Transactions | `/basket`, `/checkout`, `/orders/[ref]`, `/pay/[ref]/[paymentId]` (simulated) |
| Account | `/account/login`, `/register`, `/forgot`, `/reset/[token]`, `/account`, `/account/orders`, `/markets`, `/addresses`, `/profile`, `/settings`, `/favorites`, `/notifications`, `/concierge` |
| Global | header, mobile tab bar, footer, demo banner, 404 and error states, toasts |

## 2. Where content lives

- **UI copy:** `src/i18n/en.ts` and `src/i18n/bn.ts`. TypeScript requires both files to have the same keys, and a unit test checks this.
- **Editorial and catalogue content (database):**
  - categories, products, producers and collections, each with optional `*Bn` columns
  - homepage sections (`home.hero`, `home.pilot`)
  - FAQ and policy pages
  - site settings: contact details and hours
  - It is edited in the admin panel. Launch values are kept in `prisma/sylhet-launch.ts` and `prisma/content.ts`.
- **Language:** stored in the `fth_lang` cookie. `localized(row, field)` falls back to English when a Bangla column is empty.

## 3. Problems found

1. **Bangla coverage gaps:**
   - English-only fields: product descriptions (all 26), processing, packaging, storage and handling notes, producer craft, category stories, collection descriptions, FAQ (5 of 6), policy page bodies.
   - Browser tab titles are English-only.
   - Bangla customers saw English paragraphs on product, explore and FAQ pages.
2. **Unsupported claims:**
   - Category and product copy: "without chemical preservatives", "no added colour", "never polished or coloured", "never heated", "natural feed only", "no middle traders".
   - "খাঁটি" (pure) in a product name.
   - None of these is backed by a recorded test.
3. **Artificial scarcity:** "When they're gone, they're gone until next year."
4. **Fabricated quotations:** demo producer profiles show first-person quotes as if real.
5. **Location conflict:** the live database still has the earlier Dhaka pilot copy. The repository and the owner's instruction say Sylhet.
6. **Fair-price wording:** the homepage said "aim to pay above the fair market reference price" with no number. Our Journey stated the 30% target. The two were inconsistent.
7. **Operational promises not confirmed:**
   - "Your concierge will call to confirm before packing."
   - "A person reads every request."
   - "Cleaned on the morning of delivery."
8. **Terminology drift:**
   - Monthly Stock was called মাসিক মজুদ / মজুত inconsistently.
   - Batch lookup had three names: Trace a batch, Know Your Origin, ব্যাচ খুঁজুন.
   - Concierge sometimes meant a person, sometimes a page.
9. **Tone:**
   - Some Bangla read as literal translation, e.g. "সাজাই আমার সাপ্তাহিক বাজার" and "যে বাজারে আপনি ভরসা রাখেন".
   - Some English used generic phrases.

## 4. Decisions

- **Launch city: Sylhet.** The owner confirmed this. Delivery zones, pilot copy, FAQ and footer all say Sylhet.
- **Fair price:** stated everywhere as a **target** of at least 30% above the conventional fair-market reference price, never as an achieved result.
- **Producer quotations:** hidden in the storefront while a producer is marked as demo data. The text stays in the database.
- **Claims:** rewritten as process descriptions ("dried on raised racks", "pressed in a wooden ghani"), never as guarantees.

## 5. Needs owner confirmation

See the "Owner confirmation" section of `docs/CONTENT-STYLE-GUIDE.md`.
