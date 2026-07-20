# Reloka — Product & System Reference

> **Audience:** an external AI system or developer that has never seen Reloka
> and needs to understand it *completely and quickly*. This document is the
> single source of truth for **what Reloka does, what information it collects,
> what it does with that information, and what it shows the user.** Everything
> here is derived from the actual source in this repo (`github.com/nkrshv/relo`);
> anything that depends on runtime configuration is called out explicitly.
>
> - **Product name:** Reloka
> - **Production URL:** `https://reloka.to`
> - **Repo:** `github.com/nkrshv/relo`
> - **Local path:** `/home/ubuntu/relochecklist`
> - **Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, deployed on Vercel.

---

## 1. What Reloka is (in one paragraph)

Reloka is a **relocation-planning web app**. A person tells it where they are
moving *from* and *to*, plus their situation (who is moving, citizenships, visa
status, timeline, budget, priorities, free-text notes, optional age). Reloka
returns a **personalized, phased relocation checklist** that names the *real*
institutions, documents, deadlines, task dependencies and common costly mistakes
for that exact origin→destination route. Every country fact shown alongside the
plan is drawn from open/official data and is labeled with a source and, where
relevant, a "last verified" date. The first phase of the checklist is free; the
rest is unlocked with a one-time **$9** payment. Plans are saved at a permanent,
unguessable URL so the buyer can reopen them on any device and resume progress.

The core user-facing promise (landing copy, `src/app/page.tsx`):

> "Move to [city] without the 3am panic research. Get a relocation checklist
> built for your exact situation. Real office names, real documents, real
> deadlines. Not another generic listicle."

### What Reloka is NOT
- **Not legal, tax, or immigration advice.** Stated explicitly in the UI and
  legal pages; users are told to verify against the named official sources.
- **Not a marketplace or a single-provider funnel.** The *neutral* relocation
  content never recommends one private provider as "the" choice — neutrality is
  enforced in the generation and critic prompts (see §7). Commercial partner
  links exist but are a **separate, explicitly-labeled affiliate layer** (§8).
- **Not an account product.** There is **no registration, no login, no
  password, no user profile database.** A user is never asked to identify
  themselves. Identity-free capability links (§6) replace accounts.

---

## 2. Product surfaces (routes)

| Route | File | Purpose |
|---|---|---|
| `/` | `src/app/page.tsx` | Marketing landing: hero, pains, how-it-works, features, FAQ, popular destinations. CTAs → `/plan`. |
| `/plan` | `src/app/plan/page.tsx` → `ReloApp` | The product: intake form → generation → checklist. |
| `/plan/[slug]` | `src/app/plan/[slug]/page.tsx` → `SavedPlan` | A saved plan opened by its permanent capability link. `noindex`. |
| `/moving-to/[country]` | `src/app/moving-to/[country]/page.tsx` | 38 SEO landing pages (one per curated destination), static, embedding the app pre-filled to that destination. |
| `/compare/[pair]` | `src/app/compare/[pair]/page.tsx` | Side-by-side country comparison (e.g. `/compare/spain-vs-armenia`). |
| `/compare` | `src/app/compare/page.tsx` | Compare index / directory. |
| `/legal/*` | `src/app/legal/*` | Privacy policy, terms of service, refund policy. |
| `/api/generate` | `src/app/api/generate/route.ts` | Generates and saves the plan (OpenAI). |
| `/api/plan/[slug]` | `.../api/plan/[slug]/route.ts` | GET a saved plan (email-stripped). |
| `/api/plan/[slug]/progress` | `.../progress/route.ts` | GET/PUT checklist progress for a plan. |
| `/api/checkout` | `src/app/api/checkout/route.ts` | Creates a Lemon Squeezy checkout (or dev-unlock). |
| `/api/webhooks/lemonsqueezy` | `.../webhooks/lemonsqueezy/route.ts` | Verified payment webhook: marks plan paid, emails link. |
| `/api/climate-twin` | `src/app/api/climate-twin/route.ts` | Live home-vs-destination climate + air quality. |
| `/api/city` | `src/app/api/city/route.ts` | Live per-city climate/AQI/timezone lookup. |
| `/api/feedback` | `src/app/api/feedback/route.ts` | Stores a small feedback entry in Vercel Blob. |
| `/llms.txt`, `/api/indexnow`, `/robots.txt`, `/sitemap.xml` | respective route files | SEO/GEO plumbing. |

---

## 3. What information Reloka collects

