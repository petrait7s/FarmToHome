# 06 — Motion, 3D & Premium Interactions

Motion should feel like **turning pages in a heavy, beautifully bound book**: slow, weighted and confident. Never playful or bouncy.

## 1. Motion principles

| Principle | Guideline |
|---|---|
| Purposeful | Every animation explains a change: where something came from or went to. |
| Calm | Durations of 240–480 ms for UI and 600–1200 ms for editorial reveals. No springs with overshoot. |
| Weighted easing | Standard: `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quint style). Exits: `cubic-bezier(0.4, 0, 1, 1)`, shorter by about 30%. |
| Choreographed | Stagger lists by 40–60 ms. Content leads and chrome follows. |
| Respectful | Honour `prefers-reduced-motion` and OS settings. Replace movement with opacity fades, and disable parallax and 3D tilt. |
| Performant | Animate only `transform` and `opacity`. Target 60 fps on mid-range Android devices, which matter in the target market. |

## 2. Signature interactions

1. **Add to Market.** The product image lifts slightly (scale 1.02, soft shadow), then a small duplicate glides along a curved path to the My Market tab or mini-basket bar. The count dot pulses once in Red Orange. A haptic "light impact" fires on mobile. With reduced motion: no glide, only the count update and haptic.
2. **Quantity stepper.** Numbers roll vertically (odometer style) when they change.
3. **Shared-element transitions.** The product card image morphs into the product detail hero (app native shared transitions; View Transitions API on web).
4. **Editorial reveals.** Headlines reveal line by line (mask slide-up). Images unveil with a slow clip-path wipe plus a slight scale-down from 1.06 to 1.0.
5. **Journey timeline.** A scroll-linked line draw. Station numerals count in. Images use parallax at 0.9× scroll speed.
6. **Overlapping circles motif.** On the hero, the Red Orange and Harvest Gold discs drift very slowly (±8px over 10 s, looping) and respond subtly to cursor or device tilt. The same motif becomes the **loading indicator**: the circles gently orbit and overlap.
7. **QR scan success.** The Harvest Gold corner marks contract onto the code, a soft haptic fires, and the camera view dissolves into the batch header with a shared element.
8. **Order confirmation.** A quiet celebration: the circles motif blooms behind the confirmation message, with a "basket closing" illustration. No confetti.
9. **Pull to refresh (app).** The circles motif in place of the system spinner.
10. **Bottom sheets.** Slide up with a backdrop fade to Sky Blue at 40% opacity. Drag-to-dismiss follows the finger with physics resistance.

## 3. Subtle 3D

Use 3D sparingly, as a premium accent rather than a gimmick.

- **Product pack tilt.** On hover (web) or device gyro (app, opt-in), the hero pack tilts up to ±6° with a moving specular highlight. Built from layered cut-out PNG or WebP plus CSS transforms or native layers. No heavy 3D engine needed.
- **360° / rotatable packs** for signature products (honey, ghee, rice bags): an image sequence of 24–36 frames, or a lightweight glTF model (<1.5 MB, Draco-compressed) only for hero SKUs.
- **Depth-layered heroes.** Background landscape, product and foreground ingredient (grains, spice pods, leaves) on separate layers with differential parallax.
- **Card depth.** Category and story cards rise 4–6px with a Sky Blue-tinted soft shadow on hover or press.
- **Origin map.** A slight perspective tilt on the map plane when a region is selected, with the pin "standing up".

**Constraints:** no 3D on critical buying paths (cart, checkout). Always provide a static fallback. Lazy-load 3D assets.

## 4. Micro-interactions and states

- **Buttons:** on press, scale to 0.98 and darken via an overlay (Ivory over Sky Blue at 12%). No colour change outside the palette.
- **Chips and filters:** selected state uses a Harvest Gold wash at 20% opacity, a 1px Sky Blue border and a check icon.
- **Skeletons:** Ivory base with a Sky Blue 6% shimmer. Shapes match the editorial layout.
- **Empty states:** the circles motif plus a warm, editorial line ("Your market is waiting. Start with this week's arrivals.").
- **Errors:** inline, calm and specific. A Red Orange icon with Sky Blue text and a clear recovery action.
- **Haptics (app):** light on add, success on confirm and scan, and none on scroll.

## 5. Premium service touches

- **Personal greeting** using the household name, plus the delivery context.
- **Concierge presence:** a small floating "Concierge" pill (not a generic chat bubble) on key screens.
- **Handwritten-style notes** in the editorial layer, for example a producer's signature on their profile.
- **Seasonal theming** inside the palette: the hero imagery and copy change with the harvest calendar, never the colours.
- **Sound:** none by default. An optional subtle sound on order confirmation can be considered later.

## 6. Platform notes

| Concern | Web | iOS / Android |
|---|---|---|
| Shared transitions | View Transitions API with fallback fade | Native shared element (SwiftUI `matchedGeometryEffect` / Compose shared elements), or the equivalent in a cross-platform framework |
| Scroll-linked effects | CSS scroll-driven animations / IntersectionObserver | Native scroll offset observers |
| 3D tilt | Pointer position | Gyroscope (opt-in, respects reduced motion) |
| Haptics | n/a | UIImpactFeedbackGenerator / HapticFeedbackConstants |

The tech stack is not chosen yet. These notes are for feasibility only. No implementation until design references are reviewed.
