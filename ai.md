# AI Usage Disclosure

[← Back to README](./README.md)

> AI tools are **100% permitted** at HackMysuru 1.0. Disclosing them is **mandatory**.
> Using AI never costs you points. Not being able to explain code you submitted does.
> Reviewers check this file against your commit history and the AI segment of your video.

---

## Summary

| Question | Answer |
|---|---|
| Did we use AI tools during development? | `Yes` |
| Does our product use AI/ML at runtime? | `No` |
| Roughly how much of the code was AI-assisted? | `~60% of the frontend layout logic, 0% of the core routing algorithms` |
| Can every team member explain the AI-assisted code? | `Yes` |

---

## 1. AI Tools Used During Development

| Tool | Model / plan | Used by | What we used it for |
|---|---|---|---|
| Google AI Studio | Gemini Pro 1.5 | @panavkbysani2011-jpg | Idea generation, refining concepts, setting up frontend templates (React, Tailwind CSS). |
| ChatGPT | GPT-4 | @panavkbysani2011-jpg | Structuring documentation logic, checking edge cases for the product. |

## 2. Where AI Helped in the Codebase

| Area / file | Level of AI help | What a human did |
|---|---|---|
| `src/frontend/citizen` | High: scaffolded by Google AI Studio | Rewrote state handling, customized form categories, connected to backend. |
| `src/frontend/dispatch` | High: scaffolded by Google AI Studio | Connected the data to the API, finalized dynamic mapping overlays. |
| `src/backend/services/routing` | None | Written entirely by hand, handling core mathematical load balancing. |
| `docs/` | Low: Ideation assistance | Synthesized outputs into our actual operational plan for Mysuru context. |

## 3. How We Verified AI Output

- AI was instructed to only use the functions we provided and not add its own components. It was limited to suggesting logic which we thoroughly reviewed.
- We provided manual feedback after every generation round, establishing a strict instruction criteria to guarantee no major flaws in logic or user flows.
- We forced the AI to strip out generic UI fluff and enforce local map coordinates specific to Mysuru (12.2979, 76.6393).

## 4. What We Deliberately Did *Not* Use AI For

- The Decision Log and other informative documents - written by the team in our own words to capture real-world trade-offs.
- The jurisdiction routing rules (the Geo-Elastic Routing Engine), alongside the specific layout of maps in the three different portals.
- Analyzing how the panchayat field worker experiences the app, which directly guided our decision to remove the map interface entirely to prevent jurisdiction arguments.

---

**Declaration:** We confirm this disclosure is complete, and every team member can explain the code listed above.
**Signed:** `Panav K Bysani` on behalf of `SyntaxError-404` · `20-09-2026`
