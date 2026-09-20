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
| Does our product use AI/ML at runtime? | `<Yes / No - Pending App Completion>` |
| Roughly how much of the code was AI-assisted? | `<Pending final codebase calculation - Heavy frontend, bare minimum backend>` |
| Can every team member explain the AI-assisted code? | `Yes` |

---

## 1. AI Tools Used During Development

| Tool | Model / plan | Used by | What we used it for |
|---|---|---|---|
| Google AI Studio | Gemini Pro 1.5 | @panavkbysani2011-jpg | Brainstorming core mechanics, refining the Geo-Elastic Routing concept, and scaffolding complex frontend layouts. |
| Google Antigravity | App Builder | @panavkbysani2011-jpg | Rapid prototyping of the initial UI components and layout structures. |
| Gemini (Chat) | Gemini Advanced | @panavkbysani2011-jpg | Acting as a sounding board for logic flows and verifying edge cases for our constraints. |

## 2. Where AI Helped in the Codebase

| Area / file | Level of AI help | What a human did |
|---|---|---|
| `<Frontend / React UI>` | `High` | `We directed the AI to generate the visual skeleton and component layout, but we manually wired all the state management and user workflows.` |
| `<Backend / Firebase>` | `Very Low / None` | `The backend logic, API connections, and Firebase integrations were done almost entirely by hand. The AI struggled with our specific routing engine requirements, so we built it ourselves.` |
| `<Documentation>` | `Low` | `We wrote the core logic, decision logs, and trade-offs ourselves. AI was only used to check for clarity and format the markdown tables.` |

## 3. How We Verified AI Output

We took a very strict, iterative approach to AI generation to ensure we maintained absolute control over the product.

- **Iterative Guardrails:** The AI was strictly instructed to only use the functions and libraries we explicitly permitted. It was not allowed to invent its own dependencies or "hallucinate" third-party tools.
- **Manual Feedback Loops:** We didn't just accept the first output. After every single round of code generation, we reviewed the logic, provided critical feedback, and forced the AI to correct its own structure based on our strict instruction criteria. This ensured no major logical errors slipped through.
- **Hardcoding Reality:** When the AI tried to use generic placeholder data, we manually intervened to strip out the fluff and enforce real-world parameters (like actual Mysuru map coordinates and real boundary buffer logic). We dictated the business logic; the AI just typed fast.

## 4. What We Deliberately Did *Not* Use AI For

- **The Real-World Context:** The Decision Log, the trade-off analysis, and the understanding of Mysuru's actual political and geographical boundary issues. We researched and wrote that entirely in our own words.
- **The Core Engine Logic:** The actual mathematical rules that drive our Geo-Elastic Routing Engine (deciding how and when to spillover tasks based on capacity).
- **The Worker's Experience:** We explicitly decided to remove the map from the field worker's portal to kill jurisdiction arguments at the root. This was a human, empathetic design decision that AI couldn't have deduced.

---

**Declaration:** We confirm this disclosure is complete, and every team member can explain the code listed above.
**Signed:** `Panav K Bysani` on behalf of `SyntaxError-404` · `20-09-2026`
