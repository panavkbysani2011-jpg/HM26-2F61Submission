# `Civic Mesh` - `A geo-elastic grievance platform that overcomes jurisdictional disputes by routing complaints based on real-time fleet capacity and automating inter-agency cost clearing.`

> HackMysuru 1.0 · Phase 1 · Civic Governance & Clean Mysuru
> Team `SyntaxError-404` (`HM26-2F61`)

| Submission links | Templates | Architecture | Hard constraints | Setup | AI usage | Limitations |
|---|---|---|---|---|---|---|
| [resource.md](./resource.md) | [resource-templates/](./resource-templates/) | [docs/architecture.md](./docs/architecture.md) | [docs/constraints.md](./docs/constraints.md) | [docs/setup.md](./docs/setup.md) | [ai.md](./ai.md) | [docs/limitations.md](./docs/limitations.md) |

<!--
This README is the overview. Detailed content lives in the linked files so each stays short.
Keep the section ORDER below. Reviewers look for each section in the same place in every repo.
-->

---

## 1. Problem Understanding

<!-- Which sub-problem did you pick and WHY that one? 5–8 sentences. -->

Chosen sub-problem: `Combination of Sub-Problem 1 (Routing), Sub-Problem 2 (Follow-through), and Sub-Problem 4 (Verification).`

- The gap we saw: `Conventional grievance apps have rigid “point-in-polygon” maps. In Mysuru today, MCC is extending its boundary to include Hootagalli, Bogadi, Kadakola and Rammanahalli. Jurisdictional disputes arise when a ticket falls right on/around a border. Because executing the order would use up jurisdiction’s local fuel, the tickets are denied, and hence the task is delayed.`
- Why it matters: `150+ tonnes of daily C&D waste and citizen complains are ignored as officials bicker/argue over who is responsible, resulting in illegal dumping hotspots and crippling logistic backlogs.`
- Why we chose this over the others: `Most solutions make the mistake of thinking routing is a geographical problem. We identified that the real world roadblock for civic action is the administrative hassle of uneven equipment budgets and jurisdiction clashes.`
- What "solved" looks like for us: `A complainant on the border gets routed to the closest depot with available space and the clearers get reimbursed without jurisdiction squabbles. The jurisdiction that has the scope to take action, solves it.`

## 2. Target Users & Mysuru Context

| User | Their situation | What they need from us |
|---|---|---|
| `Resident in a contested boundary (e.g., Bogadi edge)` | `Doesn't know if they fall under MCC or Panchayat, frustrated by bounced complaints.` | `A non-guesswork reporting tool. Drop a pin, report the issue, and see a proper solve to their problem` |
| `Zonal Commissioner/Panchayat Officer` | `Panchayat Officer is protective of their ward's budget, frequently lacks operational tipper trucks, so not ready to complete tasks.` | `Only receive tasks their fleet can handle, get financial credit when helping neighboring zones.` |
| `Sanitation / Field Worker` | `Uses basic android device, gets into boundary arguments, work not done properly blamed on them` | `map-free, distraction-free section of tasks to do with a simple camera button to verify end task.` |

Local context we designed for: `Mysuru's transitional boundary overlaps, unequal inter-agency equipment distribution, low digital literacy for field workers, and the need to prevent "fake resolution" photos`

## 3. Solution Overview

<!-- Plain language. A non-engineer should follow this. -->

`Civic Mesh replaces rigid boundary walls with a Geo-Elastic Routing Engine (G-ERE). This algorithm makes the administrative border permeable as a buffer zone, where complaints are routed out to the nearest depot according to its available equipment capacity, and cross-border fuel/labor liabilities are automatically balanced through an Inter-Agency Clearing Ledger.`

