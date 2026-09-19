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
| Does our product use AI/ML at runtime? | `<Yes / No>` |
| Roughly how much of the code was AI-assisted? | `<e.g. ~40% of frontend, ~15% of backend, 0% of routing logic>` |
| Can every team member explain the AI-assisted code? | `Yes` |

---

## 1. AI Tools Used During Development

| Tool | Model / plan | Used by | What we used it for |
|---|---|---|---|
| `<ChatGPT>` | `<GPT-x, free>` | `<@handle>` | `<Debugging CORS errors, regex for phone validation>` |
| `<GitHub Copilot>` | `<...>` | `<@handle, @handle>` | `<Autocomplete in React components>` |
| `<Cursor / Claude / v0 / ...>` | `<...>` | `<...>` | `<...>` |

## 2. Where AI Helped in the Codebase

| Area / file | Level of AI help | What a human did |
|---|---|---|
| `src/<frontend/components/>` | `<High: scaffolded by v0>` | `<Rewrote state handling, added offline queue>` |
| `src/<api/routes.py>` | `<Medium: Copilot suggestions>` | `<Designed endpoints, wrote validation>` |
| `src/<routing/engine.py>` | `<None>` | `<Written by hand, core logic>` |
| `<README / docs>` | `<...>` | `<...>` |

**Commit convention (optional, recommended):** commits containing substantial AI-generated code are tagged `[ai]` in the message, e.g. `feat: ward status page [ai]`.

## 3. AI Inside the Product (runtime)

<!-- Delete this section if your product uses no AI/ML at runtime. -->

| Model / API | What it does in our product | Hosted where | Trained / fine-tuned by us? |
|---|---|---|---|
| `<YOLOv8n>` | `<Detects overflowing bins in photos>` | `<On server / on device>` | `<Fine-tuned on 300 labelled images>` |
| `<LLM API>` | `<Classifies complaint text into issue types>` | `<Provider API>` | `<No, prompt only>` |

- **Accuracy we measured:** `<e.g. 82% precision on 50 held-out images>` (or "not measured yet")
- **What happens when the model is wrong:** `<fallback, human review, confidence threshold>`
- **Does it work offline?** `<...>`
- **Citizen data sent to third parties:** `<none / what, and why>`
- **Cost at city scale:** `<rough estimate, or "unknown">`

## 4. Key Prompts (optional, max 5)

<!-- Only prompts that shaped a real design or code decision. Not a full chat log. -->

| # | Prompt (short) | What we kept | What we changed or rejected |
|---|---|---|---|
| 1 | `<"Suggest a schema for complaints with geo-dedup">` | `<Table layout>` | `<Replaced lat/lng floats with PostGIS geography>` |

## 5. How We Verified AI Output

- `AI was to only use the functions we had given, and not add its own, but it could suggest, which we looked into and decided if it is to be included, and asked for detailed reasoning`
- `We gave our feedback after every round of edits and creation, which acted like an set instruction criteria, making sure no major errors are present`
- `<Example of a bug an AI tool introduced and how we caught it>`

## 6. What We Deliberately Did *Not* Use AI For

- `The Decision Log and other informative documents — written by the team in our own words`
- `The jurisdiction routing rules, along with the layout of map in the three different access portals in the product`
- `How the worker in a panchayat experience our APP, based on which we decided what that portal should include with the instructions.`

---

**Declaration:** We confirm this disclosure is complete, and every team member can explain the code listed above.
**Signed:** `Panav K Bysani` on behalf of `SyntaxError-404` · `19-09-2026`
