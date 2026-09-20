# Decision Log — Architecture & Persistence Strategy

[← Back to README](../README.md)

**Team:** SyntaxError-404 (`HM26-2F61`)  
**Sub-problem:** Multi-Jurisdiction Routing, Follow-Through & Verification  
**Date:** 20 September 2026

---

## Q1. What approach did we take, and what did we reject?

**Our approach:** Serverless Client-First Architecture with Firebase (Authentication & Cloud Firestore) coupled with an in-browser local storage cache for instant, zero-latency civic workflow execution.

*How it works:* Citizen grievance reports, worker updates, and municipal capacities are computed and stored directly on the client with full offline resilience, while asynchronously syncing to Firebase Firestore when a connection is present. This ensures zero downtime, instant rendering of all 26 Mysuru jurisdictions, and seamless operation even in patchy rural panchayat network zones.

**Alternative we considered and rejected:** Custom Node.js / Express REST API Backend with PostgreSQL / PostGIS database.

*Why it was considered:* A traditional relational database with spatial PostGIS extensions appeared attractive for strictly enforcing SQL foreign keys and server-side geospatial polygon intersection queries.

---

## Q2. Why did we reject it? The trade-off

| Dimension | Our Approach (Firebase + Local Cache) | Rejected Alternative (Custom REST API + PostgreSQL) |
|---|---|---|
| **Offline Resilience** | Instant offline caching; issues save directly to local storage and queue for sync. | Hard fail when field workers or citizens lose cell signal unless complex offline DB sync is built. |
| **Real-time Live Sync** | Native Firestore reactive listeners across Citizen, Worker, and Admin views. | Requires maintaining persistent WebSocket servers or polling endpoints every few seconds. |
| **Operational Overhead** | 100% serverless, zero server maintenance, zero cold-start API crashes during demo. | Requires hosting VM instances, configuring reverse proxies, and maintaining database migrations. |
| **Development Velocity (72h)** | Zero backend plumbing; focus on Mysuru buffer routing, GIS polygons, and Gemini AI. | High engineering time spent writing CRUD boilerplate and schema migrations. |

**The Trade-off & Cost Accepted:**  
We consciously accepted the downside of limited complex multi-table SQL queries and the inability to run heavy server-side PostGIS spatial joins. Instead, we implemented deterministic client-side geospatial bounding box checks and radius distance mathematics (`detectBufferZoneId` and `isNearby`). We also accept that without server-side validation rules, Firestore security rules must be strictly configured to prevent unauthorized writes.

---

## Q3. What breaks at the scale of all of Mysuru?

*Context: 65 MCC wards + 4 Town Panchayats + 13 Gram Panchayats, tens of thousands of daily grievances, and Dasara festival surges.*

| What breaks first | Why (with rough estimates) | How we would fix it |
|---|---|---|
| **Firestore Concurrent Snapshot Listeners** | ~15,000 concurrent citizen and worker connections listening to the entire issue collection will hit connection and read quota limits rapidly. | Switch from open snapshot listeners to cursor-based paginated queries (`limit(20)`), and implement Redis caching for aggregate capacity numbers. |
| **Client-Side Duplicate Proximity Search** | O(N) duplicate comparisons across >50,000 active tickets becomes CPU-intensive on budget mobile phones. | Implement S2 / H3 hexagonal spatial indexing or Geohash spatial bucketing so tickets are only compared against their immediate geohash cell. |
| **Gemini AI Verification Rate Limits** | 500+ completion photos per minute during monsoon emergencies will exceed standard API quota tiers. | Implement an asynchronous queue with BullMQ, queue non-urgent triage, and deploy a lightweight on-premise vision classification model. |

**Closing priority:**  
The single change we would make first is transitioning the geospatial queries to **H3 hexagonal spatial bucketing**, enabling sub-millisecond proximity lookups across the entirety of Mysuru district without scanning the entire ticket array.
