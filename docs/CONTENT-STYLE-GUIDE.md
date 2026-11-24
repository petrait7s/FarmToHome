# FarmToHome content style guide

## 1. Brand voice

- **Positioning:** Luxury Digital Grocery Concierge
- **Promise:** Thoughtfully Sourced. Honestly Delivered.
- **Supporting line:** Every Product Has a Story. Every Origin Has an Identity.
- **Personality:** premium but not arrogant, warm but restrained, modern and rooted in Bengali food culture, transparent, clear.
- **Not:** a discount shop, a traditional grocer, or a 10-minute delivery app.

### Three writing modes

| Where | Mode | Example |
|---|---|---|
| Homepage, brand story | Editorial, concise, a little emotional | বাংলার মাঠ, নদী আর জনপদের স্বাদ—আপনার পরিবারের ঘরে। |
| Shopping, basket, checkout, account | Functional, short, unambiguous | ডেলিভারির সময় বেছে নিন |
| Producers, origin, quality, traceability | Factual, specific, open about limits | এই ব্যাচে এখনও কোনো পরীক্ষার রিপোর্ট যুক্ত নেই। |

## 2. Bangla

- Write contemporary, conversational-standard Bangla. Read it aloud. If it sounds translated, rewrite it.
- Prefer common words over Sanskritised ones: "দেখুন" not "অবলোকন করুন"; "হালনাগাদ" is acceptable, "আপডেট" also fine in UI.
- Keep familiar English terms when the Bangla is clumsier: ডেলিভারি, ব্যাচ, QR কোড, চেকআউট, অ্যাকাউন্ট, প্রোমো কোড, ক্যাশ অন ডেলিভারি.
- Do not use বিশুদ্ধ, নিরাপদ, সেরা or খাঁটি unless a record proves the claim.
- Buttons: verb at the end, 2–4 words: "বাজার সাজান", "ঝুড়িতে যোগ করুন", "অর্ডার নিশ্চিত করুন".
- Address customers as আপনি. Use the সাধু-free চলিত register throughout.
- Numbers in Bangla UI use Bangla digits through `formatNumber`. Phone numbers, batch codes and prices from the database stay as stored.

## 3. English

- Clear, restrained, international. Short sentences. One idea each.
- Avoid filler adjectives (amazing, premium-quality, best-in-class), hype and jargon.
- Sentence case for headings and buttons ("Build your market"). Product and section names are title case: Weekly Market, Monthly Stock, Build My Basket, Our Journey.
- British spelling (favourite, colour) to match existing copy.

## 4. Glossary

| Concept | English | বাংলা |
|---|---|---|
| Weekly Market | Weekly Market | সাপ্তাহিক বাজার |
| Monthly Stock | Monthly Stock | মাসিক বাজার (navigation, headings); মাসিক মজুত (pantry context) |
| Build My Basket | Build My Basket | নিজের মতো ঝুড়ি |
| Basket | Basket | ঝুড়ি |
| Market (a planned list) | market | বাজার |
| Saved market | Saved market | সংরক্ষিত বাজার |
| Origin | Origin | উৎস / উৎপত্তিস্থল (district) |
| Producer | Producer | উৎপাদক |
| Batch | Batch | ব্যাচ |
| Traceability | Know Your Origin; trace a batch | পণ্যের উৎস ও যাত্রা; ব্যাচের পরিচয় |
| Quality inspection | Quality inspection | মান যাচাই |
| Processing | Processing | প্রক্রিয়াকরণ |
| Scheduled delivery | Scheduled delivery | নির্ধারিত সময়ে ডেলিভারি |
| Delivery slot | Delivery slot | ডেলিভারির সময় |
| Concierge (the team) | the FarmToHome concierge / our team | কনসিয়ার্জ / আমাদের টিম |
| Sourced to order | Sourced after you order | অর্ডারের পর সংগ্রহ |
| Demo data | Demo data | ডেমো তথ্য |

## 5. CTA conventions

| Action | English | বাংলা |
|---|---|---|
| Start planning | Build your market | বাজার সাজান |
| Browse | Explore the market | বাজার ঘুরে দেখুন |
| Add item | Add | যোগ করুন |
| Review summary | Review my market | বাজার পর্যালোচনা করুন |
| Save list | Save market | বাজার সংরক্ষণ করুন |
| Look up batch | Trace batch | ব্যাচের পরিচয় দেখুন |
| Origin link | Know your origin | পণ্যের উৎস জানুন |
| Help | Ask the concierge | আমাদের সঙ্গে কথা বলুন |
| Checkout | Proceed to checkout | চেকআউটে যান |
| Submit order | Place order | অর্ডার নিশ্চিত করুন |

