# UX research: first impressions, scanning, trust and grocery behaviour

**Purpose:** ground FarmToHome's next design decisions in evidence rather than taste.

**Researched:** 25 November 2026.

**Evidence strength:**
- **Strong:** replicated, or large and methodical.
- **Moderate:** a single solid study or a well-documented industry benchmark.
- **Weak:** small samples, survey-only, or secondary reporting.

Several popular "UX psychology" claims did not hold up when checked. They are flagged below so we do not build on them.

---

## 1. What the evidence says

### 1.1 First impressions form almost instantly, and are driven by simplicity and familiarity

- **Instant judgement (Strong):**
  - People rate a page's visual appeal after a 50 ms glimpse.
  - Those ratings correlate highly with ratings after longer viewing (r ≈ .97).
  - Source: Lindgaard et al., *Behaviour & Information Technology*, 2006.
  - Critics note the brain keeps processing after 50 ms, so read this as "the gut verdict comes first", not "you have 50 ms".
- **Simple and familiar wins (Strong):**
  - Low visual complexity and high prototypicality (looking like what people expect from that kind of site) are preferred, measurable even at 17 ms.
  - Complexity hurts appeal even when the design is familiar.
  - Source: Tuch et al., *IJHCS* 70(11), 2012.
  - Across 450 sites and 548 raters, overall visual complexity mattered far more than colourfulness. Source: Reinecke & Gajos, 2013.

**Implication:**
- Look like a trustworthy shop at first glance: familiar e-commerce layout, search and basket where people expect them.
- Then differentiate through content (origin, producers, batches), not through unusual layouts.
- Fewer elements above the fold beats more.

### 1.2 People scan; headings and the left edge carry the page

- **F-pattern (Strong):**
  - Without strong cues, readers fixate across the top, then down the left edge.
  - Content on the right and lower down is missed.
  - Source: NN/g eye-tracking.
- **Layer-cake pattern (Strong):** clear headings and subheadings let readers scan heading by heading. This is the most efficient pattern and the one to design for. Source: NN/g text-scanning patterns.
- **Banner blindness (Strong):** anything that looks like an ad is ignored. Source: NN/g.
- **Carousels (Moderate, partly secondary):**
  - Auto-rotating carousels are often skipped, and users fail tasks even when the answer is the first slide.
  - Reported through Yale and Arkansas guidance citing NN/g; Smashing Magazine notes most implementations perform poorly.

**Implication:**
- Every section gets a meaningful heading that works on its own.
- Key facts go on the left.
- No auto-rotating banners, and nothing promotional-looking for content we want read.

### 1.3 "Fewer choices sell more" is not reliable

The jam study (6 vs 24 jams; 30% vs 3% purchase) is famous. But a meta-analysis of 50 experiments (N = 5,036) found an average effect near zero, with large variation. Scheibehenne et al., 2010.

A later meta-analysis (Chernev et al., 2015) says choice overload depends on context: it appears when choices are hard to compare, when preferences are unclear, or when the task is complex.

**Implication:**
- Do not hide the catalogue to "reduce choice".
- Make choices easy to compare: unit price, clear pack sizes, origin.
- Guide people whose preferences are unclear, e.g. "what does a family of 4 need for a week?". Clarity matters, not a small count.

### 1.4 Grocery-specific usability (Baymard Institute)

- **Unit price is essential (Moderate–Strong):** 67–86% of sites fail to show price per unit for multi-size items, forcing shoppers to calculate. Baymard recommends showing pack price and unit price together.
- **Grocery UX is generally poor; cart and checkout are weakest (Moderate):** 2025 grocery benchmark, 10 sites.
- **Substitutions are hard (Moderate):** 76% of test users had some difficulty choosing substitutions. People want control for allergy and preference reasons, so offer a simple shortcut.
- **Reorder from history is used immediately (Moderate):** in testing, a shopper started on the homepage "Past Purchases" section.
- **No available slots is a dead end (Moderate):** a test user hit "no time slots" with no alternative offered.

### 1.5 Why people abandon checkout, and what trust signals do

- **Unexpected extra costs are the top reason (Moderate; secondary reporting of Baymard data, figures vary by year):**
  - roughly 40–48% of abandoners
  - then slow delivery (~20%)
  - then not trusting the site with card details (~19%)
  - then forced account creation (~18%)
- **Trust seals help payment anxiety but do not fix cost surprises (Moderate).**

**Implication:**
- Show the delivery fee and the free-delivery threshold early: on product cards or in the header for the chosen area, not only at checkout.
- Keep guest checkout. We already do.
- Cash on Delivery reduces card-trust anxiety.