There are three distinct collection channels: the **intake form** (the only
place the user deliberately types data), **payment data** (only if the user
pays), and **technical/analytics** signals.

### 3.1 Intake form (`ReloForm` → `ReloInput` in `src/lib/types.ts`)

Every field below is what the user can enter. Only origin and destination
country are required; everything else is optional and, when supplied, visibly
changes the plan.

| Field (`ReloInput`) | Required | Type | Example | Notes |
|---|---|---|---|---|
| `fromCountry` | **yes** | country name | "Netherlands" | Must be a known country; must differ from `toCountry`. |
| `toCountry` | **yes** | country name | "Portugal" | Same-country routes are rejected (HTTP 400). |
| `fromCity` | no | string | "Amsterdam" | Enables live origin climate/timezone and origin office links. |
| `toCity` | no | string | "Lisbon" | Enables city-level climate/AQI/timezone, city-aware headline & prompt, hotel price. |
| `profile` | yes (defaults `solo`) | `solo`/`couple`/`family`/`nomad`/`student` | "nomad" | Reshapes the plan (see §2 profile table). |
| `age` | no | number (0–120) | 34 | Free-text-free numeric; personalizes plan and drives nomad insurance price (§8). |
| `citizenships` | no | list of country names | ["Netherlands"] | Visa verdict is computed on the **strongest** passport held; empty ⇒ `fromCountry` used as proxy. |
| `visaStatus` | no | free text | "D7 applicant, not sure yet" | Treated as data, never instructions. |
| `timeline` | no | free text | "moving in 2 months" | Drives deadline framing. |
| `priorities` | no | multi-select | ["Housing","Taxes"] | 10 options; each reshapes the plan (e.g. Pets forces pet-import task). Capped at 12 server-side. |
| `budget` | no | free text | "tight, ~$5k" | **Excluded** from analytics events. |
| `notes` | no | free text | "bringing a dog, remote job, two kids" | **Excluded** from analytics events. |

The five **profiles** and how they change the plan:

| Profile | Value | What changes |
|---|---|---|
| Solo | `solo` | Baseline residence-permit framing. |
| Couple | `couple` | Partner considerations. |
| Family with kids | `family` | Mandatory school/kindergarten enrolment + child healthcare/vaccination items. |
| Digital nomad | `nomad` | Mandatory tax-residency (183-day) item + "does the visa permit remote work"; unlocks the nomad health-insurance partner card (§8). |
| Student | `student` | Student residence conditions, enrolment confirmation, student health insurance. |

The 10 **priorities** (`PRIORITY_OPTIONS`): Housing, Banking, Healthcare &
insurance, Residency & registration, Taxes, Phone & internet, Pets, Kids &
schooling, Driving license, Community & language.

### 3.2 Payment data (only if the user chooses to pay)

Reloka never asks for card details itself. Checkout is hosted by **Lemon
Squeezy**. From a *verified* payment webhook, Reloka receives and stores
server-side exactly two things tied to the plan: the **buyer email**
(`user_email`) and the fact/time of payment. The plan's own capability `slug`
is passed to Lemon Squeezy as checkout `custom` data so the webhook can match
the payment back to the right plan. The buyer email is **server-only and never
returned to any GET caller** (§6).

### 3.3 Technical & analytics signals

- **IP address** — used transiently for rate limiting (`clientIp` in
  `/api/generate` and `/api/feedback`); not stored with the plan.
- **Product analytics (Mixpanel, EU residency)** — **consent-gated**: nothing is
  sent until the visitor accepts analytics cookies (`reloka-consent = granted`).
  Mixpanel is initialized opted-out by default (`src/lib/analytics.ts`). Events
  and their properties are deliberately **non-PII**:
  - `Plan Generation Started` → `{ fromCountry, toCountry, profile }` only (budget/notes/visa deliberately excluded).
  - `Plan Generation Succeeded` / `Plan Generation Failed` (`{ status_code, error_type }`).
  - `Plan Page Viewed`, `Paywall Viewed`, `Unlock Clicked`, `Plan Unlocked`, `Plan Link Copied`, `Plan Exported` (`{ format }`).
- **GTM** (`GTM-TK4LCSRM`, inlined server-side in `layout.tsx`), **Vercel
  Analytics**, and **Speed Insights** — page-level analytics, also under Google
  Consent Mode v2 (`CookieBanner`).
