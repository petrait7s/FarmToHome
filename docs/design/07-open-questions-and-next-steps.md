# 07 — Open Questions & Next Steps

Status: **design exploration only. No UI implementation has started.** We are waiting for design references from the team before finalising the visual direction.

## 1. Questions for the business

| # | Question | Why it matters |
|---|---|---|
| 1 | Are near-black text or pure white surfaces allowed? The proposal PDF uses them, but the colour spec lists only four colours. | The current recommendation runs entirely on the four palette colours, with Sky Blue as the text colour (see [02 §2](02-visual-language.md#2-colour-system--strictly-the-proposals-palette)). |
| 2 | `#0F766E` is named "Sky Blue" but renders as a deep blue-green. Confirm the **hex** is correct. | We follow the hex. A lighter "sky blue" would change every contrast decision. |
| 3 | Red Orange is the *Primary* colour, but it does not reach the WCAG contrast needed for text or button labels on Ivory. Is it acceptable that Red Orange is the brand signature while Sky Blue drives CTAs? | Accessibility and legal compliance. |
| 4 | Definitions of Origin Class **O1 / O2 / O3** and of the quality grade scale per product. | Needed for seals, filters and explainers. |
| 5 | Brand name and logo (the proposal uses "Authentic Grocery Marketplace" as a working title). | Header, app icon and packaging continuity. |
| 6 | Pilot city, delivery areas, slot structure and cut-off times. | Area check, scheduling UI. |
| 7 | Payment methods to support. | Checkout design. |
| 8 | Concierge channels (in-app chat, phone, WhatsApp) and hours. | Support UI placement and promises. |
| 9 | Is pilot access invite-only, waitlist or open within the area? | Onboarding and the home hero. |
| 10 | Default language: Bangla-first or English-first? | Typography hierarchy, copy and layout testing. |
| 11 | Can producer identities, photos and fair-price figures be published? Are consent processes in place? | Producer profiles and the traceability journey. |
| 12 | Fish and seafood options (cleaning, cuts) and cold-chain delivery constraints. | Product options and slot rules. |
| 13 | Is web checkout required at launch, or web for discovery only and the apps for ordering? | Scope. |

## 2. What we need from your design references

When you share references, it helps to note for each one *what* you like:

- **Overall mood:** luxury food, fashion editorial, hospitality or wellness brands.
- **Typography** specimens you love (serif style especially).
- **Photography** style: light, props, people.
- **Motion** examples (sites or apps whose feel you want).
- **Specific patterns:** product pages, planners, timelines, maps.
- **Anything to avoid.**

## 3. Proposed next steps (after references)

1. **Moodboard and direction lock:** two or three directions applied to the Home hero and a Product Detail page, all within the palette.
2. **Design tokens:** colour (four values plus opacity rules), type scale (Latin and Bangla), spacing, radius, motion.
3. **Low-fidelity wireframes:** the key screens listed in [03](03-information-architecture.md).
4. **Prototype of the signature flows:** Monthly Market reorder, Scan to Journey, Add to Market.
5. **Usability test** with 5–8 pilot-profile households (Bangla and English).
6. **High-fidelity UI kit and screens**, then a developer handoff.
7. Only then: **choose the tech stack and begin implementation.**