### 1.6 Traceability raises willingness to pay, but access matters more than depth

- **Willingness to pay rises (Moderate, mostly stated-preference studies):**
  - US leafy greens: median about +$1.45 for access to QR traceability (PLOS ONE, 2025).
  - Positive effects reported for beef, olive oil (94% of 1,120 respondents interested) and restaurants.
- **Reading more does not add more (Moderate):** in a European dairy study, more time spent reading the QR information did not increase willingness to pay. Having access mattered more than reading it in depth.
- **Price still dominates (Moderate):** trust in QR traceability correlates with purchase intent.

**Implication:**
- Show a short provenance summary everywhere: district, producer, batch, inspection result.
- Keep full detail one tap away.
- Do not make shoppers read to feel reassured.

### 1.7 Bangladesh context

- **Mobile first (Strong, national statistics):**
  - 72–75% of households own a smartphone (BBS, 2025).
  - About 49% of people aged 5+ use the internet.
  - Urban households are ahead (81% vs 69%).
  - Internet penetration is about 44.5% (DataReportal 2025).
- **Trust and COD (Weak–Moderate, small urban samples):**
  - Many shoppers still distrust online shopping and prefer Cash on Delivery.
  - In e-grocery, website design and financial security shape trust, and trust drives purchase intent (JUJBR survey, n = 200).
- **Food safety fear and habit (Weak–Moderate, press and interviews):**
  - The market leader built trust on food-safety assurances, responding to formalin worries.
  - Neighbourhood shops and habit are the main barrier to online grocery.
  - Inflation has squeezed online grocery spending.

**Implication:**
- Design for phones first.
- Make Cash on Delivery prominent.
- Answer food-safety worries with specific, honest process facts and batch records, not slogans. Our claim rules already require this.
- Compete with the corner shop on planning convenience and predictable scheduled delivery, not on speed.

---

## 2. Design principles derived from the evidence

| # | Principle | Based on |
|---|---|---|
| P1 | **Familiar shell, distinctive content.** Standard store layout; the difference is origin, producers and batches. | 1.1 |
| P2 | **One idea per screen section,** with a heading that makes sense alone. | 1.2 |
| P3 | **Left-load the facts:** name, origin, price and unit price first. | 1.2, 1.4 |
| P4 | **Make comparison effortless rather than reducing choice.** | 1.3, 1.4 |
| P5 | **No surprises:** fees, minimum order and delivery window visible before the basket. | 1.5 |
| P6 | **Provenance summary everywhere; depth on demand.** | 1.6 |
| P7 | **Guide the undecided:** household-based starting points, kept optional. | 1.3 |
| P8 | **Phone first, thumb reach, low data.** | 1.7 |
| P9 | **Honesty is the trust strategy:** no fake reviews, counts or scarcity. | 1.5, 1.6, 1.7 |

---

## 3. Concrete ideas for FarmToHome, in priority order

| Priority | Idea | Principles | Effort |
|---|---|---|---|
| 1 | **Delivery area and next slot in the header.** "📍 Amberkhana · next: Thu 10–12 · ৳50 delivery, free over ৳2,000", chosen once and remembered. Removes the top abandonment cause before checkout. | P5, P8 | M |
| 2 | **"Start here" two-question guide** under the hero: household size, then this week or this month. Goes straight to the right market with hints set. | P7, P2 | S |
| 3 | **Provenance line on every product card:** e.g. "Sunamganj · Abul Kashem · Batch inspected ✓" (from real records; "pending" when not inspected). | P6, P3 | S |
| 4 | **"At a glance" box at the top of the product page:** origin, producer, harvest/collection date, inspection, storage; details collapsed below. | P6, P2 | S |
| 5 | **Simplify the homepage to eight scannable sections.** The full list is in §4. Merge overlapping ones (quality + journey; planned delivery + how it works). | P1, P2 | M |
| 6 | **Reorder row for returning customers at the top of home:** "Your usual week" (saved market) and "Buy again" (past order items). | 1.4 | S |
| 7 | **Search suggestions as you type:** products with thumbnails, categories, districts, producers; Bangla and English. | P1, P4 | M |
| 8 | **Value comparison within a product:** "per kg ৳… · saves ৳… per kg vs 1 kg", calculated, never invented. | P4 | S |
| 9 | **Substitution preference per basket line:** "If unavailable: call me / remove", one shortcut for all. Needs an owner policy decision. | 1.4 | M |
| 10 | **Slot fallback:** when a date is full, suggest the next available slot inline instead of a dead end. | 1.4 | S |
| 11 | **Order-confirmation "your market's origins":** districts and producers for the order, from batch data. A memorable ending. | P6 | S |
| 12 | **Basket drawer from the header:** edit without leaving the page; free-delivery progress inside. | P5 | M |