Core flow:
1. `A citizen uses the localized English/Kannada toggle, selects from 10 standardized categories, drops an exact pin (or chooses a quick boundary hotspot like Bogadi Ring Road Junction), and uploads photo evidence.`
2. `The system auto-calculates a severity rank between 1–5. If the home zone (e.g., Bogadi Town Panchayat) is at >100% capacity, the system spillover-routes the ticket to the adjacent idle depot (e.g., MCC Zone 3 at ~43% load) and logs an automated debit/credit in the Inter-Agency Clearing Ledger.`
3. `The ticket automatically inherits the designated field crew lead and utility vehicle from the performing jurisdiction's worker roster (e.g., Manjunatha S., Canter KA-09-G-4412 for MCC Zone 3).`
4. `The field worker logs into their specific jurisdiction from the 21-zone roster, accesses their Active Work Orders, travels to the site, and closes the ticket using GPS-locked camera capture (verified by Gemini 3.6 Flash vision audit).`
5. `Citizen receives a real-time update that the issue is resolved with photo proof, and submits satisfaction feedback via a 5-star rating and text review. The review is pre-moderated by Gemini 3.6 Flash into a clean, professional summary and displayed to both the Admin Command Dashboard and the assigned Worker.`

Screenshots: `<2–4 images under docs/images/, each < 1 MB>`

## 4. Architecture

A client-side progressive web application integrating interactive Leaflet GIS mapping, a deterministic Geo-Elastic Routing Engine (G-ERE), bilingual English/Kannada localization, and Google Gemini 3.6 Flash multimodal vision verification & review moderation backed by real-time state synchronization.

Diagram, components, data model and APIs: **[docs/architecture.md](./docs/architecture.md)**

## 5. Tech Stack & AI Usage

Stack: `React 19 · TypeScript · Tailwind CSS · Leaflet GIS · Google Gemini 3.6 Flash API (@google/genai) · Vite` (full rationale in [docs/architecture.md](./docs/architecture.md#tech-stack))

AI tools used in development: `Gemini, Antigravity, Google AI Studio, Google Julius`
AI inside the product: `Google Gemini 3.6 Flash via @google/genai for field worker resolution photo verification, intake moderation, and pre-save citizen review sanitization & restructuring`

Full disclosure: **[ai.md](./ai.md)**

## 6. Decision Log (Summary)

<!-- The full 1-page Decision Log is a PDF on Google Drive, linked in resource.md. ≤ 3 lines here. -->

- Chose: `Dynamic capacity-based spillover with an automated Inter-Agency Clearing Ledger`, over: `Rigid point-in-polygon assignment`
- Because: `Strict administrative borders cause boundary complaints to be rejected due to local equipment and fuel budget exhaustion`
- First thing to break at city scale: `Live Firestore socket listeners across 10,000+ simultaneous connections (mitigated by paginated queries and ticket caching)`

Full decision log: **[resource.md](./resource.md#4-submission-artifacts-google-drive)** · Template: **[decision-log-template.md](./resource-templates/decision-log-template.md)**

## 7. Setup & Run

```bash
git clone https://github.com/panavkbysani2011-jpg/HM26-2F61Submission.git && cd HM26-2F61Submission/frontend
npm install --legacy-peer-deps && npm run dev
```

Prerequisites, environment variables, seed data and offline testing: **[docs/setup.md](./docs/setup.md)**

## 8. Known Limitations

- `A panchayat could intentionally let their capacity hit 150% to lead to divertion of work/MCC to do their work. Due to this We built an "Inter-Agency Throttle" that flags the Deputy Commissioner if a zone exceeds its monthly spillover quota.` 
- `The capacity calculation relies on Zonal Officers accurately reporting their active, non-broken equipment (tippers, etc) in the system.`
- `The 50-meter radius requirement for field workers to close a task may face failures due to multiple factors such as, dense tree cover or poor weather, requiring a manual override end task option.`

Full list, edge cases and scaling roadmap: **[docs/limitations.md](./docs/limitations.md)**

---

## Team

| Name | Role | GitHub |
|---|---|---|
| `Panav K Bysani` | `Team Lead · Full-Stack & Geo-Elastic Routing Architecture` | `@panavkbysani2011-jpg` |
| `Achalesh Ramana Kiral Kooloth` | `Co-Developer · Field Worker UI & Data Model Verification` | `@agnidevaraja` |

## License

`MIT License`. We retain full ownership of our code.
