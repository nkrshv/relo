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
- Submitting shows a stepped loading list (5 checks, centered): the first 4 tick green ~every 2s, then the LAST step ("Assembling your checklist") stays a grey dot while rotating humorous quips cycle below it. Only when the backend returns does the last step briefly spin → green check → plan reveal (~1.6s hold). If the last step spins during the whole wait, the smart-finish wiring (`PlanSkeleton done` prop / `finishing` state in ReloApp) may have regressed.
- City placeholders are country-aware ("e.g. Tirana" for Albania) via the 238-country origin layer (`originForCountry().capital`). If they show generic "e.g. Mumbai" for every country, that wiring may be broken.
- Snapshot detail tabs (Practical/Cost/Health/Safety) render on the RESULT page, not under the form — submit first, then click the tab pills under the bento grid. Health notices use native `<details>`; click the summary to expand.
- Pick a curated destination (e.g. Spain) to exercise all tabs — uncurated countries lack tax wedge, vaccines, and price data.
- The pipeline diagram lives on the landing page under "How it works"; it should span roughly the section width with 7 source chips.

## Unlocking locked phases (First week/month/90 days)
Registration tasks with OSM office-link chips live in locked phases. Without a Stripe key configured, clicking "Unlock full plan — $9" performs a dev unlock instantly — use it to expand "How to do it" and check "Offices near <city>" chips.

## Same-country guard
- Picking a country in one combobox hides it from the other's suggestions (`exclude` prop). Typing the same country manually shows "You're already there — pick a different destination." and blocks submit; /api/generate also 400s equal countries.

## Gotchas
- A stale `next-server` may already occupy port 3100 from a previous session/build — `npm run start` then fails with EADDRINUSE while curl still returns 200 from the OLD build, making new changes look broken. Always `pkill -f next-server` (or kill the PID from `ps aux | grep next`) and confirm the new server actually started before testing.
- PR comments posted via `gh pr comment` do NOT auto-upload local image paths — use the builtin PR-comment tool (or pre-upload attachments) so screenshots render.
- sessionStorage caches city context 24h and FX daily — reload or use a fresh route if you need to re-trigger fetches.
- WAQI geo lookup might return a distant station; the API uses name-based feed first, then geo with a 150km sanity check. If AQI looks like the capital's, this path may be broken.
- Don't curl the OpenAI-backed /api/generate directly; test via UI (rate limiting and prompt assembly live there).

## Devin Secrets Needed
- `OPENAI_API_KEY` (plan generation)
- `WAQI_TOKEN` (live air quality)
