# Known Limitations & Future Scope

[← Back to README](../README.md)

## What Doesn't Work Yet

| Limitation | Why it exists | What we'd do next |
|---|---|---|
| Boundary data is approximate for a few transitioning wards | We couldn't get our hands on the official, finalized GIS layer from the government in a 72-hour window. | We'll integrate directly with MCC GIS or KGIS APIs to pull the true, legal gazette boundaries. |
| Complete offline mode functionality | We aggressively scoped this out for the 48-hour MVP to make sure the Geo-Elastic Routing Engine was flawless. | We will implement Service Workers and IndexedDB to cache the forms and queue the image payloads for when the network restores. |

## Edge Cases We Don't Handle

- **Heavy reliance on human honesty:** Our routing logic assumes zonal officers are telling the truth about their fleet. If an officer falsely reports all their trucks as "broken" just to force the MCC to do their work, the system will blindly divert the tasks away from them.
- **Coordinated Spoofing:** While we stop basic bot spam, a highly coordinated group of real humans with real phones dropping pins in the exact same location could still occasionally bypass our early heuristics.
- **Geofencing Failures:** We demand a strict 50-meter GPS lock for field workers to close a task. Dense tree cover, severe monsoon weather, or cheap phone hardware might cause this to fail, trapping the worker. We desperately need to build a manual override protocol for production.

## Scaling to All of Mysuru

| What breaks first | Rough numbers | How we would fix it |
|---|---|---|
| System-wide capacity saturation | During Dasara, waste spikes everywhere. If five adjacent zones hit 100 percent capacity simultaneously, our spillover routing could loop endlessly looking for a free truck. | We'll add a hard fallback to a standard priority queue if no neighboring zone is sitting below 90 percent capacity. |
| Inter-agency ledger depletion | If a small panchayat only has a budget of 50,000 rupees and gets billed 60,000 rupees for MCC spillovers in a single week, the entire municipal math breaks down. | We must build a monthly quota throttle to hard-stop spillover routing the moment a local budget runs dry. |
| Spatial buffer querying | Checking complex 500-meter buffer overlaps for 5,000 daily active complaints using basic distance math will absolutely choke and slow down the server. | We will migrate fully to robust PostGIS spatial indexing instead of relying on standard mathematical distance calculations. |

## Roadmap

1. Build and enforce the monthly quota throttle for inter-agency cost transfers.
2. Upgrade our database to utilize proper spatial indexing for massive, scalable distance calculations.
3. Establish a secure, reviewable manual override protocol for field workers when GPS verification inevitably fails in bad weather.
