# 02 — Visual Language

Luxury minimalism with an editorial voice. The product should feel like a beautifully printed food journal that you can shop from.

## 1. Design principles

1. **Quiet luxury.** Generous whitespace (ivory space), restrained colour and few elements per screen. Luxury comes from what we leave out.
2. **Editorial over catalogue.** Large serif headlines, numbered sections ("01 — Origin", as the proposal itself does), pull-quotes from producers and asymmetric image layouts. Avoid dense marketplace grids.
3. **Proof is beautiful.** Traceability data is designed as content, like a wine label or a certificate, not hidden in a spec table.
4. **Product as hero.** Rich, close-up, naturally lit photography. Grain texture, oil viscosity, fish freshness. Imagery carries the colour; the UI recedes.
5. **Calm motion.** Animations are slow, eased and purposeful. Nothing bounces or flashes.
6. **Honest interface.** No countdown timers, fake scarcity or pre-ticked upsells. Real limits (pilot capacity, seasonal stock) are stated plainly.

## 2. Colour system — strictly the proposal's palette

| Token | Name (as in proposal) | Hex | Proposal role |
|---|---|---|---|
| `--color-primary` | Red Orange | `#FF4B33` | Primary |
| `--color-secondary` | Warm Ivory | `#F4F1EA` | Secondary |
| `--color-accent` | Sky Blue | `#0F766E` | Accent |
| `--color-highlight` | Harvest Gold | `#DDAA72` | Highlight |

**Rules:**

- **No other hues.** No Forest Green or any other added colour. Only these four values are used.
- **Hex is authoritative.** The proposal names `#0F766E` "Sky Blue", but the value renders as a deep blue-green. We always use the **hex value** and keep the proposal's name in tokens and docs, so it is never "corrected" to a lighter blue.
- **Tonal variation comes only from opacity of these four colours** over the ivory or accent ground (for example, Sky Blue at 12% for dividers, Harvest Gold at 20% for a selected-chip wash). No new hex values.

### 2.1 Accessibility reality check (WCAG 2.2 contrast)

Measured contrast between the palette pairs:

| Pair | Ratio | Use allowed |
|---|---|---|
| Sky Blue `#0F766E` on Warm Ivory `#F4F1EA` | **4.85 : 1** | Body text, UI text, icons, buttons (passes AA) |
| Warm Ivory on Sky Blue | **4.85 : 1** | Text on dark sections, primary button labels (passes AA) |
| Red Orange `#FF4B33` on Warm Ivory | 2.95 : 1 | **Not for text.** Decorative shapes, dots, rules and illustration only |
| Warm Ivory on Red Orange | 2.95 : 1 | **Not for text labels**, including on buttons (just below the 3:1 large-text threshold) |
| Harvest Gold `#DDAA72` on Warm Ivory | 1.85 : 1 | Decorative only (hairlines, numerals as ornament, washes) |
| Sky Blue on Harvest Gold | 2.62 : 1 | Decorative only |
| Red Orange on Sky Blue / Harvest Gold | ~1.6 : 1 | Never pair for meaning |

**Key insight:** with only these four colours, **Sky Blue and Warm Ivory carry all readable content.** Red Orange is the brand's *signature* (energy, the sun or harvest disc from the cover), not the text or button colour.

### 2.2 Colour roles

