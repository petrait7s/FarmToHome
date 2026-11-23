# 05 — Key Experiences

## 1. Product discovery

Discovery should feel **curated by people, not ranked by algorithm**, while still being efficient for repeat staples.

**Discovery surfaces:**

- **Curated Collections.** Editor-made sets with a story, for example "The Monsoon Kitchen", "A Bengali Fish Feast", "Pantry Foundations", "Single-Origin Honeys". Each collection has a cover image, a short essay and 6–12 products.
- **By Producer.** Browse people first. A producer card shows portrait, region, craft ("Third-generation ghee maker") and product count.
- **By Origin.** An illustrated map of the country, styled in the palette: Sky Blue land outline and Harvest Gold pins, with a Red Orange pin for "new this week". Tap a region to see its specialties and producers. This makes *Every Origin Has an Identity* tangible.
- **By Season.** A **Harvest Calendar** showing what is in season now and what is coming soon, with "Notify me" for upcoming arrivals.
- **Search.** Bilingual and forgiving: Bangla, English and transliterated Banglish ("chinigura", "চিনিগুঁড়া"). Results are grouped into Products, Producers, Origins and Stories. The empty state suggests seasonal items, never a dead end.

**Filters that reflect the brand's data:** origin region, origin class (O1/O2/O3), producer, quality grade, pack size, harvest freshness.

**Origin class O1 / O2 / O3** is shown as a small circular seal, linked to the overlapping-circle motif. Every seal links to an explainer of what the class means.

> The proposal does not define O1/O2/O3. The business needs to supply the definitions before we design the explainer.

## 2. Weekly & Monthly Markets

The signature planning feature. Name it in brand language: **"My Market"**, not "subscription".

**Concept:** a household keeps two living baskets, **Weekly** (fresh: fish, herbs, seasonal items) and **Monthly** (staples: rice, oil, lentils, spices). Each basket has a schedule, but both remain **optional and editable**.

**Screen design (My Market › Weekly / Monthly):**

- Header: plan name, next date, slot and status (e.g. "Review by Tue").
- Items grouped by category, with editorial category labels and thumbnails.
- Each row: image, name, origin eyebrow, quantity stepper and line price. Swipe to remove (app); a hover action removes on web.
- **Quantity intelligence:** an optional helper ("Household of 6 · Typical monthly rice: 25–30 kg"), based on the household profile and past orders. Always explained, always editable.
- Footer summary: item count, subtotal and delivery, then **Confirm this Market**.
- Plan controls: change frequency, change day and slot, skip the next one, pause.

**Curated Markets (by the company):** ready-made Weekly and Monthly baskets ("The Essential Monthly Market for 4"). Customers can start from one and personalise it. This lowers first-order effort.

## 3. Custom Baskets & Reorder

- **Save any basket** with a name and an optional cover ("Eid Preparation", "Ma's Kitchen", "Guests this Weekend").
- Custom baskets show as elegant cards in My Market, with a stacked-photo preview of their items.
- **One-tap Reorder** from a custom basket or past order. A review screen shows changes since last time (price changes, unavailable items with alternatives).
- **Build a Basket flow** (guided, optional): choose the occasion, then household size, then preferences. The system suggests a curated basket, which the customer can edit and save.
- **Gift Basket** (future phase): send a curated basket to another address with a handwritten-style note card.

**Interaction detail:** when adding a product, a bottom sheet asks *Add to: Current Basket · Weekly · Monthly · [Custom basket]*. The last choice is remembered, so repeat adds are one tap.

## 4. Product Traceability — "The Journey"

The heart of the brand promise. It is designed as a **beautiful, scrollable story with certificate-grade data**.

**Entry points:** QR scan · the "The Journey" section on a product page · a past order's item · web batch-number lookup.

**Batch Journey screen structure:**

1. **Header:** product image, name, `BATCH #A-2611-0419`, net weight, and the origin class seal plus quality grade.
2. **Vertical timeline**: five numbered stations, exactly the proposal's steps:
   1. **Farmer / Producer:** portrait, name, village and district, short quote. Links to the profile.
   2. **Collection & Harvest:** harvest or collection date, location, field or boat photo.
   3. **Quality Test:** tests performed and results summary, with a **View Report** link (opens a PDF in an in-app viewer).
   4. **Processing & Packaging:** facility, method (e.g. cold-pressed, sun-dried, hand-sorted) and packaging date.
   5. **QR Scan & Delivery:** packed for your household, delivered date. Closes the loop with "This pack reached you on 21 Nov".
3. **Data card** ("certificate" style): all proposal fields in a two-column definition list using tabular figures. Origin region, producer, origin class, grade, collection, harvest and packaging dates, batch number, net weight, reports.
4. **Actions:** Reorder · Follow producer · Share story · Report a concern (to the concierge).

**Visual treatment:**

- The timeline line draws progressively as the user scrolls (Sky Blue line, Harvest Gold station numerals in serif).
- Each station reveals with a gentle fade-up and slight image parallax.
- On web, the home page "Journey" section is a **pinned scroll story**: the product stays centred while the five stations pass around it.
- An optional **origin map snippet** shows the path from region to city as a single hairline curve.

**Honesty rules:** show only data that exists. If a report is pending, say "Report pending". Never fill gaps with generic copy.

## 5. Producer profiles

- A full-bleed portrait hero, name in serif, and region plus craft eyebrow.
- "In their words": a short quote in both languages.
- Story sections: land, method, season.
- **Fair-price commitment** note, worded with dignity (for example, "We pay [name] above the fair market price for every harvest"). Exact figures only if the business approves sharing them.
- Their products, plus the harvest calendar for their goods.
- Follow (notify me when their new harvest arrives).