- **Feedback** (`/api/feedback`) — the only free-form user submission stored
  server-side, as a small JSON blob in Vercel Blob (rate-limited 10/hour/IP,
  200-char cap).

---

## 4. What Reloka does with the information

### 4.1 Plan generation pipeline (`/api/generate`) — the heart of the product

1. **Config & hardening.** Requires `OPENAI_API_KEY` (else HTTP 503). Per-IP
   rate limit **5 requests/hour**. Every string field capped to 500 chars,
   `priorities` capped to 12. Origin and destination must both be present and
   different (same-country ⇒ HTTP 400). All user text is treated as **data, not
   instructions** (prompt-injection guard).
2. **Grounding blocks** are assembled from curated + open data for the
   destination (`buildUserContent`): travel advisory (US State Dept), short-stay
   visa rule (Passport Index), climate summary, public holidays, inflation
   (World Bank), life expectancy (WHO), Big Mac index, internet speed (Ookla),
   electricity/plugs, English proficiency (EF), driving side, calling code,
   timezone, Eurostat price level, OECD tax wedge, air quality (WAQI), real OSM
   office names, universities (Hipolabs), verified country facts, pre-arrival
   requirements (e.g. TDAC/ETA/ESTA), origin pre-departure credentials, Hague
   apostille vs consular legalization rules, and typed tax/residency regimes.
   These are labeled "ground truth" and instructed to override the model's
   training data.
3. **Two OpenAI passes** (`gpt-4o`, `response_format: json_object`):
   - Pass 1 (`SYSTEM_PROMPT`): draft plan.
   - Pass 2 (`CRITIC_PROMPT`): a "merciless editor" that rewrites generic advice
     into destination-specific substance, enforces the mandatory modules, and
     audits personalization. Falls back to the draft on any failure.
4. **Normalization** (`normalizePlan`): parses/validates the JSON, strips
   commercial URLs (only official root domains survive), strips **listing-portal
   names and URLs from housing/accommodation tasks** (rental-scam neutrality),
   drops filler "common mistakes", and **breaks dependency cycles**.
5. **Deterministic safety-net blocks** are then applied server-side so critical
   modules are never silently dropped by the model: flight-price hint, travel
   eSIM row, nomad health-insurance card (nomad only), short-term-accommodation
   nightly hotel price + booking link, digital/financial continuity (2FA),
   home-insurance wind-down, medication import, and the apostille/legalization
   rule.
6. **Persistence & response.** When a shared store is configured (`limiterConfigured()`),
   the route **mints a 128-bit unguessable `slug`** and saves the full record to
   KV/Redis (see §6). It responds with `{ input, plan, visa, slug }`. The client
   then rewrites the URL to `/plan/{slug}` so refresh/share resolves to the saved
   copy.

### 4.2 What is sent to third parties, and why

| Data | Sent to | Purpose |
|---|---|---|
| Full `ReloInput` (incl. notes/budget) + grounding text | **OpenAI** (`api.openai.com`, `gpt-4o`) | Generate & critique the plan. |
| Plan `slug` (as checkout `custom`) | **Lemon Squeezy** | Match a payment back to the plan. |
| Buyer email + `slug` | **Resend** (`send.reloka.to`) | Email the permanent plan link after payment. |
| `{ fromCountry, toCountry, profile }` + funnel events | **Mixpanel (EU)** | Consent-gated product analytics (no PII). |
| Page views | GTM / Vercel Analytics / Speed Insights | Consent-gated web analytics. |
| Destination city / country | Open-Meteo, WAQI/OpenAQ, Hotels.nl, Travelpayouts, Genki MCP | Live climate/AQI, hotel price, flight price, insurance price (see §8, §10). |

### 4.3 Payment & unlock flow (server-enforced)

The paywall is **server-side**, not honor-system:

- Phase 1 (`before`) is always **free and fully visible**; phases 2–5 render
  **blurred/locked** with an "Unlock full plan for $9" CTA.
- Unlock click → `POST /api/checkout` with the plan `slug`:
  - **If Lemon Squeezy is configured** (`LEMONSQUEEZY_API_KEY` + `STORE_ID` +
    `VARIANT_ID`): creates a hosted checkout with `custom.slug` and a
    `redirect_url` of `/plan/{slug}?paid=1`; the browser is sent to Lemon
    Squeezy.
  - **If not configured:** returns `{ devUnlock: true }` and the client unlocks
    locally (keeps the product demoable).
