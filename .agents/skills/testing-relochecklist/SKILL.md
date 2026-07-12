---
name: testing-relochecklist
description: Test the ReloChecklist app end-to-end (plan form, country/city snapshot data, checklist generation). Use when verifying UI or data-layer changes on relochecklist.
---

# Testing ReloChecklist

## Running the app
- Build + run: `npm run build && npm run start -- -p 3100` (dev server also works, but prod build catches type/lint issues). Verify with `curl -s -o /dev/null -w "%{http_code}" http://localhost:3100/plan`.
- Needs `.env.local` with `OPENAI_API_KEY` (plan generation) and `WAQI_TOKEN` (live AQI via /api/city). Without OPENAI the form submit will fail — check before starting a UI run.
- Vercel preview deployments on PRs are an alternative env; find the URL in PR checks/comments.

## Golden-path UI test
1. /plan → type country in "Moving from"/"Moving to", pick from dropdown.
2. City fields ("City you're leaving/heading to", optional) appear only AFTER a country is chosen.
3. City autocomplete is Open-Meteo geocoding, debounced ~250ms — type a prefix ("Mumb", "Per"), wait ~1.5s, pick suggestion.
4. Headline updates live: countries → cities once both picked. Note: while typing it echoes partial text ("Mumb → Australia") — expected.
5. Submit ("Build my relocation plan") — generation takes ~30–60s (OpenAI). Poll with wait+screenshot; don't assume failure early.
6. Snapshot cells to verify: Climate (Jan/Jul + city label), Air quality (AQI + ↓/↑ vs home), Timezone (±Nh vs home · UTC±N · city), Money, Big Mac.

## Choosing a strong test route
Pick an adversarial route where capital data would visibly differ from the city, so numbers prove city-level correctness. Good example: Mumbai (India) → Perth (Australia): Perth is UTC+8 / Jan ~26° / Jul ~12° / AQI ~40 vs Canberra UTC+10/11 / Jan ~21° / Jul ~6°, and Mumbai AQI (~158) differs from Delhi (~114).

## Loading state & snapshot detail tabs
- Submitting shows a stepped loading list (5 checks, centered): the first 4 tick green ~every 2s, then the LAST row becomes the active step — spinner + rotating humorous quips INLINE in the list (dark, non-italic, same style as other steps). If quips appear as italic centered subtext below the list, that's the old pre-#28 behavior. When the backend returns, the row reverts to "Assembling your checklist" → brief spin → green check, then the skeleton fades out and the plan rises in (`rise` animation). A hard instant swap into the plan means the fade wiring (`finishChecked` opacity transition in PlanSkeleton, `rise` on the result wrapper in ReloApp) may have regressed.
- City placeholders are country-aware ("e.g. Tirana" for Albania) via the 238-country origin layer (`originForCountry().capital`). If they show generic "e.g. Mumbai" for every country, that wiring may be broken.
- Snapshot detail tabs (Practical/Cost/Health/Safety) render on the RESULT page, not under the form — submit first, then click the tab pills under the bento grid. Health notices use native `<details>`; click the summary to expand.
- Pick a curated destination (e.g. Spain) to exercise all tabs — uncurated countries lack tax wedge, vaccines, and price data.
- The pipeline diagram lives on the landing page under "How it works"; it should span roughly the section width with 7 source chips.

