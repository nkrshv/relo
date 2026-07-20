# Reloka — End-to-End User Journey (Analyst Handover)

> Audience: an external consultant / analyst performing a deep product and
> user-journey analysis **without access to the live application**. This
> document describes the complete journey from first page load to a 100%-checked
> checklist, including every input variable, observable UI state, underlying
> implementation behavior, data captured, and likely drop-off points.
>
> Ground rules of this product, up front:
> - **No registration. No login. No user account.** Nothing identifies a user by
>   name; identity-free **capability links** (an unguessable per-plan `slug`)
>   replace accounts.
> - **Generated plans ARE persisted server-side** under `relo:plan:{slug}` in
>   KV/Redis (unpaid ~30 days, paid ~3 years), so a plan reopens on any device
>   from its permanent `/plan/{slug}` link and checklist progress syncs across
>   devices. This requires a configured KV/Redis store; without it the app falls
>   back to a single-session `localStorage`-only experience.
> - **The $9 checklist unlock is server-enforced via Lemon Squeezy**, not an
>   honor-system client flag: a HMAC-verified `order_created` webhook flips the
>   plan's server-side `paid` flag (the only source of truth for unlock) and
>   Resend emails the permanent link. If Lemon Squeezy is not configured, the
>   endpoint returns a dev-unlock so the product stays demoable locally. See the
>   canonical `RELOKA-PRODUCT-HANDOVER.md` §4.3/§6 for exact mechanics.
>
> Legend used below:
> - **[UX]** = what the user perceives.
> - **[STATE]** = observable UI state.
> - **[IMPL]** = underlying implementation.
> - **[DATA]** = what is collected/stored.
> - **[DROP]** = plausible drop-off / friction point.

---

## Stage 0 — Entry

**Entry points**
- Landing page `/` (marketing).
- SEO destination pages `/moving-to/[country]` (38 curated countries) — these
  embed the product pre-filled to that destination.
- Comparison pages `/compare/[pair]` and index `/compare`.
- Direct link to `/plan`.

