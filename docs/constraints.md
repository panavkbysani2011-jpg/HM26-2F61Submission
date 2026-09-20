# The Five Hard Constraints

[← Back to README](../README.md)

| # | Constraint | Status | Video |
|---|---|---|---|
| 1 | Fake, spam and harassment reports | ✅ | `<mm:ss>` |
| 2 | Unclear jurisdiction | ✅ | `<mm:ss>` |
| 3 | Prioritisation beyond "most votes" | ✅ | `<mm:ss>` |
| 4 | Bad input (duplicate, fake photo, wrong location, abuse) | ✅ | `<mm:ss>` |
| 5 | Works without internet | ❌ | N/A |

---

## 1. Fake, spam and harassment reports

- **Approach:** We use OTP verification through SIM and email to stop bots from abusing the system. We know people get frustrated and might click submit five times if their internet is slow. So, if the same person reports the issue more than once, the system gently lets them know their response is already recorded. Posting again won't magically make the issue more urgent. We allow up to two posts per session just in case they feel the first one failed, and then we combine them into a single record. If ten completely different people report the same massive garbage dump, all ten reports are grouped into one single "Problem Group". The urgency level stays exactly the same, but the system logs that ten individuals care about it. The most important part? The poor field worker only sees ONE clear task to handle. No spam, no confusion, just one clear action to take.
- **Anonymity trade-off:** We made a conscious trade-off here. Citizens absolutely must create an account and log in. We need this to hold spammers accountable. However, when they report a problem, their personal identity, name, and phone number are kept completely private. The public only ever sees the problem description, never who reported it.
- **Code:** `<Code path pending>`

## 2. Unclear jurisdiction

- **Approach:** This is where we shine. We use a fuzzy buffer zone over highly contested borders, like the Bogadi and MCC edge. If a location pin lands right in this messy buffer zone, the system doesn't throw a "not my ward" error. It actively checks the real-time workload of the Bogadi office.
- **What happens in a boundary case:** If the Bogadi office is drowning in tasks and overloaded, the system automatically sends the ticket to the MCC depot if MCC has free equipment sitting idle. The system then securely logs this in an inter-agency ledger, ensuring the MCC office actually gets paid from the Bogadi funds for stepping up and doing the work.
- **Code:** `<Code path pending>`

## 3. Prioritisation

- **Formula / rules:** Priority is heavily driven by the weight of the category, the physical size of the issue, and how dangerously close it is to a main arterial road. For example, a massive pile of concrete waste blocking the ring road will instantly override a broken streetlight on a quiet residential cul-de-sac. Our admins can also tweak these priority orders later if the city’s immediate needs change (like during monsoon season).
- **Why not simply "most votes":** A voting system is fundamentally flawed because it only helps wealthier, crowded areas where everyone has a smartphone. A highly dangerous chemical spill on a dark peripheral road at night might get zero votes, but it is a massive civic hazard. Our system uses real physical impact to prioritize, completely ignoring popularity contests.
- **Code:** `<Code path pending>`

## 4. Bad input

| Input | What our system does |
|---|---|
| Duplicate report | If three different citizens report the exact same pothole from three different angles, the system aggressively groups them into one single incident ID. Workers only have to fix it once. |
| Fake / unrelated photo | We completely disabled file uploads from the phone gallery for both citizens and workers. Everyone must use the live camera to take a picture at that exact moment. If a citizen snaps a random fake photo, the system reviews it, marks it as invalid, and immediately closes the grievance. |
| Wrong or impossible location | If a pin is dropped completely outside our mapped Mysore district, the system outright rejects it and shows a "location out of bounds" error. |
| Abusive message | If an angry user writes an abusive message that actually contains a valid civic problem, we don't delete the ticket. The system strips out the bad words, keeps the useful description, and flags the user with a warning. The task stays open. |
| Task not closed by worker | If a worker fails to close a task in the app, the system marks it as unfinished and triggers an automated, escalating reminder system. Over a span of days, reminders get stronger: important, very important, urgent, and finally very urgent. If still ignored, it automatically alerts higher officials. |

## 5. Offline operation

- **What works offline:** Right now, absolutely nothing. We made a highly strategic, conscious decision to scope out offline support for this 48-hour MVP. We poured 100% of our focus into building the Geo-Elastic Routing Engine and the capacity balancing logic. The platform requires an internet connection today.
- **How it syncs:** Not applicable for this specific hackathon build. (However, our scaling roadmap involves using Service Workers to cache the UI and IndexedDB to queue data. When the internet connects, a background sync will handle the payload).
- **What does not work offline:** Everything. Loading the map, sending a form, and taking a completion photo all currently require 4G or WiFi.
- **How to test:** Please see `docs/setup.md` on why you should test this with an active connection.