## Stage stepper (three-stage progress bar)
- A horizontal stepper ("Your move" → "Building your plan" → "Your checklist") renders above the plan flow when `showHeading` is true (on /plan and /moving-to/*), NOT on the landing page. Done steps: emerald check circles + emerald connectors; active: stone-900 circle; pending: gray.
- The stepper should stay in one place across stage changes (single top-level return in ReloApp keeps it mounted; state changes are in-place CSS color transitions). If it visibly re-fades or shifts on stage change, the branches may have been split back into separate returns, or its `reveal` class reintroduced.
- Loading stage should show ONLY the stepped check list (no skeleton phase cards below it — removed in #35).
- Known nuance: the short loading page may drop the scrollbar, shifting centered content ~4px vs other stages. `scrollbar-gutter: stable` is the fix if pixel-perfection is requested.
- When comparing stepper positions across stages, compare screenshot pixel coordinates of the circles, not impressions.

## Tax regimes, /compare and /moving-to pages (PR #37)
- Regime data lives in `src/lib/taxRegimes.ts` (~30 countries, each with status active/changed/closed, sourceUrl, `verified: "2026-06"`). Rendered in: snapshot Cost tab ("Special tax regimes for newcomers"), /moving-to/[country], and /compare/[pair]; also injected into the generation prompt — a generated Spain plan should include a Beckham-regime task.
- /compare index groups 18 curated destinations into 153 canonical pairs (alphabetical A-vs-B only; reversed slugs 404/redirect). Pair pages show ~13 rows, each with a source subtext; regime cards carry amber "Recently changed" / "Closed" badges and "Verified 2026-06 · <official source>" links.
- /moving-to/[country] for curated countries: "at a glance" grid of 9 sourced live facts, regime card, FAQ with schema.org FAQPage JSON-LD (verify via curl/grep of page source, not screenshots), and canonical compare-link chips.
- TrustBlock on the landing page (after Features): email subscribe and "request a country" forms POST to /api/feedback; success replaces the form with green text ("You're in…" / "Noted…"). /api/feedback is rate-limited per IP (10/hour → 429), same pattern as /api/generate.

## New data-layer blocks (PR #47: OONI messengers, Adzuna salaries, WB migrant share)
- /moving-to/{country} "at a glance" gains up to three cells: "Messengers" (OONI, sub "OONI, 6 months to <Month Year>"), "Foreign-born" (World Bank 2024) and "Avg advertised salary" (Adzuna, sub "Adzuna, <Month Year>"), plus FAQs "Can I use WhatsApp and Telegram in X?" and "What do jobs pay in X?" (also in the FAQPage JSON-LD).
- The same three cells appear inside the generated plan's Country snapshot (same `CountrySummary` component) — verify BOTH surfaces; they can regress independently via the visibleCells cap.
- Messenger cell shows logo GLYPHS (SVGs with aria-labels like "Telegram: Works normally"), not text names; disrupted apps are dimmed grey. Best adversarial destination for the dimmed state: Uruguay (Facebook Messenger disrupted). No current destination has ALL apps disrupted, so the heavily-disrupted path may be untestable via live data.
- Adzuna covers only 16 of 37 destinations (US, CA, GB, DE, FR, IT, ES, NL, AT, CH, PL, SG, BR, MX, AU, NZ). Scalable logic: uncovered countries must show NO salary cell/FAQ and never a "0"/"-" placeholder — the grid just reflows. Good adversarial pair: Germany (all three blocks) vs Portugal (no salary).
- /compare pages: the salary and messenger rows render only when BOTH countries have data (germany-vs-vietnam hides the salary row; germany-vs-netherlands shows it). This both-sides gating is intentional per user requirement — don't "fix" it to one-sided.
- Data lives in `countryCensorship.generated.ts` / `countrySalaries.generated.ts` / `countryInsights.generated.ts` (regenerated by `scripts/fetch-censorship.mjs`, `fetch-salaries.mjs` [needs ADZUNA_APP_ID/ADZUNA_APP_KEY org secrets], `fetch-insights.mjs`). Accessors mirror `countryInsights.ts` (normalizeName lookup, null when absent).

## Freemium locks (First week/month/90 days)
- Locked phases render blurred (`blur-sm pointer-events-none`) with a "Locked" label, an "Unlock the full plan to see this phase" overlay, and a bottom "Unlock full plan for $9" CTA. Phase 1 is never locked.
- GOTCHA: the dev unlock persists in localStorage under `relochecklist:unlocked` — a previous test session's unlock makes locks silently disappear and look broken. Clear it before testing locks (see CDP snippet below), then reload.
- Without a Stripe key configured, clicking "Unlock full plan — $9" performs a dev unlock instantly — use it to expand "How to do it" and check "Offices near <city>" chips in registration tasks.

## Scripting the live browser via CDP (no Playwright needed)
Playwright isn't installed; the fastest way to poke the running Chrome (e.g. clear localStorage) is python `websocket-client` with `suppress_origin=True` (Chrome rejects the default Origin header with 403):
```python
import json, urllib.request, websocket
tab = next(t for t in json.load(urllib.request.urlopen('http://localhost:29229/json')) if t['type']=='page' and 'localhost:3100' in t.get('url',''))
ws = websocket.create_connection(tab['webSocketDebuggerUrl'], suppress_origin=True)
ws.send(json.dumps({"id":1,"method":"Runtime.evaluate","params":{"expression":"localStorage.removeItem('relochecklist:unlocked')","returnByValue":True}}))
print(ws.recv())
```

## Scroll road decoration (landing page, PR #40)
- `ScrollRoad` renders a decorative SVG road + car behind the landing page content (desktop ≥1024px only, skipped for `prefers-reduced-motion`). It starts under the hero CTA (`a[href='/plan']`) and fades in via a gradient mask — at scroll 0 NO road should be visible in the hero viewport; a visible stub mid-page means the mask/startY wiring regressed.
- To test: scroll from top to bottom checking (1) fade-in below CTA, (2) car on the path rotating with curves, traveled segment darker, (3) road occluded by white cards, never over text, (4) car gone under the footer at full scroll.
- Narrow-viewport regression: resize the window below 1024px with `wmctrl -r :ACTIVE: -e 0,100,50,800,700` and confirm no road SVG in the DOM (the stripped page HTML in /tmp is handy). Re-maximize with `wmctrl -r :ACTIVE: -b add,maximized_vert,maximized_horz` afterwards.
- The road geometry is measured on mount/resize; if the page height changes (new landing sections), the path recomputes — a road ending far above the footer suggests the resize observer broke.

## Same-country guard
- Picking a country in one combobox hides it from the other's suggestions (`exclude` prop). Typing the same country manually shows "You're already there — pick a different destination." and blocks submit; /api/generate also 400s equal countries.

## Copy clarity conventions (PR #49)
- All user-facing dates must be human-readable via `src/lib/dates.ts` (`formatMonth` → "June 2026", `formatDate` → "7 July 2026"); ISO strings like "2026-06" in visible text are regressions. Middot (·) separators are banned in new copy alongside em dashes.
- "Taxes on salary" must NOT appear in any at-a-glance/snapshot grid — the OECD wedge lives only in the Cost tab as "Employment taxes" and in the FAQ explanation. The landing "monthly changelog" card was removed; the footer is the shared `SiteFooter` ("Made for expats, by expats" + disclaimer).
- Landing badge shows "last refreshed <Month Year>" (auto from data timestamps); CTA subtext is "Free plan in about a minute, full checklist $9" — no "free to generate" claims.
- Fast way to verify these across pages: curl the page, strip tags with python, then check for `\d{4}-\d{2}`, em dash count, "Taxes on salary", "6-month window" — see the grep pattern under Copy/style checks.
- "Missing your destination?" requests are persisted to Vercel Blob (`reloka-feedback` store) by /api/feedback; without `BLOB_READ_WRITE_TOKEN` it falls back to console.log — a "Noted…" success in the UI doesn't prove Blob writes worked.
- Chrome may autocomplete `localhost:3100/` to a deep link (e.g. /plan with a cached plan); append a dummy query like `/?home=1` to force the landing page.

## Checklist guardrails (PR #52/#53: neutrality + concrete common mistakes)
- Generate a real plan via the UI (good adversarial route: US → Germany/Berlin, digital nomad, priorities housing/banking/healthcare) and audit banking/housing/health-insurance items: link chips must point only at official domains (service.berlin.de, elster.de...); any n26.com / tk.de / immobilienscout24.de chip is a FAIL. Private brands may appear only as 2-3 options framed as examples ("TK or AOK", "ImmoScout24 and WG-Gesucht").
- Two safety nets in `src/app/api/generate/route.ts` back the prompt: `COMMERCIAL_HOSTS` drops commercial URLs in `normalizeUrl`, and `normalizeMistake` drops generic "Common mistake" filler (no digit, no proper noun, matches a generic-consequence regex). Visible mistakes must be concrete (order-of-operations or document + consequence).
- `normalizeMistake` proper-noun heuristic: mid-sentence capital, OR leading acronym (`/^[A-Z]{2,}/`, "AIMA ..."), OR leading accented word ("Bürgeramt ...", "Finanças ..."). A plain leading sentence capital does NOT count — do not "fix" it to `/(^|\s)[A-Z]/`, that would neuter the filter. Quick check: `node -e` the three regexes against candidate strings.
- FAQ animation: `.faq-details::details-content` block-size/opacity transition needs `interpolate-size: allow-keywords`; verify in the recording it slides (~0.3s), not snaps. Advanced-view expanded details use `pl-[102px]` to align with the row title after the REL-n ID column.
- Messenger cell contract: all-reachable → value exactly "No known issues"; any disruption → empty value + dimmed icons whose SVG `<title>`/aria-label carry the tooltip; compare rows show "Issues: <apps>" text instead (icons alone are ambiguous across a pair).

## Climate twin in Country snapshot + sunny days (PR #56, REL-11)
- Climate twin is a TAB inside the Country snapshot (Practical / Cost of living / Climate twin / Health / Safety), not a standalone block. Data comes from `/api/climate-twin` via `useClimateTwin` (sessionStorage-cached 24h per route) — the tab appears only after the fetch resolves, so give the result page a few seconds before asserting a missing tab.
- Best adversarial route: Netherlands/Utrecht → Australia/Sydney (opposite hemispheres). Bento tiles must show EACH city's own extreme month (Utrecht "4° in Jan" vs Sydney "12° in Jun"); identical month labels for both cities is the pre-#55 regression.
- Known reference values (2025 data): sunny days Utrecht 264 vs Sydney 325 (diff 61); check three surfaces: (1) top snapshot cell "Sunny days · 325 / yr · 61 more than home", (2) Climate twin bento tile 264 vs 325, (3) AI summary sentence mentioning the sunny-day difference. Sunny day = >4.5h sunshine; counts are null when <300 daily readings, so high-latitude/missing-data cities may legitimately hide the cell.
- Packing is NO LONGER a standalone "What to pack" card at the bottom (removed in REL-5/PR #60). Climate packing lines are now woven into the END of the "Before you go" phase as ordinary checklist tasks (category "Packing", teal dot, ids `pack-<i>`), via an `augmentedPlan` memo in `ChecklistView.tsx`. To verify: grep the rendered page HTML for "What to pack" (expect 0 matches); confirm the packing lines appear as tasks under "Before you go" and show as REL-n rows in the Advanced table too (they ARE injected into the rendered phases now). Checking one must bump both the phase counter and the overall rail (e.g. 0/18 → 1/18) and survive a reload. Note the before-phase item count now includes packing (e.g. "Before you go 0/8").
- /compare/[pair] has a "Sunny days (capital)" row from static `countryInsights.generated.ts` (capitals, e.g. Amsterdam 277 vs Canberra 346), source line "Open-Meteo, days with over 4.5h of sunshine". Regenerate via `scripts/fetch-insights.mjs` if data looks stale.

## Copy/style checks (e.g. banned characters)
- To verify banned characters (em dashes etc.) across a rendered page, don't eyeball screenshots: the computer tool saves stripped page HTML to /tmp (`page_html_*.html`) — grep it, e.g. `grep -c $'\u2014' /tmp/page_html_*.html` and `grep -o $'.\{40\}\u2014.\{40\}'` for context.
- AI-generated text mimics EXAMPLES in the prompt more than it follows style rules. If banned characters leak into model output, check the prompt's few-shot/example strings first — a single em dash in an example can override an explicit ban.
- After editing prompt code, you MUST rebuild (`npm run build`) before re-testing generation; the running prod server serves the old bundle.

## Gotchas
- A stale `next-server` may already occupy port 3100 from a previous session/build — `npm run start` then fails with EADDRINUSE while curl still returns 200 from the OLD build, making new changes look broken. Always `pkill -f next-server` (or kill the PID from `ps aux | grep next`) and confirm the new server actually started before testing.
- PR comments posted via `gh pr comment` do NOT auto-upload local image paths — use the builtin PR-comment tool (or pre-upload attachments) so screenshots render.
- A previously generated plan is cached in localStorage — /plan may load straight into the RESULT view; click "← Start over" to get back to the form before a fresh run.
- sessionStorage caches city context 24h and FX daily — reload or use a fresh route if you need to re-trigger fetches.
- WAQI geo lookup might return a distant station; the API uses name-based feed first, then geo with a 150km sanity check. If AQI looks like the capital's, this path may be broken.
- Don't curl the OpenAI-backed /api/generate directly; test via UI (rate limiting and prompt assembly live there).

## Devin Secrets Needed
- `OPENAI_API_KEY` (plan generation)
- `WAQI_TOKEN` (live air quality)
