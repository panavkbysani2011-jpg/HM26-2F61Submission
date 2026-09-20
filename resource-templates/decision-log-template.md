# Decision Log - Template (25% of total score)

[← Back to README](../README.md)

Team: SyntaxError-404 (HM26-2F61)
Sub-problem: Routing, Follow-through, and Verification
Date: 20 Sept 2026

Q1. What approach did we take, and what did we reject?

Our approach is a capacity-based routing engine that intentionally ignores rigid borders. It actively assigns tasks by looking at real-time equipment availability. We take the citizen's GPS coordinates, the issue category, and the current fleet status of the nearby depots. The engine first checks if that GPS pin sits inside a contested border buffer zone. If it does, it checks the workload of the home office. If that home office is drowning at over 100 percent capacity, the ticket is automatically sent to a neighboring depot that is underloaded, and a financial credit is logged for them in an inter-agency ledger. The final result is a confirmed task assignment and a cost-clearing entry. We used standard Mysore ward maps but added a 500-meter fuzzy buffer zone over the borders to make this magic happen.

We also seriously considered a strict point-in-polygon mapping approach, where every GPS pin is rigidly locked to whatever ward boundary it falls inside. That idea seemed incredibly appealing at first because it is mathematically simple, easy to code during a stressful hackathon, and perfectly matches how the government currently draws its maps. However, we decisively rejected that approach.

Q2. Why did we reject it? The trade-off

| Dimension | Our approach | Rejected alternative |
|---|---|---|
| Solving boundary disputes | Bypasses them entirely by paying neighbors to help. | Fails completely; offices just reject edge tickets. |
| Speed of cleanup | Fast; uses whatever truck is idle nearby. | Slow; waits endlessly for the home office to have a free truck. |
| System reliability | Depends entirely on human officers updating their fleet status honestly. | Always perfectly accurate to the strict legal map. |
| Build effort in 48 hours | Extremely high; requires deep capacity logic and a financial ledger. | Very low; it's just a standard map query. |

The most important thing for us was how fast the cleanup could actually happen. Getting hazardous trash off the street matters so much more than having a perfectly accurate map when public health is on the line.

The major price we decided to pay is that this system depends heavily on people being honest. We have to completely trust the officers in each zone to tell the truth about the tipper trucks and backhoes they are using. If an officer lies and says all their trucks are broken just to make the system send the heavy work to the central city corporation, our system will blindly follow that and send tasks away from them. We happily gave up forcing people to handle their own geographical areas in return for much quicker, practical solutions.

Q3. What breaks at the scale of all of Mysuru?

| What breaks first | Why | How we would fix it |
|---|---|---|
| System-wide capacity saturation | During Dasara, waste spikes dramatically across the whole city. If five adjacent zones hit 100 percent capacity simultaneously, the spillover logic could loop endlessly looking for a free truck. | Add a hard fallback to a standard priority queue if no neighbor is sitting below 90 percent capacity. |
| Inter-agency ledger depletion | If a small panchayat only has a budget of 50,000 rupees and gets billed 60,000 for city corporation spillovers in a week, the math completely breaks down. | Build a strict monthly quota throttle to stop spillover routing the moment a local budget runs out. |
| Spatial buffer querying | Checking 500-meter buffers for 5,000 daily active complaints using basic distance math will severely overload and slow down our server. | Switch to proper PostGIS spatial indexing instead of relying on standard mathematical distance calculations. |

The absolute first change we would make is adding the monthly quota throttle. Without it, smaller panchayats could literally go bankrupt paying for outside help in the very first week of operation.
