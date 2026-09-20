# Setup & Run

[← Back to README](../README.md)

### Prerequisites

| Tool | Version |
|---|---|
| `<Node.js / Python / Docker>` | `<Pending final stack>` |

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
| `<API_URL / DB_URL>` | Yes | `<...>` | `<Pending backend finalization>` |

*(Never commit real secrets. Commit only `.env.example`.)*

### 3. Install & Seed Demo Data

```bash
<install command pending>
<migration command pending>
<seed command pending>  # Loads 120 sample complaints across Bogadi and MCC zones
```

### 4. Run

```bash
<run command pending>
```

Open `http://localhost:<port>` in your browser. Test accounts are listed in resource.md.

### Testing Offline Mode

**Status: Not Applicable (Scoped out for HackMysuru Phase 1 MVP)**

As documented in [docs/constraints.md](./constraints.md), we made a strategic decision to allocate our 48-hour build time exclusively to the Geo-Elastic Routing Engine and the inter-agency capacity balancer.

Attempting to throttle the network to "Offline" in Chrome DevTools will currently break the application flow. Please test the routing and load-balancing features with an active internet connection.

### Troubleshooting

| Problem | Fix |
|---|---|
| `<Port already in use>` | `<...>` |
