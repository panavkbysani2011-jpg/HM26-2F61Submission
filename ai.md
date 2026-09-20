# AI Usage Disclosure

[← Back to README](./README.md)

> AI tools are **100% permitted** at HackMysuru 1.0. Disclosing them is **mandatory**.
> Using AI never costs you points. Not being able to explain code you submitted does.
> Reviewers check this file against your commit history and the AI segment of your video.

<!--
This file covers two different things. Keep them separate:
  Section 1: AI tools YOU used while building (ChatGPT, Copilot, Cursor, Claude, v0, ...)
  Section 3: AI models your PRODUCT uses at runtime (vision model, LLM classifier, ...)
If you used no AI at all, say so explicitly in the Summary and delete the rest.
-->

---

## Summary

| Question | Answer |
|---|---|
| Did we use AI tools during development? | `Yes` |
| Does our product use AI/ML at runtime? | `Yes` |
| Roughly how much of the code was AI-assisted? | `~25% of frontend layout and types, 0% of routing and ledger logic` |
| Can every team member explain the AI-assisted code? | `Yes` |

---

## 1. AI Tools Used During Development

| Tool | Model / plan | Used by | What we used it for |
|---|---|---|---|
| `Antigravity` | `Google Antigravity Agentic IDE` | `@panavkbysani2011-jpg`, `@agnidevaraja` | `Autonomous pair programming: scaffolding React components, Leaflet interactive layers, bilingual Kannada/English state wiring, and anti-slop UI design overhaul` |
| `Gemini` | `Gemini 2.5 Flash / Gemini Pro` | `@panavkbysani2011-jpg` | `Prompt formulation, error handling patterns, and TypeScript interface reviews` |
| `Google AI Studio` | `Web interface / Prototyping` | `@panavkbysani2011-jpg` | `System prompt testing and zero-tolerance negative constraint tuning for field worker resolution photo audits` |
| `Google Julius` | `Analysis environment` | `@agnidevaraja` | `Exploratory geospatial coordinate analysis, evaluating Outer Ring Road boundary envelopes, and validating capacity threshold math across the 26 Mysuru jurisdictions` |

## 2. Where AI Helped in the Codebase

| Area / file | Level of AI help | What a human did |
|---|---|---|
| `frontend/src/components/` | `Medium: UI layout autocomplete` | `Wrote custom tab navigation, bilingual English and Kannada state wiring, and form validation` |
| `frontend/src/utils/geminiVerification.ts` | `Medium: SDK call boilerplate` | `Wrote the audit criteria, zero-tolerance prompt rules, heuristic fallback logic, and JSON parsing checks` |
| `frontend/src/mockDatabase.ts` | `Low: Data structure scaffolding` | `Hand-wrote the Geo-Elastic Routing Engine (G-ERE), buffer zone bounding boxes, dynamic capacity math, and Inter-Agency Ledger` |
| `frontend/src/firebase.ts` | `Low: Auth setup suggestions` | `Wrote session persistence, error handlers, and Firestore issue synchronization logic` |
| `README / docs` | `None` | `Written completely by the team to explain the Mysuru local context and architecture` |

**Commit convention (optional, recommended):** commits containing substantial AI-generated code are tagged `[ai]` in the message, e.g. `feat: ward status page [ai]`.

## 3. AI Inside the Product (runtime)

<!-- Delete this section if your product uses no AI/ML at runtime. -->

| Model / API | What it does in our product | Hosted where | Trained / fine-tuned by us? |
|---|---|---|---|
| `Gemini 3.6 Flash (@google/genai SDK)` | `Audits field worker proof photos to verify civic resolution and reject selfies, flowers, pets, or indoor shots` | `Google Cloud Gemini API` | `No, prompt engineering with strict negative constraints` |
| `Gemini 2.5 Flash (@google/genai SDK)` | `Content moderation for incoming citizen complaints to flag spam, profanity, and keyboard mash` | `Google Cloud Gemini API` | `No, zero-shot structured JSON classification` |

- **Accuracy we measured:** `Tested on 40 sample civic and non-civic photos: 100% rejection on selfies, plants, and indoor objects; 90% true positive verification on clear asphalt and debris cleanup photos`
- **What happens when the model is wrong:** `If rejected or inconclusive, the ticket is flagged for audit and sent to the supervisor queue without silent dropping; if API key is missing or network fails, the system falls back to deterministic local rule-based heuristics`
- **Does it work offline?** `No, the live Gemini API requires an internet connection; if offline, local regex and heuristic checks process the entry so workers can continue their shift`
- **Citizen data sent to third parties:** `Only the complaint description text, category name, and uploaded resolution photos are sent to Google Gemini API endpoints; no personal phone numbers, names, or Aadhaar credentials are transmitted`
- **Cost at city scale:** `At ~1,500 tickets per day across Mysuru, costs are under ₹200/day ($2.50/day) using Gemini Flash pricing, and fully zero during hackathon prototyping`

## 4. Key Prompts (optional, max 5)

<!-- Only prompts that shaped a real design or code decision. Not a full chat log. -->

| # | Prompt (short) | What we kept | What we changed or rejected |
|---|---|---|---|
| 1 | `<"Suggest a schema for complaints with geo-dedup">` | `<Table layout>` | `<Replaced lat/lng floats with PostGIS geography>` |

## 5. How We Verified AI Output

- `AI was to only use the functions we had given, and not add its own, but it could suggest, which we looked into and decided if it is to be included, and asked for detailed reasoning`
- `We gave our feedback after every round of edits and creation, which acted like an set instruction criteria, making sure no major errors are present`
- `AI initially suggested using simple Euclidean distance for border buffer zones, which wrongly assigned Bogadi edge complaints to rural Belavadi; we caught this during map coordinate testing and replaced it with strict lat/long bounding envelopes matching Mysuru Ring Road corridors.`

## 6. What We Deliberately Did *Not* Use AI For

- `The Decision Log and other informative documents - written by the team in our own words`
- `The jurisdiction routing rules, along with the layout of map in the three different access portals in the product`
- `How the worker in a panchayat experience our APP, based on which we decided what that portal should include with the instructions.`

---

**Declaration:** We confirm this disclosure is complete, and every team member can explain the code listed above.
**Signed:** `Panav K Bysani` on behalf of `SyntaxError-404` · `19-09-2026`
