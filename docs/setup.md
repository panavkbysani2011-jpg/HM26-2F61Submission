# Setup & Run

[← Back to README](../README.md)

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | 20.x+ |
| Python | 3.11+ |
| PostgreSQL | 15+ (with PostGIS extension enabled) |

### 1. Clone

```bash
git clone <repo-url>
cd civic-mesh
```

### 2. Environment Variables

```bash
cp .env.example .env
```

| Variable | Required | Example | Purpose |
|---|---|---|---|
| `DATABASE_URL` | Yes | `postgresql://user:password@localhost:5432/civicmesh` | Connects the FastAPI backend to the PostgreSQL/PostGIS database |
| `VITE_API_BASE_URL` | Yes | `http://localhost:8000/api` | Tells the React frontend where to send API requests |

*(Never commit real secrets. Commit only `.env.example`.)*

### 3. Install & Seed Demo Data

Backend (FastAPI):

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run migrations and seed data
alembic upgrade head
python scripts/seed_demo_data.py  # Loads 120 sample complaints across Bogadi and MCC zones
```

Frontend (React/Vite):

```bash
cd ../frontend
npm install
```

### 4. Run

Open two terminal windows:

Terminal 1 (Backend):

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

Terminal 2 (Frontend):

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser. Test accounts are listed in resource.md.

### Testing Offline Mode

Status: Not Applicable (Scoped out for HackMysuru Phase 1 MVP)

As documented in [docs/constraints.md](./constraints.md), we made a strategic decision to allocate our 48-hour build time exclusively to the Geo-Elastic Routing Engine and the inter-agency capacity balancer.

Attempting to throttle the network to "Offline" in Chrome DevTools will currently break the application flow. Please test the routing and load-balancing features with an active internet connection.

### Troubleshooting

| Problem | Fix |
|---|---|
| Port 8000 / 5173 already in use | Run `lsof -i :8000` (Mac/Linux) or `netstat -ano` |
| PostGIS extension error during migration | Ensure you have connected to your PostgreSQL instance and run `CREATE EXTENSION postgis;` on the civicmesh database before running migrations. |
