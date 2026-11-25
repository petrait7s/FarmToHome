# UI/UX direction

## Philosophy

FarmToHome should feel like a Bengali food house with a modern store's ease. The order of priority is:
1. clarity over decoration
2. trust over claims
3. usability over effects

Every screen should help the shopper answer five questions:
- Where does this come from?
- What am I paying for?
- How was it handled?
- Who produced it?
- How do I plan my household's shopping?

## Fixed by the owner

The colours and fonts below are fixed and are not to be changed.

**Colours (tokens in `src/styles/tokens.css`):**

| Role | Colour |
|---|---|
| Primary actions, selected states | Sapphire Blue `--red` #164A83 |
| Supporting accents | Deep Teal Green `--sky` #075B62 |
| Small premium highlights | Champagne Gold `--gold` #C6A15B |
| Body text | Charcoal Black `--charcoal` #252525 |
| Page background | Warm Ivory `--ivory` #F4EBDD |
| Cards | White `--white` |
| Borders | Soft Border `--border-soft` #E5E0D7 |
| Muted text | `--muted` #77736C |

**Text colour rule:** muted text on Ivory must use `--text-muted`, which is Charcoal at 72% opacity (about 7:1). The raw `--muted` value is only for White surfaces, where it reaches 4.7:1.

**Typography:**
- Montserrat for English.
- Tiro Bangla for Bangla, with per-glyph fallback for mixed text.
- English headings are semibold. Tiro Bangla ships one weight, so Bangla headings use more line height instead.
- No italics.
- Letter-spacing is removed for Bangla.

## Type scale

| Use | Size and weight |
|---|---|
| Display | `clamp(36px, 4.4–5vw, 64–72px)`, line-height 1.08 |
| Page title (`.h1`) | `clamp(32px, 4.4vw, 56px)` |
| Section title (`.h2`) | `clamp(26px, 3.2vw, 40px)` |
| Card title (`.h3` / product name) | 18–21 px semibold |
| Price | 19 px semibold, tabular figures |
| Per-unit price | 11.5–13 px muted |
| Body | 15.5 px English; 16.5 px Bangla, line-height 1.75 |
| Metadata | 12.5–13.5 px |
| Eyebrow | 11–12.5 px |

## Spacing, shape and depth

- **Spacing:** based on 4 px. Sections use `.section` (clamp 56–112 px). Containers have a max width of 1360 px, with 32 px gutters on desktop and 20 px on mobile.
- **Radii:** 6 / 10 / 14 px, plus pills for chips and buttons. No large blobby cards.
- **Shadows:** only for lift on hover and for floating UI (header, sticky bars, sheets).
- **Glass:** only on floating chrome laid over photography (header, tab bar, sticky add bar, hero chip). Never on content cards.

## Motion

- Use motion only to give feedback or keep the shopper oriented:
  - basket count bump
  - add confirmation
  - sheet and accordion open
  - tab slide
  - gallery fade
  - slow hero zoom
- Duration is 0.25–0.4 s on the `--ease` curve.
- Everything is disabled under `prefers-reduced-motion`.

## Navigation architecture

**Desktop:**
- Logo goes home.
- Links: Explore · Weekly Market · Monthly Stock · Our Journey · Producers.
- Icons: Search · Language · Saved markets · Account · Basket with count. Admin appears for staff only.
- Concierge and FAQ are in the footer and in the account area.

**Mobile:**
- Compact app bar with logo, search and language.
- Tab bar: Home · Explore · Basket (centre) · Market · Account.
- Swipe between tabs.

## Shopping journeys

| Journey | Path |
|---|---|
| **Weekly planner** | Choose household size (preset or custom) → browse by category → pick pack and quantity → optional suggestions → summary with delivery fee and free-delivery progress → review → checkout |
| **Monthly pantry** | Household size → optional pantry bundle (adds only on tap) → long-keeping categories only, with large packs pre-selected → monthly summary → save as a reusable list → checkout |
| **Free basket** | All products → summary → checkout. No account is needed until saving a market. |
| **Trust** | Product → origin, producer and batch → trace page timeline → producer profile → journey |

## Component inventory

**Reused, not duplicated:**

| Component | File |
|---|---|
| Header | `Header` |
| Mobile tab bar | `MobileNav` |
| Footer | `Footer` |
| Product card | `ProductCard` |
| Product gallery | `ProductGallery` |
| Product visual | `ProductVisual` (uploaded image → illustrative photo → drawing) |
| Buy box and sticky add bar | `ProductBuyBox` |
| Quantity stepper | `QuantityStepper` |
| Market planner | `MarketBuilder` (all three modes) |
| Journey steps | `JourneySteps` (photo variant) |
| FAQ list | `FaqList` |
| Concierge form | `ConciergeForm` |
| Auth layout | `AuthShell` |
| Modal / drawer, toast, skeleton, origin seal | `Modal`, `Toast`, `Skeleton`, `OriginSeal` |
| Global utilities | `.btn*`, `.badge*`, `.demo-tag`, `.rail`, `.press` |
| Photography | `src/lib/media.ts` |

New pieces added in this pass extend these components rather than adding parallel versions.