**Empty states:**
- Say what is empty.
- Then name the next useful action.

**Errors:**
- Say what happened.
- Then say how to fix it.

**Success:**
- Confirm only what the system has done.
- Example: "Order received", not "Order confirmed", until staff confirm it.

## 6. Product description format

| Field | Content |
|---|---|
| Name | The common name customers search for, plus the region when it matters: হাওরের পাবদা, সিলেটের সাতকরা. |
| Summary | One line, 4–8 words, with the most useful fact (grain, cut or use). |
| Description | Two sentences at most: what it is, and why or how a household uses it. Mention the process only when it changes the product. |
| Processing, packaging, storage, handling | Facts only, in both languages (`*Bn` columns). |
| Origin, producer, grade, origin class, harvest date, batch | Come from records. Never type them into prose. |

**Never invent:**
- harvest dates
- certifications
- test results
- producer biographies

## 7. Quality and claim rules

- **Allowed:** describe the process that was recorded, e.g. "sun-dried on raised racks", "pressed in a wooden ghani", "stone-ground in small lots".
- **Not allowed** unless a verified report or certificate is attached to the batch:
  - 100% safe
  - chemical-free
  - adulteration-free
  - organic
  - lab-tested
  - no preservatives
  - pure / খাঁটি / বিশুদ্ধ
- **Reports:** say when one exists. When none exists, say "No test report is attached to this batch yet."
- **Fair price:** always a **target**: "we aim to pay participating producers at least 30% above the conventional fair-market reference price". Never "we pay 30% more".
- **Scarcity:** say "in season" only when the product is flagged seasonal. Never "only X days left" without inventory data.
- **Demo data:** keep the Demo labels. Hide first-person quotes for demo producers.

## 8. Maintaining content

- **UI strings:**
  - edit `src/i18n/en.ts` and `bn.ts` together
  - TypeScript and `tests/unit/domain.test.ts` fail if keys differ
- **Catalogue and editorial content:**
  - edit in the admin panel (Products, Producers, Categories, Collections, Content, FAQ, Pages)
  - fill both English and Bangla fields
- **Launch values:**
  - `prisma/sylhet-launch.ts` holds contact details, zones and homepage copy
  - `prisma/content.ts` holds category, product, collection, FAQ and policy copy
  - `npm run launch:sylhet` writes both to an existing database without deleting anything
- **Policy pages:**
  - wording may be clarified
  - meaning may not change without owner and legal approval

## 9. Owner confirmation

| Item | Current state |
|---|---|
| Public e-mail address | None is published. Set `CONTACT_EMAIL` or edit it in Admin → Settings. |
| WhatsApp on 01609347600 | Footer says "call" only. |
| Concierge hours | Shown as 8 AM – 10 PM every day. Confirm this. |
| Confirmation call before packing | Copy now says "we confirm your order" and does not promise a call. |
| Fresh fish cleaned "on the morning of delivery" | Kept as the stated process. Confirm it is operationally true. |
| Refund window (24 hours with a photo) and replacement or credit | Policy pages are marked DRAFT and need legal review. |
| Delivery fees and free-delivery thresholds per zone | ৳50/৳2,000 and ৳70/৳2,500 are placeholders in the launch data. |
| Origin class definitions (O1/O2/O3) | Shown as "definition pending". |
| Quality grade scale | No published definition. |
| Fair-price target (30%) | Presented as a target. Publish achieved figures only when procurement records support them. |

## 10. Demo data to replace before launch

- **Products and prices:** all 26 products and their prices are demonstration data.
- **Producers:** all 26 profiles, their names, villages, quotes and verification status.
- **Batches and records:** batches, inspections and quality-report summaries.
- **Accounts:** the demo customer, admin and staff accounts.
- **Promo codes:** WELCOME10, WINTER100, OLD50.
- **Payments:** simulated mobile and online payment methods. Only Cash on Delivery is real.
- **Policy pages:** the DRAFT policy texts.
- **Photography:** illustrative Unsplash stock photos in `public/images` (listed at `/credits`, mapped in `src/lib/media.ts`). Producer cards use scene photos, never portraits of the named person.
