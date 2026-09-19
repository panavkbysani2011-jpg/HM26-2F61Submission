# Known Limitations & Future Scope

[← Back to README](../README.md)

## What Doesn't Work Yet

| Limitation | Why it exists | What we'd do next |
|---|---|---|
| Boundary data is approximate for 3 wards | No official GIS layer available in 72 h | Integrate MCC GIS / KGIS |
| Complete offline mode functionality | Scoped out for 48-hour MVP | Implement Service Workers and IndexedDB for full offline caching and syncing |

## Edge Cases We Don't Handle

- Overly reliance on human honesty; if zonal officers falsely report broken trucks to force MCC routing, the system blindly diverts work.
- Coordinated spoofing groups with real phones may still occasionally bypass some heuristics.
- Dense tree cover or poor weather might result in 50-meter GPS geofencing closure check failures for field workers. Manual override required in production.

## Scaling to All of Mysuru

| What breaks first | Rough numbers | Fix |
|---|---|---|
| System-wide capacity saturation | During Dasara, waste spikes across the city. If five adjacent zones hit 100 percent capacity simultaneously, the spillover logic could loop endlessly. | Add a fallback to a standard priority queue if no neighbor is below 90 percent capacity. |
| Inter-agency ledger depletion | If a small panchayat has a budget of 50,000 rupees and gets billed 60,000 for MCC spillovers, the math completely breaks. | Build a monthly quota throttle to stop spillover routing once a local budget runs out. |
| Spatial buffer querying | Checking 500-meter buffers for 5,000 daily active complaints using basic distance math will overload and slow down the server. | Switch to proper PostGIS spatial indexing instead of standard mathematical distance calculations. |

## Roadmap

1. Implement the monthly quota throttle for inter-agency cost transfers.
2. Integrate proper PostGIS spatial indexing for scalable distance calculations.
3. Establish manual override protocols for field worker GPS verification failures.
