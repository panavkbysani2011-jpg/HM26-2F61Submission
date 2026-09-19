# Decision Log - Template (25% of total score)

[← Back to README](../README.md)

Team: SyntaxError-404 (HM26-2F61)
Sub-problem: Routing, Follow-through, and Verification
Date: 20 Sept 2026

Q1. What approach did we take, and what did we reject?

Our approach is a capacity-based routing engine that does not stick to hard borders. It assigns tasks by looking at real-time equipment availability. The inputs are the citizens GPS coordinates, the issue category and the current fleet status of depots. The engine first checks whether the GPS pin sits inside a contested border buffer zone. If it does it looks at the workload of the home office. If the home office is over one hundred percent capacity the ticket is automatically sent to the depot that is underloaded and a financial credit is logged for that depot in an inter-agency ledger. The final result is a confirmed task assignment to the available depot and a cost-clearing entry. We used standard Mysore ward maps. Added a 500-meter fuzzy buffer zone, over the borders to make this happen.

We also considered a point-in-polygon mapping, where every GPS pin is locked to whatever ward boundary it falls inside. That idea seemed appealing at first because it is mathematically simple, easy to code in a short hackathon and matches how the government currently draws its administrative maps. However we rejected that approach.

Q2. Why did we reject it? The trade-off

| Dimension | Our approach | Rejected alternative |
|---|---|---|
| Solving boundary disputes | Bypasses them by paying neighbors to help | Fails completely; offices just reject edge tickets |
| Speed of cleanup | Fast, uses whatever truck is idle nearby | Slow, waits for the home office to have a free truck |
| System reliability | Depends entirely on officers updating fleet status | Always accurate to the strict legal map |
| Build effort in 48 hours | High, requires capacity logic and ledger | Low, just a standard map query |

The important thing for us was how fast the cleanup could happen. Getting trash off the street is way more important than having the map when there are dangers to public health.

The price we decided to pay depends a lot on people being honest. We completely trust the officers in each zone to tell the truth about the tipper trucks and backhoes they are using. If an officer lies and says all their trucks are not working to make the system send work to the central city corporation our system will follow that and send tasks away from them. We gave up making people handle their areas by force in return, for quicker solutions.

Q3. What breaks at the scale of all of Mysuru?

| What breaks first | Why | How we would fix it |
|---|---|---|
| System-wide capacity saturation | During Dasara, waste spikes across the city. If five adjacent zones hit 100 percent capacity simultaneously, the spillover logic could loop endlessly looking for a free truck. | Add a fallback to a standard priority queue if no neighbor is below 90 percent capacity. |
| Inter-agency ledger depletion | If a small panchayat has a budget of 50,000 rupees and gets billed 60,000 for city corporation spillovers, the math completely breaks. | Build a monthly quota throttle to stop spillover routing once a local budget runs out. |
| Spatial buffer querying | Checking 500-meter buffers for 5,000 daily active complaints using basic distance math will overload and slow down the server. | Switch to proper PostGIS spatial indexing instead of standard mathematical distance calculations. |

The single change we would make first is adding the monthly quota throttle. Without it, smaller panchayats could go bankrupt paying for outside help in the very first week of operation.
