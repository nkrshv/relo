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

## Same-country guard
- Picking a country in one combobox hides it from the other's suggestions (`exclude` prop). Typing the same country manually shows "You're already there — pick a different destination." and blocks submit; /api/generate also 400s equal countries.

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
