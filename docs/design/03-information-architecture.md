# 03 — Information Architecture & Screen Structure

## 1. Navigation model

The four proposal pillars (Discover, Plan, Deliver, Trust & Support) map onto primary navigation. A dedicated **Scan** action reflects how central QR traceability is.

### Mobile apps (Android and iOS): bottom tab bar, five items

| Tab | Purpose | Pillar |
|---|---|---|
| **Home** | Editorial feed: this week's arrivals, seasonal stories, quick "repeat market" | Discover |
| **Explore** | Categories, producers, origins and search | Discover |
| **Scan** (centre, raised) | QR scanner, opens a product's journey | Trust |
| **My Market** | Household basket, weekly and monthly plans, custom baskets | Plan |
| **Account** | Deliveries, schedule, household profile, concierge | Deliver / Support |

The cart is not a tab. **"My Market" is the basket**, so planning and buying stay one concept. A persistent mini-basket bar sits above the tab bar when items are present (item count, total, "Review").

The active tab uses a Sky Blue icon and label plus a short Red Orange indicator bar.

### Web: top navigation

`Logo · Markets · Shop (mega-menu: 7 categories) · Producers · Origins · Our Story ……… Search · Concierge · Account · My Market (count)`

- The header is transparent over the hero, then becomes Ivory with a hairline on scroll.
- The mega-menu is editorial: each category has an image, a one-line story and a featured producer.

## 2. Sitemap

```
Home
├── Markets
│   ├── Weekly Market (curated)
│   ├── Monthly Market (curated)
│   └── Seasonal / Regional drops
├── Shop
│   ├── Rice & Grains
│   ├── Fish & Seafood
│   ├── Dried Fish (Shutki)
│   ├── Spices & Herbs
│   ├── Pulses & Lentils
│   ├── Oils, Honey & Ghee
│   └── Regional & Seasonal Specialties
│       └── Product Detail
│           ├── Story & Origin
│           ├── Producer
│           ├── Traceability Journey (5 steps)
│           └── Quality Reports
├── Producers
│   └── Producer Profile (story, region, products, fair-price note)
├── Origins (map)
│   └── Origin Region (district, specialties, producers)
├── Traceability
│   ├── Scan QR (app) / Enter batch number (web)
│   └── Batch Journey
├── My Market
│   ├── Household Basket (current)
│   ├── Weekly Plan · Monthly Plan
│   ├── Custom Baskets (saved)
│   └── Reorder history
├── Checkout
│   ├── Review market
│   ├── Delivery slot & schedule (+ optional recurrence)
│   ├── Address & delivery notes
│   ├── Payment
│   └── Confirmation
├── Account
│   ├── Upcoming deliveries / tracking
│   ├── Recurring orders (pause / skip / edit)
│   ├── Household profile (size, preferences, dietary needs)
│   ├── Addresses · Payment methods
│   ├── Language (বাংলা / English)
│   └── Concierge & Support
└── Our Story · Sourcing Promise · Fair-Price Commitment · FAQ
```

## 3. Key screens (structure only)

### 3.1 Home (app)

1. **Greeting and delivery context:** "Good morning, [Family name] · Next delivery Thu, 9–11 AM". Tap to manage.
2. **Repeat Market card** (fast mode): "Your Monthly Market · 18 items · ৳ —", with **Review & Reorder** (Sky Blue CTA).
3. **This Week's Arrivals:** large editorial carousel of full-bleed images (new harvests, a fresh catch).
4. **Story of the Week:** a producer feature with portrait, pull-quote and "Meet [name]".
5. **Shop by Category:** 7 tiles with custom line icons and photography.
6. **Seasonal calendar teaser:** "Arriving soon: Aman rice, Sundarbans honey".
7. **Trust strip:** "Every product traceable · Scan any pack".

### 3.2 Home (web)

1. **Hero:** Sky Blue ground, large serif headline (*Every Product Has a Story.*), overlapping-circle motif and a hero product with subtle parallax. Two CTAs: *Start Your Market* · *Meet Our Producers*.
2. **Brand promise band:** "Thoughtfully Sourced. Honestly Delivered." in a three-up layout (Direct sourcing · Tested & processed in-house · Delivered on your schedule).
3. **Weekly / Monthly Market** feature with an explanation of how planning works.
4. **The Journey:** a scroll-driven 5-step farm-to-home story (see [05 §4](05-key-experiences.md#4-product-traceability--the-journey)).
5. **Categories:** editorial grid.
6. **Producers:** horizontal portraits.
7. **Origins map** teaser.
8. **Pilot invitation:** "Now welcoming founding households in [City]" with a waitlist or invite form.
9. **Footer** on Sky Blue.

### 3.3 Category listing

- Editorial header: category image, a 2-line story and origin highlights.
- Filter chips: Origin region · Origin class (O1/O2/O3) · Producer · Pack size · Seasonal.
- Products in a **2-column app grid / 3–4 column web grid** with generous spacing. Every 6–8 products, an **inline story card** (producer or process) breaks the grid in a magazine rhythm.
- Sort: Curated (default) · New harvest · Price.

### 3.4 Product card

- Product image on Ivory (pack cut-out, or the raw product for fish).
- Origin line in an eyebrow style: `NAOGAON · O1`.
- Product name in serif, then net weight.
- Price.
- Quick add (+). Once added, it becomes a quantity stepper.
- A small Red Orange dot means "new harvest / fresh arrival" (with a text label for accessibility).

### 3.5 Product detail page

Ordered as an editorial article, with buying always reachable:

1. **Hero gallery:** large imagery, subtle 3D pack rotation (drag to rotate a pack 3D or 360° image set), lifestyle shots.
2. **Title block:** origin eyebrow, serif name, producer name (linked), origin class seal, quality grade.
3. **Buy block:** size or weight selector, quantity, price per kg, **Add to Market** plus **Add to Weekly / Monthly plan** (sticky bottom bar on mobile).
4. **The Story:** production story with a pull-quote from the producer.
5. **Meet the Producer:** portrait card, linked to the profile.
6. **The Journey:** compact 5-step traceability timeline for the current batch.
7. **Quality & Safety:** grade explanation, test report thumbnails (PDF viewer) and an adulteration-free statement.
8. **Details:** processing and packaging, storage, cooking notes.
9. **Pairs well with / From the same origin.**

### 3.6 My Market

Tabs or segmented control: **Current Basket · Weekly · Monthly · Custom Baskets**. Details in [05 §2–3](05-key-experiences.md#2-weekly--monthly-markets).

### 3.7 Checkout (3 steps, never more)

1. **Review** (grouped by category, with substitution preferences)
2. **Schedule** (date and slot, recurrence toggle, notes for household staff)
3. **Pay** (saved methods; local payment methods to be confirmed by the business)

Then a **Confirmation** screen: a calm, celebratory moment with a delivery summary and an option to save the basket as a Custom Basket.

### 3.8 Scan / Traceability

Full-screen camera with a minimal frame (Harvest Gold corner marks). On success, a smooth transition into the **Batch Journey** screen. On web, enter the batch number instead.

### 3.9 Account / Concierge

- **Concierge** is presented as a named human service ("Your concierge") with chat, call-back request and WhatsApp/phone options (channels to be confirmed).
- Delivery management: upcoming orders, live status on delivery day, skip or pause recurring orders.