- After payment, Lemon Squeezy calls `/api/webhooks/lemonsqueezy`. Every payload
  is **HMAC-SHA256 verified** against `LEMONSQUEEZY_WEBHOOK_SECRET` over the raw
  body; unverified requests are rejected (401). On `order_created` the server
  flips the plan's `paid` flag (the **only source of truth** for unlock), stores
  the buyer email, and sends the permanent-link email **once** (idempotent via
  `emailedAt`). `order_refunded` flips `paid` back off.
- On return to `/plan/{slug}?paid=1`, `SavedPlan` polls `GET /api/plan/{slug}`
  until `paid: true`, then reveals the locked phases.

### 4.4 Cross-device checklist progress

Ticking a checkbox on a saved plan persists to `PUT /api/plan/{slug}/progress`
(`{ checked: { "<phaseIndex>:<itemIndex>": true } }`), stored under
`relo:progress:{slug}`, separate from the plan record so ticking never
rewrites the plan or its TTL. Anyone holding the link can read/update progress
(same capability model as the plan). This is what lets a user close the tab and
resume on another device.

---

## 5. What Reloka shows the user

### 5.1 The plan (`ChecklistView` / `SavedPlan`)
- **Header:** route headline (flags + cities), a plain-language **visa answer**
  ("your X passport gets you in visa-free…"), destination summary, and a
  **feasibility banner** (`ok`/`caution`/`blocked` — flags moves blocked by war,
  sanctions, conscription, closed borders, Level 4 advisory).
- **Country snapshot** (bento grid + tabs, `CountrySummary`): Money (currency,
  FX vs home), Cost of living / prices vs EU, Climate twin, Health (life
  expectancy), Safety (advisory level), Practical (driving side, plugs, calling
  code, timezone, English), Crypto (short/long-term rates, holding period),
  Messengers (OONI reachability as app icons), Avg advertised salary (Adzuna),
  Air quality. **A missing value renders as an em-dash `—`, never a fabricated
  number** — the product never invents coverage.
- **Phased checklist** — 5 phases (`PHASE_KEYS`):
  1. `before` — Before you go
  2. `departure` — Wrapping up at home
  3. `week1` — First week
  4. `month1` — First month
  5. `days90` — First 90 days
  Each task (`ChecklistItem`) can carry: `why`, `steps`, `documents`, `tip`,
  `deadline`, `commonMistake`, `estimate`, official `url`, and OSM office map
  links (direction-aware: departure tasks point to the origin city, destination
  tasks to the destination city).
- **Two views** (persisted): **Simple** (vertical timeline with rich cards) and
  **Advanced** (Linear-style table with `REL-N` IDs and dependency enforcement —
  a task is "Blocked by REL-x" until prerequisites are checked).
- **Progress rail:** circular % + "N/M steps done". The denominator counts all
  items across all phases, so 100% requires unlocking and checking everything.
- **Export:** PDF and Markdown (`ExportMenu`); locked phases are excluded.

### 5.2 Partner/affiliate rows (explicitly separate from neutral advice)
These attach to specific tasks as small labeled link rows (§8), visually and
semantically distinct from the neutral source `url`.

### 5.3 Sources & dates
Every snapshot value carries its source label and, where relevant, a
verification date. Full attribution list in §10.

---

## 6. Persistence, privacy & retention

There is **no account system**. Data lives in three places:

**A. Server-side plan store (KV/Redis via Upstash or Vercel KV).**
`StoredPlan` (`src/lib/planStore.ts`) under `relo:plan:{slug}`:
```ts
StoredPlan = {
  input, plan, visa,           // the generated plan + the user's inputs
  createdAt, paid, paidAt?,
  email?, emailedAt?,          // buyer email — SERVER-ONLY, never returned by GET
}
```
- The `slug` is an **unguessable 128-bit capability link** (`mintSlug` = 16
  random bytes, base64url, 22 chars). **The link IS the credential**: anyone
  with the URL can read the plan and read/update its progress; nobody without it
  can. `GET /api/plan/{slug}` returns `toPublicPlan()`, which **strips `email`
  and `emailedAt`**, so sharing a link never leaks the purchaser's address.
- `/plan/[slug]` pages are `robots: noindex, nofollow`.
- **Retention:** unpaid plans ~**30 days** (`UNPAID_TTL_SEC`); paid plans
  ~**3 years** (`PAID_TTL_SEC`). Progress inherits the plan's TTL.