**What we deliberately avoid:**
- carousels for key content
- promotional badges everywhere
- fake star ratings or "x customers" counts
- countdown timers or "only n left" without real stock
- hiding products to "reduce choice"

## 4. Proposed homepage order (scan path)

| # | Section | Question it answers |
|---|---|---|
| 1 | Hero: one promise, two actions, Sylhet indicator | What is this? |
| 2 | Start-here guide (household · week/month) | Which is for me? |
| 3 | This week's fresh picks: 4 cards with provenance lines | What can I buy? |
| 4 | Source → home in three steps, with link to trace | Why trust it? |
| 5 | Producers: faces and districts | Who makes it? |
| 6 | Categories | What else is there? |
| 7 | Good to know: prices, delivery, support, refunds | What are the risks? |
| 8 | Start your market | What do I do now? |

Returning, signed-in customers see the reorder row (idea 6) between sections 1 and 2.

## 5. How to measure

**Run a 5-second test with 8–10 target customers (urban Sylhet households), on phones, in Bangla.** After 5 seconds, ask:
1. What does this site sell?
2. How is it different?
3. What would you tap first?

**Track once live:**
- share of sessions reaching a market page
- basket starts per session
- checkout abandonment at the delivery step
- searches with zero results
- QR / batch page visits per order

---

## Sources

- Lindgaard et al., 2006, 50 ms first impressions: [Nature news](https://www.nature.com/news/2006/060109/full/news060109-13.html) · [paper](https://tandfonline.com/doi/abs/10.1080/01449290500330448)
- Tuch et al., 2012, visual complexity and prototypicality: [Google Research](https://research.google/pubs/pub38315/) · [blog summary](https://research.google/blog/users-love-simple-and-familiar-designs-why-websites-need-to-make-a-great-first-impression/)
- Reinecke & Gajos, 2013, colourfulness vs complexity: [paper](https://kgajos.seas.harvard.edu/papers/reinecke13aesthetics.pdf)
- NN/g, F-shaped pattern: [article](https://www.nngroup.com/articles/F-shaped-pattern-reading-web-content/) · [text scanning patterns](https://nngroup.com/articles/text-scanning-patterns-eyetracking/) · [banner blindness](https://www.nngroup.com/alertbox/banner-blindness.html)
- Carousels: [Yale usability](https://usability.yale.edu/usability-best-practices/hero-imagescarousels) · [Smashing Magazine](https://smashingmagazine.com/2016/07/ten-requirements-for-making-home-page-carousels-work-for-end-users)
- Choice overload meta-analysis: [Scheibehenne et al., 2010](https://abcwest.cogs.indiana.edu/pmwiki/pdf/scheibehenne.options.2010.pdf) · [BPS Research Digest](https://www.bps.org.uk/research-digest/less-always-more-testing-limits-choice-paradox)
- Baymard: [price per unit](https://baymard.com/research-articles/price-per-unit) · [product lists](https://baymard.com/research-articles/current-state-product-list-and-filtering) · [grocery benchmark 2025](https://baymard.com/research-articles/online-grocery-benchmark-2025) · [substitutions](https://baymard.com/research-articles/grocery-substitutions) · [cart abandonment](https://baymard.com/research-articles/cart-abandonment)
- Traceability and willingness to pay: [PLOS/PMC leafy greens](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12507238/) · [British Food Journal dairy](https://www.emerald.com/insight/content/doi/10.1108/BFJ-09-2023-0812/full/html) · [olive oil e-labels](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6915469/)
- Bangladesh: [DataReportal 2025](https://datareportal.com/reports/digital-2025-bangladesh) · [BBS via Daily Star](https://thedailystar.net/news/technology/news/mobile-phone-use-reaches-896-bangladesh-bbs-4278021) · [BBS via Dhaka Tribune](https://www.dhakatribune.com/bangladesh/415972/bbs-survey-over-57%25-of-bangladeshi-households-now) · [e-grocery trust survey (JUJBR)](https://jujbr.iba.juniv.edu/jujbr/article/download/22/18/188) · [COD and trust (Cogent, 2018)](https://doaj.org/article/b3471eb6f822464b93f2e4a904bac798) · [online grocery struggles (TBS)](https://www.tbsnews.net/dropped/startups/why-online-grocery-startups-struggle-bangladesh-1389761) · [Chaldal (TechCrunch)](https://techcrunch.com/2015/07/30/chaldal/) · [sales under inflation (FE)](https://thefinancialexpress.com.bd/trade/online-grocery-sales-shrink-under-inflation-onslaught)
