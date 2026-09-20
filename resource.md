# HackMysuru 1.0 - Phase 1 Submission Index

> **This is the landing file for your submission.** Reviewers open this file first.
> Every evaluation artifact is uploaded to **Google Drive** and linked below. No files in the repo, no other platforms.
> Freeze: **20 September 2026, 23:59 IST.** Anything not linked here before the freeze does not exist for judging.

<!--
HOW TO FILL THIS FILE
1. Replace every <placeholder>. Delete these HTML comments if you like (they don't render on GitHub).
2. Use a PERSONAL Gmail account for uploads. Many college Google Workspace accounts block
   "Anyone with the link" sharing outside the college domain, and reviewers will see "Request access".
3. Share each FILE (not a folder) as: General access → "Anyone with the link" → Viewer.
4. Test every link in an incognito/private window before the deadline.
5. Do not replace or re-upload a file after the freeze. Reviewers compare the SHA-256 below.
-->

---

## 1. Team Details

| Field | Value |
|---|---|
| Team ID (from dashboard) | `HM26-2F61` |
| Team Name | `SyntaxError-404` |
| School | `10X International School` |
| Team Leader | `Panav K Bysani` · `panavkbysani2011@gmail.com` · `9036378191` |
| Repository | `https://github.com/panavkbysani2011-jpg/HM26-2F61Submission` |

| # | Member | Program & Year | GitHub Handle | Primary Role |
|---|---|---|---|---|
| 1 | `Panav K Bysani` (Lead) | `IB-MYP-5(Grade 10)` | `@panavkbysani2011-jpg` | `Team Lead · Full-Stack & Geo-Elastic Routing Architecture` |
| 2 | `Achalesh Ramana Kiral Kooloth` | `IB-MYP-5(Grade 10)` | `@agnidevaraja` | `Co-Developer · Field Worker UI & Data Model Verification` |

---

## 2. What We Built (one-liner)

**Sub-problem:** `Combination of Sub-Problem 1 (Routing), Sub-Problem 2 (Follow-through), and Sub-Problem 4 (Verification).`

**In one sentence:** `A geo-elastic grievance platform that overcomes jurisdictional disputes by routing complaints based on real-time fleet capacity and automating inter-agency cost clearing.`

---

## 3. Repository Documents

| Document | What it covers |
|---|---|
| [README.md](./README.md) | Problem, users, solution overview, links to everything below |
| [ai.md](./ai.md) | AI tools used in development and AI/ML inside the product |
| [docs/architecture.md](./docs/architecture.md) | Diagram, components, data model, APIs, tech stack |
| [docs/constraints.md](./docs/constraints.md) | How we handle the five hard constraints |
| [docs/setup.md](./docs/setup.md) | Local setup, seed data, offline testing |
| [docs/limitations.md](./docs/limitations.md) | Known gaps, edge cases, scaling roadmap |
| [resource-templates/](./resource-templates/) | Templates & guides for the video, decision log, and presentation |

---

## 4. Submission Artifacts (Google Drive)

| # | Artifact | Google Drive Link | File Name | SHA-256 (first 16 chars) |
|---|---|---|---|---|
| 1 | [Pitch + Code Walkthrough Video](./resource-templates/video-guide.md) (≤ 10 min, MP4) | `<https://drive.google.com/file/d/.../view>` | `<TeamID>_video.mp4` | `<a1b2c3d4e5f60718>` |
| 2 | [Decision Log](./resource-templates/decision-log-template.md) (1 page, PDF) | `https://drive.google.com/file/d/1oIYLrhtufzGANXFGIlYpQyVJX4IQqlkN/view?usp=sharing` | `HM26-2F61_Decision_Log.pdf` | `FB99E85A35D2F6CD` |
| 3 | [Presentation](./resource-templates/presentation-template.md) (≤ 10 slides, PDF) | `<https://drive.google.com/file/d/.../view>` | `<TeamID>_presentation.pdf` | `<...>` |

<!--
Get the hash:
  macOS / Linux : shasum -a 256 <file>      (or sha256sum <file>)
  Windows       : certutil -hashfile <file> SHA256
Paste the first 16 characters.
-->

### Video Chapters

| Timestamp | Section |
|---|---|
| `00:00` | Part 1: Problem & target users |
| `00:40` | Part 1: Live demo, core flow |
| `01:50` | Part 1: Bad-input handling |
| `02:30` | Part 1: Offline / airplane mode |
| `03:00` | Part 2: Architecture overview |
| `04:30` | Part 2: Data model & APIs |
| `05:30` | Part 2: Key code walkthrough |
| `07:30` | Part 2: Decisions & trade-offs |
| `08:30` | Part 2: Scaling & limitations |
| `09:15` | Part 2: AI usage (see [ai.md](./ai.md)) |

---

## 5. Live MVP

| Field | Value |
|---|---|
| Live URL | `Local development & evaluation (Vite dev server) · See docs/setup.md` |
| Platform | `Responsive Web / Progressive Web Application (PWA)` |
| Test login (if any) | `No login credentials required · 1-click access to Citizen Portal, Field Worker Desk, and Admin Dashboard` |
| Sample data loaded? | `Yes · 18 seed complaints across 26 Mysuru jurisdictions and 5 contested buffer zones` |
| How to test offline mode | `Toggle Chrome DevTools Offline mode; app uses local cache, geocoding fallbacks, and rule heuristics. Full steps in docs/setup.md#6-testing-offline--low-connectivity-behavior` |
| If the live link is down | Follow [docs/setup.md](./docs/setup.md) |

---

## 6. Quick Reviewer Path (≤ 3 minutes)

<!-- Tell a reviewer exactly what to click to see your core value. Keep it to 3–5 steps. -->

1. `Launch the application at http://localhost:5173 and click "Launch Citizen Portal"`
2. `Select a category (e.g. C&D Debris), search or click "KR Circle" or "Ballal Circle", attach a photo, and submit to observe the Geo-Elastic priority scoring and tracking ID.`
3. `Navigate back and click "Launch Admin Dashboard" to view the 26-zone capacity matrix, observe the Bogadi - MCC Zone 3 spillover routing, and inspect the Inter-Agency Clearing Ledger vouchers.`
4. `Click "Open Field Worker Desk", select a Bogadi or MCC Zone 3 field profile, and inspect the task queue with GPS proximity range lock and on-site camera audit.`
5. `Return to the Citizen Portal with your tracking ID to view the verified resolution and test the 5-star rating feedback loop.`

---

## 7. Declaration

- [ ] All Drive links open in an incognito window with **Viewer** access (no "Request access").
- [ ] The video is one continuous recording, ≤ 10 minutes, Part 1 then Part 2.
- [ ] The decision log is one page and written by us in our own words.
- [ ] All AI tools used (development and in-product) are disclosed in [`ai.md`](./ai.md).
- [ ] No code specific to this challenge was written before 18 Sept 2026, 00:00 IST.
- [ ] We will not modify or replace any linked file after 20 Sept 2026, 23:59 IST.

**Submitted by:** `Panav K Bysani` · **Date/Time (IST):** `<20-09-2026 21:40>`