- Progress store: `relo:progress:{slug}` = `{ checked: {"p:i": true}, updatedAt }`,
  capped at 500 entries.

**B. Browser `localStorage`** (client-only convenience state):
| Key | Contents |
|---|---|
| `relochecklist:result` | last generated `{ input, plan, visa, slug }`. |
| `relochecklist:view` | `"simple"` \| `"advanced"`. |
| `reloka-consent` | `"granted"` \| `"denied"` cookie-consent choice. |

**C. Third parties** — OpenAI (generation), Lemon Squeezy (payment), Resend
(email), Mixpanel/GTM/Vercel (consent-gated analytics), and the live-data APIs
in §10. See §4.2.

> **If no KV/Redis store is configured**, `limiterConfigured()` is false: plans
> are **not** persisted, no `slug` is minted, and the product falls back to a
> single-session, `localStorage`-only experience (no permanent link, no
> cross-device progress, no server-verified payment). Configuring the store is
> what turns on §4.3/§4.4.

---

## 7. The trust / data-integrity model

- **Never fabricate coverage.** Where a curated dataset does not cover a
  country, the UI shows `—`. Do not "fix" a dash by inventing a value; only wire
  it to a real live source or leave it dashed.
- **Neutral content vs partner offers are separate layers.** Neutral relocation
  advice never names one private provider as "the" choice; affiliate links are a
  clearly-separate, opt-in commercial row.
- **No listing portals in housing guidance.** Rental-scam defense describes
  channel *types* and suggests searching YouTube "{city} rental scam", but names
  no rental portals and strips their URLs — housing is a scam surface.
- **No em dashes in generated/user-facing copy** (a deliberate copy rule; the
  snapshot `—` for "missing value" is the one intentional exception).
- **Not advice.** Plans are LLM-generated and labeled not legal/tax/immigration
  advice; figures should be verified against the named official sources.

---

## 8. Partner / affiliate integrations (the commercial layer)

All are attached server-side to specific tasks and degrade to nothing on
failure (never break plan generation). All prices are approximate planning
indicators, not live quotes.

| Partner | Where it appears | Data source | Link target | Env |
|---|---|---|---|---|
| **eSIM** (Airalo, Yesim, Saily) | travel-eSIM task, "Compare eSIM apps:" | Saily pricing lib | affiliate links | `SAILY_OFFER_ID`, `SAILY_AFF_ID`, `AIRALO_AFF_URL`, `YESIM_AFF_URL` |
| **Flights** | "Book your flight" task, fare on the label | Travelpayouts/Aviasales API | affiliate aviasales.com search | `TRAVELPAYOUTS_API_TOKEN`, `AVIASALES_MARKER` |
| **Nomad health insurance (Genki)** | insurance task, **nomad profile only**, "Nomad health insurance:" | Genki public MCP (`list_product_prices`, live price by age, cached 1 day) | Genki referral link | `GENKI_AFF_URL` (default `genki.world`) |
| **Short-term accommodation** | "Book Short-Term Accommodation" task, "Typical nightly rate: ≈ EUR X/night" (the figure is the clickable link, **no partner brand named**) | **Hotels.nl** search API (median nightly price, cached per city 7 days) | **Klook** referral | `HOTELS_NL_API_KEY`, `KLOOK_AFF_URL` (default `klook.tpk.ro/oNqNkb6K`) |

Note the accommodation case: the **price comes from one source (Hotels.nl)** but
the **link goes to a different partner (Klook)** — valid because the figure is a
rough average, not a quote.

---

## 9. Static vs live data (critical distinction)

- **Live, per-request:** climate, air quality, city timezone (`/api/city`,
  `/api/climate-twin`), live FX rates, hotel/flight/insurance prices. Works for
  essentially any city Open-Meteo can geocode.
- **Curated/generated static datasets** (`src/lib/*.generated.ts`): advisories,
  tax regimes, price level, tax wedge, salaries, Big Mac, inflation, migrant
  share, life expectancy, internet speed, English, plugs, crypto tax,
  censorship/messengers, offices, currency, timezone. These do **not** cover
  every country; uncovered fields show `—`.
- **Country coverage:** **143 selectable countries** in the form
  (`allCountries.ts`; any pair can be generated — the LLM + live climate cover
  the long tail); **38 curated destinations** (`countries.ts`) get the richest
  snapshot, `/moving-to` pages, and appear in `/compare`.

---

## 10. Data sources (attributed in the UI)

