# Privacy Policy

**Last updated: 20 July 2026**

This Privacy Policy explains what information reloka.to ("Reloka", "we", "us", or "our") collects, how we use it, and the choices you have. Reloka is a relocation-planning tool that turns a few details about your move into a personalized checklist. We built this policy to be readable by a non-lawyer; the plain-language summaries are not a substitute for the full text.

---

## 1. Who We Are

- **Operator:** Reloka is operated by a private individual based in Utrecht, the Netherlands. Contact: privacy@reloka.to.
- **What we do:** Reloka generates a personalized relocation checklist from the origin, destination, and preferences you enter.
- **Contact:** privacy@reloka.to

## 2. What Reloka Does

Reloka is a web tool. You tell us where you are moving from and to, your city, your profile (for example "remote worker" or "student"), your timeline, and a few priorities. We combine that with open reference data and an AI model to produce a step-by-step relocation checklist. Generating a plan is free; unlocking the full personalized plan is a one-time paid purchase. **No account or sign-up is required to use Reloka.**

## 3. Information We Collect

### What We Do NOT Collect
- **No accounts, no passwords, no user profiles.** There is nothing to log into.
- **No payment card data on our servers.** Payments are handled entirely by our payment processor (Lemon Squeezy); we never see or store your card number.
- **No contact lists, address books, or precise GPS location.**
- **No advertising or cross-site tracking cookies.**

### Data You Submit (plan inputs)

> **Please do not enter sensitive personal information** (for example health conditions, religion, exact identities of family members, financial account details, or government ID numbers) into the free-text fields. Your inputs are sent to OpenAI and may be used to improve and train its services (see §4). Enter only what is needed to plan your move.

The origin country, destination country, city, mover profile, age (optional), citizenships, visa status, timeline, priorities, budget note, and free-text notes you enter into the plan form. This data is:
- **Used** solely to generate your relocation checklist.
- **Sent** to our AI provider (OpenAI) to produce the plan text. Inputs and outputs may be shared with OpenAI to improve and train its services (see §4).
- **Sent, in part, to live-data providers.** Your destination (and, if you enter it, origin) country and city are sent to third-party data services to fetch live information such as climate, air quality, timezone, and indicative hotel or flight prices (see §6). These lookups receive only that location, not your other inputs.
- **Stored on our servers, without an account.** When your plan is generated we save it (your inputs plus the generated checklist) on our servers, addressed by a long, unguessable random link. There is still no account or login: **the link itself is the key**, so anyone who has it can open the plan and nobody without it can. Unpaid plans are automatically deleted after about 30 days; paid plans are kept for about 3 years (see §7). A copy is also cached **in your own browser's local storage**, which you can clear at any time via your browser settings.

### Generated Content (your plan)
The checklist returned to you is stored server-side with your inputs (under the unguessable link described above) and is also cached locally in your browser. We do not require an account and do not build advertising or cross-site profiles of you. Note that the generated plan is one of the "outputs" that may be shared with OpenAI to improve and train its services (see §4).

### "Request a country" submissions
If you use the "Missing your destination?" form, we store only the **country name you request** so we know what to add next. We deliberately do **not** collect an email or any other personal identifier through this form.

