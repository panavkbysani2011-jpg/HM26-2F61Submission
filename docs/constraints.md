# The Five Hard Constraints

[← Back to README](../README.md)

<!-- The problem statement names five constraints that decide whether a solution would hold up
in Mysuru. Be honest: ✅ handled · ⚠️ partial · ❌ not yet. Timestamps point to the video. -->

| # | Constraint | Status | Video |
|---|---|---|---|
| 1 | Fake, spam and harassment reports | `✅` | `<mm:ss>` |
| 2 | Unclear jurisdiction | `✅` | `<...>` |
| 3 | Prioritisation beyond "most votes" | `✅` | `<...>` |
| 4 | Bad input (duplicate, fake photo, wrong location, abuse) | `✅` | `<...>` |
| 5 | Works without internet | `❌` | `N/A` |

---

## 1. Fake, spam and harassment reports

- **Approach:** `We use OTP verification through SIM and email to stop bots from abusing the system. If the same person reports the issue more than once the system lets them know that the response has already been recorded. Posting again will not make the issue more urgent. Raise its priority. We allow up to two posts per session in case someone thinks the first post didn’t go through. All these posts, from the user get combined into a single record.
If ten different people report the garbage dump all ten reports are grouped under one problem group. The urgency level stays the same no matter how many people report it. The system knows that ten individuals reported it. The field worker only sees one task to handle. There’s no load or confusion. They just get one clear action to take.`
- **Anonymity trade-off:** `There is an anonymity trade-off: citizens must create an account. Log in to use the platform.. When they report a problem their personal identity and security details are kept private. Their name, phone number and other sensitive information are not shared publicly with the reported issue. The public only sees the problem description, not who reported it.`
- **Code:** `src/backend/services/spam_filter.py`


## 2. Unclear jurisdiction

- **Approach:** `We use a fuzzy buffer zone over contested borders such as the Bogadi edge and the MCC edge. If a location pin lands in this buffer zone the system checks the workload of the Bogadi office.`
- **What happens in a boundary case:** ` If the Bogadi office is overloaded with tasks the system sends the ticket automatically to the MCC depot when MCC has free equipment. The system then writes this in the inter‑agency ledger so that the MCC office receives payment from the Bogadi funds for the work.`
- **Code:** `src/<...>`

## 3. Prioritisation

- **Formula / rules:** `Priority is set by the weight of the category the size of the issue and how near the issue is to a main road. For example a large pile of waste on a ring road will get a higher rank than a broken streetlight on a small street. The priority orders and category ranks can also be changed later by the admins on the admin website if the city’s needs change.`
- **Why not simply "most votes":** `A voting system only helps busy or wealthier areas where people have smartphones. A dangerous chemical spill on a road, at night might get no votes but is a big danger. Our system uses physical impact instead of popularity.`
- **Code:** `src/<...>`

## 4. Bad input

| Input | What our system does |
|---|---|
| Duplicate report | `If three different people report the exact same pothole from different angles, the system groups them into one single incident ID so workers only have to do it once.` |
| Fake / unrelated photo | `We do not allow file uploads from the phone gallery for both citizens and workers. Everyone must use the live camera to take a picture at that exact moment. If a citizen takes a random fake photo, the system reviews it, marks it as invalid, and closes the grievance immediately` |
| Wrong or impossible location | `If a pin is dropped completely outside the Mysore district map, the system will reject it and show a location out of bounds error.` |
| Abusive message | `If a user writes an angry abusive message that actually contains a real problem, the system removes the bad words and keeps the useful description. The task stays open, but the user gets flagged and receives a warning.` |
| `Task not closed by worker` | `If a worker does not close a task in the app the system marks it as unfinished. This triggers an automated reminder system that depends on how serious the issue's. Over days the reminders get stronger - starting with important then very important, then urgent and finally very urgent. If the task remains open the system automatically sends the issue to officials for action.` |

## 5. Offline operation

- **What works offline:** `now nothing. We made a choice to not include support for working without internet for the 48-hour viable product. The focus was on the Geo-Elastic Routing Engine and the logic for balancing capacity. The platform needs an internet connection right now.`
- **How it syncs:** `Not applicable for this version of the hackathon project. (Our plan, for scaling includes using Service Workers to keep the user interface cached. Indexeddb to keep data ready to send. When the internet comes back a background sync will send the data).`
- **What does not work offline:** `The whole application does not work without internet. Loading the map sending a form and checking if a task is done all need 4G or WiFi.`
- **How to test:** see [setup.md](./setup.md#testing-offline-mode)