**[UX]** Landing headline: *"Move to {city} without the 3am panic research"*
(the city cycles through a typewriter list: Lisbon, Berlin, Toronto, Tokyo,
Madrid, Dublin, Vienna). Sub-sections: the pains ("37 open tabs of contradictory
visa blog posts…"), a 3-step "how it works", a feature list, FAQ, popular
destinations, and a compare link. Pricing line appears on CTAs:
**"Free plan in about a minute, full checklist $9."**

**[UX] CTAs** — every primary button ("Get my relocation plan", "Build my
checklist now") is a link to **`/plan`**. There is no signup step.

**[DATA]** Page views flow to GTM (`GTM-TK4LCSRM`), Vercel Analytics, and Speed
Insights. No PII is collected at entry.

**[DROP]** The pricing line ($9) is visible before any value is delivered; some
users may bounce here without realizing phase 1 is free.

---

## Stage 1 — The intake form (`/plan`, component `ReloForm`)

On `/plan`, a 3-step **stage stepper** is shown (Form → Building → Plan). The
form is the only data-entry surface. **Every field feeds the plan generator and
visibly changes the output.**

### Decision variables collected (`ReloInput` in `src/lib/types.ts`)

| Field | Required | Notes / effect |
|---|---|---|
| `fromCountry` | **Yes** | Origin. Chosen from ~143 countries (autocomplete). Drives passport/visa logic, deregistration, FX. |
| `toCountry` | **Yes** | Destination. Must differ from origin (same-country rejected). |
| `fromCity` | No | Free-text city (≤80 chars). Refines origin office links & climate "home" side. |
| `toCity` | No | Free-text city (≤80 chars). Tailors registration offices, housing areas, climate/wardrobe, city costs. |
| `profile` | Yes (defaults `solo`) | One of: Solo, Couple, Family with kids, Digital nomad, Student. Unlocks profile-specific modules (schooling, tax residency, student insurance…). |
| `visaStatus` | No (free text) | The person's status/route. **If left blank, the plan does NOT pick a route for them** — the first task compares 2–3 realistic routes. |
| `timeline` | No (free text) | When they are moving; woven into estimates/ordering. |
| `priorities` | No (multi-select) | Housing, Banking, Healthcare & insurance, Residency & registration, Taxes, Phone & internet, Pets, Kids & schooling, Driving license, Community & language. Selecting **Pets** or **Driving license** forces dedicated items. |
| `budget` | No (free text) | E.g. "rent under €1,500". Must appear verbatim/near-verbatim in a relevant item. |
| `notes` | No (free text) | Extra context (spouse job plans, kids' ages, pet species…). Personalization is mandatory in the prompt. |

**[UX]** As soon as both countries are chosen, the page heading morphs into the
route (e.g. "🇳🇱 Utrecht → 🇦🇺 Sydney") to signal personalization.

**[DATA]** Nothing is stored server-side at this stage. Inputs live only in
React state until submission. There is no email capture, no marketing opt-in.

**[DROP]** Only two fields are required; the form is deliberately low-friction
("60 seconds"). Over-long free-text is silently capped (500 chars / 80 for
cities, 12 priorities max).

---

## Stage 2 — Generation / loading (`POST /api/generate`)

On submit, the client POSTs `ReloInput` to `/api/generate` and shows a **loading
skeleton** with a stepped progress list and rotating quips ("Building your
plan… grounding it in official data for your route").

**[IMPL]** Server side:
1. Requires `OPENAI_API_KEY` (else HTTP 503 "AI isn't configured yet").
2. **Rate limit: 5 plans/hour per IP** (in-memory). Over the limit → HTTP 429.
3. Validates input; rejects missing/identical countries (HTTP 400).
4. Builds a grounding context from curated + open datasets for the destination
   (advisory, visa rule, climate, holidays, inflation, life expectancy, Big Mac,
   internet, plugs, English, driving, timezone, price level, tax wedge, air
   quality, real office names, universities, verified facts, tax regimes).
5. **Two OpenAI `gpt-4o` passes:** a draft, then a "merciless editor" pass that
   rewrites generic content into destination-specific detail and enforces the
   mandatory modules; falls back to the draft on failure.
6. Normalizes: strips commercial links, drops filler "common mistakes", breaks
   dependency cycles.
7. Returns `{ input, plan, visa }`.

**[UX]** Typical time: "about a minute" (the FAQ says under a minute). The final
"Assembling your checklist" step visibly completes (~1.6 s) before the plan
swaps in, with a smooth fade + scroll-to-top.

**[STATE]** Three outcomes:
- **Success** → the checklist renders.
- **Error** (any non-OK / bad shape) → a red inline message; the user stays on
  the form and can retry.
- **Feasibility flag** inside a successful plan → a banner (see Stage 4).

**[DROP]** Rate limit (5/hr), missing API key (503), or a network error each
leave the user on the form. LLM latency (~1 min) is itself a drop risk.

---

## Stage 3 — The generated plan is stored (persistence begins)

**[IMPL]** On success the client writes `{ input, plan, visa }` to
`localStorage:relochecklist:result`. On any future load of `/plan` (or
`/moving-to/*`), this is restored — so **a refresh keeps the plan and the user
does not have to regenerate.**

**[DATA]** Stored *only in the browser*. There is no server copy, no account, no
way to retrieve the plan on another device. Clearing browser storage loses it.

---

## Stage 4 — Reading the plan (`ChecklistView`)

The result screen, top to bottom:

1. **Route headline** (flags + cities).
2. **Visa answer** — one plain-language line based on the origin→destination
   passport rule (Passport Index): e.g. "Good news: your Netherlands passport
   gets you in visa-free, up to 90 days… but moving for good takes a residence
   permit, and this plan walks you through it." Wording adapts to the profile
   (nomad/student/family) and to visa-free / visa-on-arrival / e-visa / eTA /
   visa-required / no-admission categories.
3. **Destination summary** (one paragraph from the model).
4. **Feasibility banner** (only if flagged): amber "Important restrictions to
   check first" (caution) or red "This move may not be possible right now"
   (blocked) — driven by war/sanctions/conscription/advisory logic.
5. **Country snapshot** (`CountrySummary`) — a bento grid + tabs: Money (currency
   + FX vs home), Cost/Prices (Eurostat price level; Big Mac euro-area fallback),
   **Climate twin** (home vs destination temps, sunny days, humidity, AQI, packing
   guidance — fetched live), Health (life expectancy), Safety (advisory level),
   Practical (driving side, plugs, calling code, timezone, English), Crypto tax,
   Messengers (OONI reachability as app icons), Avg advertised salary (Adzuna).
   Uncovered values render as an em-dash `—` (never "N/A").
6. **Sticky progress rail** — circular %, "N/M steps done", milestone copy.

**[IMPL] Climate twin is live/on-demand** (`/api/climate-twin` via
`useClimateTwin`), with explicit `loading` / `ready` / `empty` / `error` states,
auto-retry on transient failure, a short negative cache, and a manual "Retry"
affordance. It is only hidden when climate data genuinely does not exist.

**[DROP]** The snapshot is dense; some users may treat it as the deliverable and
never scroll to the actionable checklist below.

---

## Stage 5 — The checklist itself: phases, ordering, dependencies

**Five phases, always in order** (`PHASE_TITLES`):

1. **Before you go** (`before`) — visa route, apostille/legalization, FX/multi-
   currency account, shipping + short-term accommodation, travel eSIM, health &
   digital continuity. **Climate-based packing tasks are appended here** as
   ordinary checkable items (category "Packing").
2. **Wrapping up at home** (`departure`) — deregistration, cancel/transfer local
   contracts, mail forwarding, notify home tax & social security.
3. **First week** (`week1`) — urgent post-arrival, incl. local SIM.
4. **First month** (`month1`).
5. **First 90 days** (`days90`) — incl. driver's-license exchange + deadline.

**Each task** carries: title (specific imperative), why (real consequence), tip,
category, estimate (time/cost), official URL (government/public only), 2–4
concrete steps, required documents, a hard deadline where one exists, and the
single most painful **common mistake** with its concrete consequence.

**Dependencies:** tasks declare `dependsOn` (real prerequisites, e.g. tax ID
before bank account, rental contract before address registration). Cycles are
broken server-side.

**Office links:** registration-type tasks show OpenStreetMap search links to
real offices. **Direction-aware:** deregistration/"wrapping up" tasks link to the
**origin** city's offices; destination tasks link to the **destination** city's
offices.

---

## Stage 6 — Two views (Simple vs Advanced)

Toggle persisted in `localStorage:relochecklist:view`.

- **Simple** (default) — a vertical timeline ("scroll road") grouped by phase.
  Full task cards with why / steps / documents / tip / common mistake / deadline
  / official link / **office map links** (office links appear in Simple only).
  The first unchecked task in an unlocked phase is spotlighted as "Up next".
- **Advanced** — a Linear-style flat table: `REL-1…REL-N` IDs, category color
  dots, deadlines, and **hard dependency enforcement** — a task's checkbox is
  **disabled** and shows "Blocked by REL-x" until its prerequisites are checked.
  Expanding a row reveals steps/documents/mistake.

---

## Stage 7 — The unlock gate (freemium mechanics) — READ CAREFULLY

**[STATE]** Phase 1 ("Before you go") is **free and fully interactive**. Phases
2–5 render **blurred and locked**, each with an "Unlock the full plan to see this
phase" overlay. Below the list sits an "Unlock your full relocation plan" card
with the button **"Unlock full plan for $9"**.

**[IMPL]** Clicking it → `POST /api/checkout`:
- **If `STRIPE_SECRET_KEY` is set:** a real Stripe Checkout session is created
  ($9 = 900¢, one-time, `mode=payment`) and the browser is redirected to Stripe.
  On success Stripe returns the user to `/?unlocked=1`; on cancel to `/?canceled=1`.
- **If `STRIPE_SECRET_KEY` is NOT set:** the endpoint returns `{ devUnlock: true }`
  and the client **unlocks immediately, for free**.

**[IMPL] Unlock is a client-side flag.** On unlock (either path), the client sets
`localStorage:relochecklist:unlocked = "1"`. On any subsequent load, if that key
is `"1"` **or** the URL carries `?unlocked=1`, the full plan is shown. There is:
- no server-side entitlement or verification,
- no Stripe webhook,
- no stored payment record, receipt, or customer identity,
- no binding of the unlock to the specific plan or device (it is a global
  per-browser flag).

**[DATA]** If real Stripe is used, payment data lives in Stripe, not in this app.
The app itself never sees or stores card/customer data.

> **For the analyst:** whether the live product actually monetizes depends
> entirely on the Stripe env configuration. As implemented, the paywall is best
> characterized as a **conversion/soft-gate**, not a hardened billing system.
> Anyone can clear or set the `localStorage` flag; the gate is UX, not security.

**[DROP]** This is the single biggest conversion decision point. Users who don't
want to pay (or don't realize it may be free) drop after phase 1.

---

## Stage 8 — Working the checklist to 100%

**[UX]** The user checks off tasks. Each toggle updates the sticky progress rail
(circular %, "N/M steps done", milestone copy that changes at 0 / <25 / <50 /
<75 / <100 / 100%). In Advanced view, blocked tasks cannot be checked until their
prerequisites are.

**[IMPL] Progress math:** `pct = round(doneItems / totalItems * 100)`.
- `totalItems` = **all** items across **all** phases (including locked ones and
  the appended packing tasks).
- `doneItems` = checked items across all phases.
- Because locked-phase items cannot be checked, **100% is unreachable without
  unlocking.** To finish the checklist the user must: (a) unlock (free dev-unlock
  or $9 Stripe), then (b) check every item in all five phases including packing.

**[IMPL] Persistence of progress:** checked state is stored under
`localStorage:relochecklist:checked:<hash>`, where `<hash>` is derived from the
plan signature (origin, destination, profile, summary, all task titles). So:
- A refresh preserves all checkmarks and the % (per that exact plan).
- Regenerating a materially different plan uses a different key (fresh state).
- State is per-browser only; it does not sync across devices.

**[STATE] Completion (100%):** an emerald "Plan complete" panel appears — "All N
steps checked off. Save a copy for your records or start a plan for another
move." The progress ring/bar turn green.

**[UX] Save/Print:** a "Print / PDF" button triggers `window.print()`. Locked
phases are excluded from the printout (`print:hidden`), so a printed/saved PDF
only contains phases the user has unlocked.

**[UX] Start over:** clears `relochecklist:result` and returns to the empty form
(checked state for the old plan remains under its own hashed key but is orphaned).

---

## Stage 9 — After completion / re-entry

- Returning later on the same browser: the last plan, unlock state, view
  preference, and all checkmarks are restored from `localStorage`.
- The user can generate a plan for a different move (subject to the 5/hour rate
  limit), compare countries at `/compare/[pair]`, or submit feedback.
- **Feedback** (`/api/feedback`) is the only user-submitted data persisted
  server-side: a small JSON entry in Vercel Blob (or logged if no blob token),
  rate-limited 10/hour/IP, 200-char cap. No PII is required.

---

## Journey funnel & analytical notes

**Ordered funnel (with the stage that can lose the user):**
1. Land on `/` or an SEO page. [DROP: bounce, $9 line]
2. Click CTA → `/plan`.
3. Fill the form (2 required fields, ~60s). [DROP: form abandonment]
4. Submit → `/api/generate`. [DROP: ~1 min latency, 429 rate limit, 503 no-key, network error]
5. Read plan + snapshot + climate twin. [DROP: treats snapshot as the deliverable]
6. Work phase 1 (free) checklist.
7. Hit the unlock gate. [DROP: primary monetization / conversion decision]
8. Unlock (free dev-unlock or $9 Stripe).
9. Check all five phases → 100%. [DROP: long-tail task completion drop-off]
10. Print/PDF, start another plan, or leave.

**Data-collection summary (privacy posture):**
- No account, no email, no identity, no cookies for identity.
- All plan/progress/unlock/view state is browser-local (`localStorage`).
- Analytics (GTM, Vercel Analytics/Speed Insights) capture anonymous
  behavioral/perf data only.
- Payments (if Stripe is configured) are handled entirely by Stripe; the app
  stores no payment or customer records.
- The only server-persisted user input is optional feedback (Vercel Blob).

**Key assumptions / limitations to flag in any analysis:**
- The paywall is a **soft client-side gate**, not enforced billing (§7).
- "100% complete" is a self-reported, browser-local milestone, not verified.
- Curated data does not cover every country; honest `—` dashes appear for
  uncovered fields — these are intentional, not bugs or missing UI.
- Rate limiting is in-memory/best-effort and not globally consistent.
- Plans are LLM-generated and explicitly **not legal/immigration advice**; users
  are told to verify figures against the named official sources.
- Cross-device continuity is impossible by design (no accounts).
