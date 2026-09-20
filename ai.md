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
| `Antigravity` | `Google Antigravity Agentic IDE` | `@panavkbysani2011-jpg`, `@agnidevaraja` | `Pair programming: building the React components, connecting Leaflet map layers, wiring up the Kannada and English language toggle, and cleaning up the interface layout` |
| `Gemini` | `Gemini 3.8 Flash / Gemini Pro` | `@panavkbysani2011-jpg` | `Drafting verification prompts, writing error handling, and checking our TypeScript interfaces` |
| `Google AI Studio` | `Web interface / Prototyping` | `@panavkbysani2011-jpg` | `Testing system prompts in the web playground and tuning the negative checks so non-civic photos like selfies or indoor shots get rejected during resolution audits` |
| `Google Julius` | `Analysis environment` | `@agnidevaraja` | `Checking coordinate data for Mysuru Outer Ring Road boundaries and testing the capacity threshold math across our jurisdictions` |

## 2. Where AI Helped in the Codebase

| Area / file | Level of AI help | What a human did |
|---|---|---|
| `frontend/src/components/` | `Medium: UI layout autocomplete` | `Created the tab navigation, bilingual English and Kannada toggle, and handled citizen form validation` |
| `frontend/src/utils/geminiVerification.ts` | `Medium: SDK call boilerplate` | `Wrote the photo verification criteria, fallback rules for when offline/no API key, review restructuring and sanitization logic, and JSON parsing checks` |
| `frontend/src/mockDatabase.ts` | `Low: Data structure scaffolding` | `Designed and wrote the geo-elastic routing rules, buffer zone boundary boxes, capacity calculation, and the inter-agency ledger` |
| `frontend/src/firebase.ts` | `Low: Auth setup suggestions` | `Wrote user session management, error handling, and syncing tickets with Firestore` |
| `README / docs` | `None` | `Written completely by the team to explain the Mysuru local context and architecture` |

Commit convention (optional, recommended): commits containing substantial AI-generated code are tagged `[ai]` in the message, e.g. `feat: ward status page [ai]`.

## 3. AI Inside the Product (runtime)

<!-- Delete this section if your product uses no AI/ML at runtime. -->

| Model / API | What it does in our product | Hosted where | Trained / fine-tuned by us? |
|---|---|---|---|
| `Gemini 3.6 Flash (@google/genai SDK)` | `1. Audits field worker proof photos to verify civic repairs and reject fake uploads like selfies, pets, or indoor shots. 2. Moderates citizen complaints to flag inappropriate content. 3. Pre-moderates citizen feedback to turn rambling reviews into clear, constructive summaries and clean out inappropriate language before saving.` | `Google Cloud Gemini API` | `No, customized using system prompts with negative examples and structured JSON output` |

- Accuracy we measured: Tested on 40 sample civic and non-civic photos: 100% rejection on selfies, plants, and indoor objects; 90% true positive verification on clear road repair and garbage cleanup photos
- What happens when the model is wrong: If rejected or inconclusive, the ticket is flagged for audit and sent to the supervisor queue without getting lost; if the API key is missing or offline, our fallback rules step in
- Does it work offline?: No, calling Gemini needs an internet connection. If offline, the app uses local pattern checks and heuristics so workers can keep doing their shift
- Citizen data sent to third parties: Only the issue description text, category, and resolution photos are sent to Google Gemini API endpoints; no personal phone numbers, resident names, or IDs are shared
- Cost at city scale: At around 1,500 reports a day across Mysuru, costs are under ₹200/day using Gemini Flash pricing, and free during testing

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

Declaration: We confirm this disclosure is complete, and every team member can explain the code listed above.
Signed: `Panav K Bysani` on behalf of `SyntaxError-404` · `19-09-2026`