| Role | Colour |
|---|---|
| Page background | Warm Ivory |
| Primary text, headings, icons | Sky Blue |
| Immersive and dark sections (hero, story, the vision, footer) | Sky Blue background with Ivory text, as on the proposal cover |
| Primary CTA ("Add to Market", "Confirm Delivery") | Sky Blue fill with Ivory label |
| Secondary CTA | Ivory with a 1px Sky Blue outline and Sky Blue label |
| Brand signature | Red Orange: hero discs, the "fresh / new arrival" dot, active-tab indicator bar, cart-count dot (the number sits beside it in Sky Blue), small illustration accents |
| Highlight | Harvest Gold: section numerals, hairline rules, origin-class seals, premium and seasonal markers, selected-state washes, the italic accent word in headlines (on Sky Blue grounds only, as on the cover's "Marketplace") |
| Status: error / attention | Red Orange **icon plus Sky Blue text message**. Never colour alone. |
| Status: success | Sky Blue check icon plus text |
| Focus ring | 2px Sky Blue with a 2px Ivory offset (meets 3:1 non-text contrast) |

> **Open decision for the team:** the proposal's own PDF uses white cards and a near-black body text, but neither is in the specified palette. The recommendation above avoids both and runs fully on the four colours. If you want a darker ink for long-form reading, or pure white surfaces, please approve it explicitly first.

### 2.3 Composition ratio (guideline)

Roughly **70% Warm Ivory · 20% Sky Blue · 6% Harvest Gold · 4% Red Orange.** Red Orange is powerful at a small dose and loud at a large one. Its one large-scale use is the editorial hero shape, echoing the proposal cover's overlapping circles.

## 3. Typography

The proposal pairs a **high-contrast serif** for headings with a clean sans-serif for labels and small-caps tracked eyebrows ("P R O J E C T  P R O P O S A L"). Keep that pairing.

| Use | Recommendation (final pick after your references) |
|---|---|
| Display and headings (Latin) | A refined transitional or Didone serif, for example *Cormorant*, *Playfair Display* or *Fraunces* (variable, with optical sizes), or a licensed editorial face |
| Display and headings (Bangla) | *Noto Serif Bengali* or *Tiro Bangla*, matched in weight and size to the Latin serif |
| UI and body (Latin) | A humanist or geometric sans, for example *Inter*, *DM Sans* or *Manrope* |
| UI and body (Bangla) | *Hind Siliguri*, *Noto Sans Bengali* or *Anek Bangla* |
| Data and traceability (batch numbers, dates, weights) | Tabular figures; optionally a mono such as *JetBrains Mono* or *IBM Plex Mono* for the "certificate" feel |

**Rules:**

- **Eyebrows:** uppercase, 11–12px, letter-spacing 0.2em, Sky Blue. Numbered like the proposal: `05 — TRANSPARENCY`.
- **Headline scale:** fluid. Web hero 56–96px; app hero 34–40px. Tight leading (1.05–1.1). An italic or Harvest Gold accent word is allowed on Sky Blue grounds.
- **Body:** 16–18px web, 15–17px app, line height 1.6 (Bangla needs about 10% more line height than Latin).
- **Bangla:** Bangla glyphs sit visually smaller, so scale them about 1.08× against Latin at the same nominal size.
- Use **real numerals in Bangla mode** (৳ ১,২৫০) when the locale is Bangla.

## 4. Layout and grid

- **Web:** 12-column grid, max content width about 1320px, 24–32px gutters. Editorial sections alternate between full-bleed imagery and narrow text columns (about 640px measure).
- **App:** 4-column grid, 20px margins, 8pt spacing scale.
- **Spacing scale:** 4, 8, 12, 16, 24, 32, 48, 64, 96, 128. Premium layouts use the large end generously between sections (96–128 web, 48–64 app).
- **Radius:** soft and consistent. 16–20px on cards, 999px on pills and chips, 28px on bottom sheets. The proposal's cards use a modest radius with a coloured top edge; reuse that "coloured top rule" motif for category and phase cards.
- **Rules and dividers:** 1px hairlines in Sky Blue at about 12% opacity, or Harvest Gold.
- **Elevation:** almost flat. Use very soft, diffuse shadows tinted with Sky Blue at low opacity (no grey or black shadows), plus layering, rather than heavy drop shadows.

## 5. Imagery and art direction

- **Photography:** natural daylight, shallow depth of field, textured surfaces (jute, clay, wood, banana leaf, brass). Hands of producers. Fields, rivers, ghats and drying racks for shutki.
- **Product cut-outs:** consistent 3/4 angle on a transparent background for packs. This enables subtle 3D tilt and parallax (see [06](06-motion-and-interaction.md)).
- **Producer portraits:** dignified, environmental and consented. Never staged poverty imagery. Producers are partners.
- **Grading:** warm, slightly lifted shadows. Image colour harmonises with Ivory and Gold. Avoid oversaturated greens in the grade, so photography does not introduce a competing palette.
- **Illustration and graphic motif:** the proposal cover's **overlapping circles** (Red Orange disc, Harvest Gold disc, Ivory outline ring) become the brand graphic device. Use them for heroes, loading states, empty states and section transitions.
- **Iconography:** 1.5px line icons with rounded joins, in Sky Blue. A custom set for the 7 categories.

## 6. Packaging continuity

The physical pack (QR, batch, origin class) and the digital product page should share one layout language: the same seal for O1/O2/O3, the same certificate typography and the same numbering. Scanning the pack should feel like **opening its digital twin**.
