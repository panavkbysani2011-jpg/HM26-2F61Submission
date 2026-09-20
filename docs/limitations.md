# Known Limitations & Future Scope

[← Back to README](../README.md)

## What Doesn't Work Yet

| Limitation | Why it exists | What we'd do next |
|---|---|---|
| `Approximate Buffer Zones` | `Boundary data for corridors like Bogadi-MCC Zone 3 uses estimated coordinate bounds instead of precise cadastral lines. The official KGIS (Karnataka GIS) API needs credentials, which were not available, during the MVP development phase.` | `We need to intergrate KGIS or Mysuru Urban Development Authority (MUDA) REST endpoints for exact cadastral mapping.` |
| `Simulated Ledger Transactions` | `The Inter‑Agency Ledger calculates the ₹ debit for spillover routing with accuracy but the Inter‑Agency Ledger does not handle real treasury transfers.` | `To manage those transfers we need RBI‑approved municipal banking APIs such, as PFMS.` |
| `No Offline Worker Mode` | `Field operators lose the ability to view or update tasks when they enter zero-network zones, like drainage repairs.` | `The MVP uses Firebase SDKs but does not have a fully configured ServiceWorker or IndexedDB persistence layer.` |

## Edge Cases We Don't Handle

- `GPS Spoofing: Bad people are changing their devices GPS on purpose to put tickets into areas that are being argued over. This makes the debt in a Panchayats Inter-Agency Ledger go up on purpose.`
- `Multi-Agency Dependencies: A problem that affects more than one type of situation. For example a broken pipe at Vani Vilas Water Works that also makes a pothole on an MCC road. Now the AI deals with it based on the main type of problem not by splitting the ticket.`
- `Rapid Duplicate Spam During Quota Limits: If the Civic Mesh AI verification runs into a limit, on how times it can use an API (like what happened during testing) the spam protection stops for a moment. This can let tickets go through without being checked.`

## Scaling to All of Mysuru

<!-- Expands Decision Log Q3. Keep the two consistent. -->

| What breaks first | Rough numbers | Fix |
|---|---|---|
| Firebase Live Listeners | `~10,000 concurrent active citizen/worker connections or 50,000 live tickets.` | `Replace global live listeners on the Capacity Matrix with standard paginated queries, implement Redis caching, and automatically archive resolved tickets to cold storage.` |
| AI API Rate Limits | `~500 image/text verification requests per minute during heavy monsoon season storms.` | `Batch process non-critical ticket triage, upgrade to enterprise API tiers, or deploy a localized, lightweight AI model strictly for image classification.` |
| Worker Roster UI| `> 100 field operators across all of Mysuru district.` | `The current visual grid login will become unscrollable. Transition to a standard SSO login with automated JWT-based role assignments.` |

## Roadmap

1. `Pilot Deployment: A 30-day live field test will run strictly within MCC Zone 3 and the boundaries of the Bogadi Town Panchayat. This test is designed to operate in isolation ensuring no impact on areas.`
2. `WhatsApp Integration: Citizens can now skip the web portal completely. They can send photos and location pins directly to the Civic Mesh WhatsApp bot. The system will process these messages automatically. Create a grievance ticket without any manual intervention.`
3. `Kannada Voice-to-Text Reporting: We are expanding the existing Kannada UI toggle feature. Rural citizens will be able to speak their grievances in Kannada. An AI-powered transcription tool will convert the words into text. The system will then auto-categorize the complaint based on content and urgency.`
4. `IoT Ticketing: Smart city hardware, such as water-level sensors, in stormwater drains will be integrated into the system. These sensors will detect rising water levels and trigger "High Priority" tickets before any citizen reports an overflow. This proactive approach aims to reduce response time and prevent flooding incidents.`
