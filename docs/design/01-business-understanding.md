# 01 — Business Understanding

A design reading of the *Authentic Grocery Marketplace — Business Concept & Brand Identity Brief*. Every UI decision in this folder traces back to a point below.

## 1. The business in one sentence

A **luxury digital grocery concierge** that lets affluent urban households replace the daily bazaar run with a **planned weekly or monthly order** of authentic, traceable staples. The company sources directly from farmers and producers, runs its own quality control, processing and packaging, and delivers on a schedule.

## 2. Business model, as it affects design

| Proposal fact | What it means for the experience |
|---|---|
| Weekly / monthly ordering instead of daily shopping | The core unit is a **planned basket**, not a single impulse item. The UI must make planning, reviewing and reordering effortless. Fewer, larger, considered sessions. |
| Direct sourcing from farmers and producers, no middlemen | **Producers are first-class content.** They have profiles, faces, places and stories. They are not just a "brand" field on a product. |
| Pays farmers up to 30% above the fair market price | A quiet but powerful trust message. Show it with dignity (for example, "Fair-price sourcing" on producer pages). Do not show it as a discount-style badge. |
| In-house processing, QC and packaging | The company owns quality, so it can promise it. Quality grades, test reports and batch data are real and can be shown. |
| Adulteration-free, safe food (ভেজালমুক্ত) | Safety is the emotional core for the audience. Proof must sit one tap away on every product, never hidden. |
| QR traceability on every product | The physical pack connects to the digital story. Scanning a QR is a key entry point into the app, not an add-on. |
| Optional recurring orders and scheduled delivery | Subscription-like flows without subscription pressure. "Optional" is the brand stance: it gives control, not lock-in. |
| Concierge and customer support | Human help is part of the premium promise. Make it visible and personal, not a buried chatbot. |
| Pilot in one city for a limited number of households | Launch can feel **exclusive and invitation-led** ("founding households"). Capacity limits can be shown as part of the luxury, not as a weakness. |

## 3. Target customers

The proposal names three overlapping segments:

1. **Elite urban families** — elite, high-income city households.
2. **Trust and quality seekers** — people who value convenience, quality and trusted sourcing.
3. **Authentic-experience seekers** — buyers who want a genuine household grocery experience.

### Working personas (design hypotheses, to validate in the pilot)

- **The Household Planner.** Runs a multi-generation household and plans the month's staples (rice, oil, lentils, spices). Values reliability, correct quantities and an easy reorder. Often delegates the order to a household manager or staff member.
- **The Conscious Parent.** Worried about adulteration and food safety for children. Reads test reports, checks origin and wants proof.
- **The Connoisseur.** Wants specific regional and seasonal specialties: a particular shutki, a single-origin honey, aromatic rice from a named district. Treats discovery as pleasure.
- **The Gifting / Diaspora Buyer (later phase).** May order for parents in the city. Needs remote ordering and clear delivery confirmation. This is an assumption; confirm it before we design for it.

**Design implication:** two speeds of use.
- *Fast mode:* "repeat my monthly market", in a few taps.
- *Slow mode:* editorial discovery of producers, origins and seasonal arrivals.

The interface must serve both without one cluttering the other.

## 4. Product categories (7)

1. Rice & Grains
2. Fish & Seafood
3. Dried Fish (Shutki)
4. Spices & Herbs
5. Pulses & Lentils
6. Oils, Honey & Ghee
7. Regional & Seasonal Specialties

Design notes per category:

- **Staples** (rice, pulses, oils, spices) are bought in volume and repeated. They suit basket planning, size and weight selectors, and "monthly quantity" suggestions.
- **Fish & Seafood** is perishable. It needs freshness cues (catch or collection date), cut and cleaning options, cold-chain messaging, and a delivery-slot dependency.
- **Shutki** has a strong regional identity and some trust stigma (chemical treatment concerns). Traceability and process transparency are especially valuable here and can set the brand apart.
- **Oils, Honey & Ghee** are high-value and gift-worthy. They suit rich product photography and origin storytelling (hive region, flower source, churning method).
- **Regional & Seasonal** is the "editorial" category. It drives limited drops, harvest calendars and anticipation.

## 5. Sourcing and operations flow

The proposal's five-step chain: **Farmer/Producer → Collection & Harvest → Quality Test → Processing & Packaging → QR Scan & Delivery.**

Data the proposal says will exist for every product:

- Story & Origin: production story and origin region
- Identity: farmer or producer identity
- Origin Class: **O1 / O2 / O3**
- Quality: product-specific quality grade
- Processing: processing and packaging information
- Dates: collection, harvest and packaging date
- Batch: batch number and net weight
- Reports: QR code and relevant quality test reports

This is a rich, structured data set. The traceability experience (see [05](05-key-experiences.md#4-product-traceability--the-journey)) should be designed around this exact schema.

## 6. Platform scope

Web, Android and iOS. The proposal groups features into four pillars, which map naturally onto app navigation:

| Pillar | Features |
|---|---|
| **Discover** | Curated collections and product discovery · Our producers and product origins |
| **Plan** | My Market / Household Basket · Weekly Market and Monthly Market · Custom Basket and Reorder |
| **Deliver** | Scheduled delivery · Optional recurring orders |
| **Trust & Support** | QR-based traceability · Concierge and customer support |

## 7. Brand positioning

- **Positioning:** Luxury Digital Grocery Concierge
- **Promise:** *Thoughtfully Sourced. Honestly Delivered.*
- **Core message:** *Every Product Has a Story. Every Origin Has an Identity.*
- **Vision:** A trusted authentic grocery ecosystem connecting responsible producers with quality-conscious households.

Translated into experience qualities:

- **Thoughtful** — curated, never overwhelming; fewer products, shown better.
- **Honest** — real data, real people, real dates; no fake urgency or dark patterns.
- **Storied** — every product page reads like a short editorial feature.
- **Concierge** — the app anticipates (reminders, suggested quantities, a saved household profile) and a human is always reachable.

## 8. Language

The proposal is bilingual: Bangla body copy with English headings and labels. The product should be **bilingual by design (বাংলা / English)**, with typography chosen to make both scripts look equally premium. See [02](02-visual-language.md#3-typography).
