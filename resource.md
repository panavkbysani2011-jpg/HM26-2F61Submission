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
| Live URL | `<https://...>` |
| Platform | Web Platform (React 19 + TypeScript + Vite) |
| Test login (if any) | Citizen: `1-Click Selection` · Worker: `21-Zone Dispatch Roster` · Admin: `admin` / `devpass2026` · Language: `English / ಕನ್ನಡ Toggle` |
| Sample data loaded? | Yes — Seeded municipal work orders across Mysuru jurisdictions (Bogadi Town Panchayat initialized at 110% capacity, MCC Zone 3 at 43% capacity, buffer zones at 0 active tasks) |
| How to test offline mode | N/A — No offline mode (Civic Mesh operates as an online cloud-synchronized municipal dispatch and inter-agency clearing mesh) |
| If the live link is down | Follow [docs/setup.md](./docs/setup.md) |

---

## 6. Quick Reviewer Path (≤ 3 minutes)

1. **Intake at Contested Boundary**: Launch app → observe the top bar language toggle (`English` / `ಕನ್ನಡ`) → click **Citizen Portal** (1-click resident select) → select from 10 civic categories and choose pre-filled boundary location (*Bogadi Ring Road Junction*) → observe real-time AI geo-elastic boundary detection and duplicate clustering → click **Submit Civic Report**.
2. **Cross-Jurisdictional Spillover**: Notice the ticket automatically re-routes from overloaded Bogadi Town Panchayat (110% load) to adjacent MCC Zone 3 under dynamic capacity balancing, inheriting crew lead *Manjunatha S.* and vehicle *Canter KA-09-G-4412*.
3. **Field Worker Execution**: Switch to **Worker Desk** → select MCC Zone 3 operator from the 21-jurisdiction dispatch roster → view active work order with GPS distance lock → upload/capture completion photo and click **Complete Work Order** (verified by Gemini AI vision audit).
4. **Citizen Feedback Loop with Pre-Save AI Moderation**: Return to Citizen Portal → open **My Submissions** tab → rate the resolved ticket with 5 stars and enter text feedback → click **Submit Rating** → watch AI sanitize and restructure the review into a clean, professional summary.
5. **Admin & Worker Visibility**:
   - In **Worker Desk**, open the **Resolved Log** to see the assigned worker's completed work order display the citizen's 5-star rating and AI-moderated review.
   - Open **Admin Dashboard** (login with `admin` / `devpass2026`) → inspect the dynamic Capacity Matrix, GIS buffer corridor polygons, the AI-moderated review displayed next to the star rating on ticket cards, the inspection modal, and the automated Inter-Agency Clearing Ledger debit.

---

## 7. Declaration

- [ ] All Drive links open in an incognito window with **Viewer** access (no "Request access").
- [ ] The video is one continuous recording, ≤ 10 minutes, Part 1 then Part 2.
- [ ] The decision log is one page and written by us in our own words.
- [ ] All AI tools used (development and in-product) are disclosed in [`ai.md`](./ai.md).
- [ ] No code specific to this challenge was written before 18 Sept 2026, 00:00 IST.
- [ ] We will not modify or replace any linked file after 20 Sept 2026, 23:59 IST.

**Submitted by:** `Panav K Bysani` · **Date/Time (IST):** `<20-09-2026 21:40>`
