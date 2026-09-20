# Setup & Run Instructions

[← Back to README](../README.md)

This guide allows hackathon evaluators to run Civic Mesh locally in under 3 minutes.

## Prerequisites

| Tool | Version | Recommended |
|---|---|---|
| Node.js | 18.x or 20.x | 20.12+ LTS |
| npm | 9.x or 10.x | Bundled with Node |
| Git | 2.x+ | Standard |

## 1. Clone & Enter Frontend

```bash
git clone https://github.com/panavkbysani2011-jpg/HM26-2F61Submission.git
cd HM26-2F61Submission/frontend
```

## 2. Environment Variables

Civic Mesh includes a working `.env.example` template with pre-configured project credentials:

```bash
cp .env.example .env
```

| Variable | Required | Example | Purpose |
|---|---|---|---|
| `VITE_GEMINI_API_KEY` | Optional | `AIzaSy...` | Powers multimodal AI vision audit of worker proof photos and citizen content moderation. If omitted, the app automatically falls back to deterministic rule-based heuristics without crashing. |
| `VITE_FIREBASE_PROJECT_ID` | Optional | `civic-mesh` | Firebase project identifier for optional cloud authentication and Firestore synchronization. |

> Never commit private API keys to git. The application is designed to operate completely self-contained out-of-the-box.

## 3. Install Dependencies

```bash
npm install --legacy-peer-deps
```

> **Note on `--legacy-peer-deps`**: Vite 8 and esbuild peer dependencies resolve smoothly with this flag.

## 4. Run Locally

```bash
npm run dev
```

Open your browser to:
```
http://localhost:5173
```

- **Demo Accounts & Access**: No credentials required. The landing page provides 1-click access to all three portals:
  - **Citizen Portal**: Public grievance reporting and tracking.
  - **Field Worker Desk**: 21-jurisdiction task dispatch, distance lock, and camera verification.
  - **Admin Command Dashboard**: 26-zone capacity matrix, contested corridor maps, and inter-agency clearing ledger.
- **Reset Demo Data**: Click the **Reset Demo** button in the top navigation bar at any point to restore the original 6 seed tickets, buffer zones, and fleet capacity states (Bogadi TP at 110% load, MCC Zone 3 at 43% load, and contested buffer zones at 0 active tasks).

## 5. Production Build Verification

To verify that the production build compiles with zero TypeScript or bundling errors:

```bash
npm run build
```

The optimized bundle is output to `frontend/dist/`.

## 6. Testing Offline & Low-Connectivity Behavior

1. Open `http://localhost:5173` and launch the **Citizen Portal** or **Field Worker Desk**.
2. Open Chrome DevTools (`F12`) -> **Network** tab -> toggle throttling to **Offline** (or toggle airplane mode on a mobile device).
3. If internet is lost or API keys are unavailable:
   - The interactive Leaflet map retains cached OpenStreetMap tiles for Mysuru.
   - Citizen intake uses local geocoding caches for KR Circle, Ballal Circle, and major junctions.
   - The AI vision verification seamlessly falls back to local rule-based heuristics so field workers can complete their shifts without being blocked.
4. When connectivity resumes, cloud state synchronization reconnects automatically.

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| Port 5173 already in use | Another local development server is active | Run `npm run dev -- --port 5174` or terminate the existing process. |
| Peer dependency warnings | Modern Vite / esbuild version resolution | Always install using `npm install --legacy-peer-deps`. |
| Map tiles loading blank | Offline mode or strict firewall blocking OSM tile servers | Ensure network access to `tile.openstreetmap.org` or test using the pre-cached landmark coordinates. |