### Analytics Data
We use **Mixpanel** (product analytics, on Mixpanel's EU data-residency infrastructure), **Google Tag Manager** (which may load Google measurement tags), **Vercel Analytics**, and **Vercel Speed Insights** to understand aggregate usage (page views, funnel events such as "plan generation started" or "unlock clicked", approximate country-level location, device/browser type, referrer, session duration, and web-performance metrics). **These analytics are consent-gated:** nothing is sent until you accept analytics cookies in our banner, and the events we do collect are deliberately non-identifying (for example, a plan-generation event records only the origin country, destination country, and mover profile — never your budget, notes, or visa free-text). These tools measure trends; we do not use them to identify you personally.

### Payment Data
When you buy the full plan, payment is processed by **Lemon Squeezy** (our Merchant of Record). Lemon Squeezy collects the information needed to process the transaction (for example your card details and billing information) under **Lemon Squeezy's** own privacy policy. We receive only a confirmation that payment succeeded (including your email address and the fact and time of payment), not your card number. We store that email server-side, tied to your plan, so we can email you your permanent plan link; it is never shown to anyone who opens the plan link (see §6 and §7).

## 4. How We Use Information

- **Provide the service:** generate, store, and return your relocation checklist, and let you reopen it from any device via its permanent link.
- **Process payments:** confirm your purchase via Lemon Squeezy and unlock the full plan.
- **Deliver your plan link by email:** after a purchase we use an email provider (Resend) to send your permanent plan link to the email address from your payment.
- **Improve the service:** understand aggregate usage and performance.
- **Security and abuse prevention:** rate-limiting and protecting the service from misuse.
- **Legal compliance:** meet applicable legal obligations.

**AI model training disclosure.** Your plan inputs are processed by the OpenAI API to generate output. We have enabled OpenAI's "share inputs and outputs" setting, which means the inputs you submit and the plans we generate **may be used by OpenAI to develop and improve its services, including training its models**, under OpenAI's own terms. Reloka itself does not operate or train separate AI models. If you would prefer your inputs not be shared with OpenAI for these purposes, please avoid submitting sensitive personal details in the free-text fields.

We do not sell your personal information, and we do not use your data for third-party advertising.

## 5. Cookies

| Cookie / storage | Purpose | Duration | How to Opt Out |
|--------|---------|----------|----------------|
| `reloka-consent` (local storage) | Remembers whether you accepted or declined analytics | Until you clear browser data | Decline in the cookie banner, or clear site data |
| Mixpanel identifier (local storage) | Consent-gated product analytics; **set only after you accept** | Until you clear browser data | Decline in the cookie banner, or clear site data |
| `_ga`, `_ga_*` | Google measurement via Google Tag Manager (aggregate usage), **set only after you accept** | Up to 2 years | [GA opt-out add-on](https://tools.google.com/dlpage/gaoptout) or decline in the cookie banner |
| Vercel Analytics identifier | Privacy-friendly aggregate analytics | Session / short-lived | Block cookies for the site |

- Analytics are **opt-in**: until you accept in our cookie banner, Mixpanel is opted out and Google tags load in a consent-denied state (Google Consent Mode v2).
- We do **not** use advertising cookies, and we do **not** engage in cross-site tracking.
- Your generated plan is stored on our servers under an unguessable link and also cached in your browser's local storage; clearing your browser data removes the local copy.
- We honor browser "Do Not Track" and Global Privacy Control signals where technically feasible.

## 6. Third-Party Processors

| Provider | Purpose | Privacy Policy |
|----------|---------|----------------|
| Vercel | Hosting, content delivery, plan/data storage, analytics, performance | https://vercel.com/legal/privacy-policy |
| OpenAI | AI generation of plan text (API) | https://openai.com/policies/privacy-policy |
| Lemon Squeezy | Payment processing (Merchant of Record) | https://www.lemonsqueezy.com/privacy |
| Resend | Sending your plan-link email after purchase | https://resend.com/legal/privacy-policy |
| Mixpanel | Consent-gated product analytics (EU data residency) | https://mixpanel.com/legal/privacy-policy |
| Google (Tag Manager / measurement) | Consent-gated aggregate usage analytics | https://policies.google.com/privacy |

We also use a small set of live-data providers to enrich plans (for example Open-Meteo for climate, WAQI/OpenAQ for air quality, and hotel/flight pricing APIs). To do this we send them only the **destination (and, if entered, origin) country and city** from your inputs — never your notes, budget, visa text, or other details. Separately, Reloka draws on public, open reference datasets (for example passport/visa data, World Bank indicators, OECD, and network-measurement sources); those static datasets are consulted locally and receive no data from you.

## 7. Data Retention

- **Plans (your inputs + generated checklist):** stored server-side under an unguessable link. **Unpaid plans are deleted after about 30 days; paid plans are kept for about 3 years**, after which they are automatically deleted. A copy also lives in your browser until you clear it.
- **Buyer email:** stored server-side, tied to your paid plan, for as long as the paid plan is retained (about 3 years). It is never returned to anyone who opens the plan link.
- **"Request a country" entries:** the requested country name is retained until we have acted on the request.
- **Analytics aggregates:** retained per the analytics provider's defaults (for example, Google's default retention is up to 14 months).
- **Server access logs:** retained for a short period (approximately 30 days) for security and debugging.
- **Payment records:** retained by Lemon Squeezy and, to the extent we hold transaction confirmations, for as long as required for tax and accounting purposes.

## 8. Your Rights

### GDPR (EEA/UK)
You have the right to access, rectify, erase, restrict, port, and object to processing of your personal data, and to lodge a complaint with your local supervisory authority. Our legal bases (Art. 6 GDPR) are: **performance of a contract** (generating and delivering the plan you request), **legitimate interests** (securing and improving the service), and **consent** (analytics cookies where required). We respond to requests within 30 days.

### CCPA/CPRA (California)
You have the right to know, delete, and correct personal information, and to opt out of "sale" or "sharing." **Reloka does not sell or share personal information.**

### How to Exercise
Email **privacy@reloka.to**. Because we operate without accounts, we hold very little identifiable data; we may ask for information needed to locate any records or to verify your request.

## 9. International Transfers

Reloka is delivered through globally distributed infrastructure (Vercel) and uses providers (OpenAI, Stripe, Google) that may process data in the United States and other countries. Where personal data is transferred out of the EEA/UK, we rely on appropriate safeguards such as the providers' **Standard Contractual Clauses** or adequacy mechanisms. Data may also transit other regions as part of normal internet routing.

## 10. Children

Reloka is not directed to children. We do not knowingly collect personal data from anyone under **16** (EEA/UK) or under **13** (United States). If you believe a child has provided data, contact us at **privacy@reloka.to** and we will delete it.

## 11. Security

- All traffic is encrypted in transit via TLS/HTTPS.
- Data at rest with our providers is encrypted using provider-managed encryption.
- We store **no passwords or account credentials**, so there are none to leak.
- We store **no payment card data**; card handling is isolated to Stripe.
- If a data breach affecting your rights occurs, we will notify affected users and regulators as required by law.

## 12. Changes

We may update this Privacy Policy from time to time. Material changes will be posted here with a new "Last updated" date, and where significant we will provide additional notice (for example an on-site banner). Please review this page periodically.

## 13. Contact

- **Privacy questions:** privacy@reloka.to
- **Response time:** within 30 days
- **EU/UK representative:** not applicable; the operator is established in the European Union (the Netherlands).

## 14. Regional Supplements

### EEA/UK Supplement
- **Legal bases:** contract, legitimate interests, and consent (analytics), as described in §8.
- **Data subject rights:** access, rectification, erasure, restriction, portability, objection (Art. 15–22 GDPR).
- **International transfers:** Standard Contractual Clauses / adequacy, as described in §9.
- **Complaints:** you may complain to your local supervisory authority.

### California Supplement
- **Categories collected:** identifiers (approximate location, device/analytics data, and \u2014 for buyers \u2014 the email address from your payment); commercial information (purchase of the full plan); internet activity (usage analytics). We do not collect sensitive personal information.
- **Rights:** know, delete, correct; opt out of sale/sharing (we do neither).
- **"Do Not Sell or Share My Personal Information":** not applicable because we do not sell or share personal information.