Open-Meteo (climate, historical weather, timezone), OpenAQ / WAQI (air quality),
World Bank (inflation, migrant stock, unemployment, population/density), WHO
(life expectancy), The Economist (Big Mac index), Ookla Speedtest Global Index
(fixed internet), EF English Proficiency Index, Eurostat (price level index),
OECD Taxing Wages (tax wedge), Passport Index (short-stay visa matrix), U.S.
State Department (travel advisories), Nager.Date (public holidays), Hipolabs
(universities), OpenStreetMap (office/map links), Adzuna (advertised salaries),
OONI (messenger reachability), CryptoNomadHub (crypto tax, CC BY 4.0), ISO 4217
(currency codes). Commercial: OpenAI (generation), Lemon Squeezy (payments),
Resend (email), Hotels.nl (hotel price), Travelpayouts/Aviasales (flights),
Genki (nomad insurance), Klook / Saily / Airalo / Yesim (affiliate links),
Mixpanel + GTM + Vercel (analytics).

---

## 11. Architecture, stack & environment variables

- **Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4**, deployed on
  **Vercel**. State store: Upstash Redis or Vercel KV. Blob: Vercel Blob.
- **⚠️ Non-standard Next.js.** `AGENTS.md` / `CLAUDE.md` warn this Next version
  has breaking changes; **read `node_modules/next/dist/docs/` before writing
  code.**
- **Key components:** `ReloApp` (form ↔ loading ↔ result state machine),
  `ReloForm`, `ChecklistView`, `SavedPlan`, `CountrySummary`, `ClimateTwinPanel`,
  `ExportMenu`, `CookieBanner`, `StageStepper`, `CountryCombobox`/`CityCombobox`.
- **Key libs:** `types.ts`, `planStore.ts`, `ratelimit.ts`, `email.ts`,
  `analytics.ts`, `saily.ts`, `flights.ts`, `genki.ts`, `hotelPrice.ts`,
  `visaMatrix.ts`, `taxRegimes.ts`, plus the `*.generated.ts` datasets.

**Environment variables (names only — never commit values):**
- `OPENAI_API_KEY` — **required** for generation (503 without it).
- `UPSTASH_REDIS_REST_URL` / `_TOKEN` (or `KV_REST_API_URL` / `_TOKEN`) — shared
  store: rate limits, token budget, **and plan/progress persistence**.
- `OPENAI_DAILY_TOKEN_BUDGET` — global daily cap (default 250k).
- `LEMONSQUEEZY_API_KEY`, `LEMONSQUEEZY_STORE_ID`, `LEMONSQUEEZY_VARIANT_ID` —
  real checkout (else dev-unlock); `LEMONSQUEEZY_WEBHOOK_SECRET` — webhook HMAC.
- `RESEND_API_KEY` — permanent-link email (else on-screen copy link only).
- `WAQI_TOKEN`, `OPENAQ_API_KEY` — air quality.
- `HOTELS_NL_API_KEY`, `KLOOK_AFF_URL` — hotel price + accommodation link.
- `TRAVELPAYOUTS_API_TOKEN`, `AVIASALES_MARKER` — flights.
- `GENKI_AFF_URL` — nomad insurance referral. `SAILY_*`/`AIRALO_*`/`YESIM_*` — eSIM.
- `BLOB_READ_WRITE_TOKEN` — feedback storage.
- `NEXT_PUBLIC_MIXPANEL_TOKEN`, `NEXT_PUBLIC_MIXPANEL_API_HOST` — analytics.
- `NEXT_PUBLIC_SITE_URL` — canonical URL.

---

## 12. Known limitations & gotchas

- Rate limiting and the daily token budget are only cross-instance when a
  Redis/KV store is configured; otherwise best-effort per-instance.
- **Plan persistence, permanent links, cross-device progress, and
  server-verified payment all require the KV/Redis store.** Without it the app
  is a single-session localStorage experience.
- Curated datasets are **not global** — expect honest `—` for uncovered
  country/field combos. Do not backfill with guesses.
- Generation depends on `OPENAI_API_KEY`; fresh third-party price lookups add
  latency on a cache miss (each is bounded by a timeout and degrades to nothing).
- Plans are LLM-generated and explicitly **not legal/immigration advice**.

---

## 13. Build / verify

- `npm run lint`, `npx tsc --noEmit`, `npm run build` are the standard gates.
- After changes, verify on the Vercel preview; production propagation can lag a
  few minutes after merge (do not treat a stale prod response as a regression).
