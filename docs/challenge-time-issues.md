# Challenge Time Bugs — Analysis & Recommendations

**Date:** February 12, 2026  
**Scope:** Time-related bugs affecting challenge display, join eligibility, and admin date handling.

---

## Executive Summary

The challenge system has several time-related issues stemming from:

1. **UI conflating multiple non-joinable states** — "Challenge Ended" is shown for all non-joinable challenges, including upcoming ones.
2. **Time Remaining calculation truncates days** — The timer only displays HH:MM:SS, discarding days, leading to confusing or incorrect counts for multi-day challenges.
3. **No explicit timezone handling** — Admin inputs and database storage lack clear EST semantics, causing ambiguity when users enter "local" times.
4. **Status badge not derived from dates** — The hero shows "ACTIVE CHALLENGE" for all challenges regardless of actual date state.
5. **datetime-local input interpretation** — Browser sends local time without timezone; server interprets it as UTC or server-local.

---

## Data Context (from JSON export)

| Challenge                 | Start (UTC)            | End (UTC)              | Status   |
| ------------------------- | ---------------------- | ---------------------- | -------- |
| The "Sunday Scaries" Half | 2026-02-12 00:00:00+00 | 2026-02-13 23:59:59+00 | active   |
| Test Challenge            | 2026-02-21 01:12:00+00 | 2026-02-22 01:12:00+00 | upcoming |

As of Feb 12, 2026: "Test Challenge" has not started (starts Feb 21 UTC / Feb 20 EST). It should never show "Challenge Ended."

---

## Problem 1: "Challenge Ended" Shown for Upcoming Challenges

**Location:** `src/routes/(app)/dashboard/_components/JoinChallengeButton.svelte` (lines 59–65)

**Root cause:** The component has only three branches:

1. `challenge.joinable && !challenge.isParticipating` → Show "Join Challenge"
2. `challenge.isParticipating` → Show "You're In"
3. Else → Show "Challenge Ended"

`isChallengeJoinable()` returns `false` for:

- `status !== ACTIVE`
- `!isActive`
- `now >= endDate` (ended)
- `now < startDate` (not started)

So any non-joinable challenge falls into the "Challenge Ended" branch, including **upcoming** challenges that have not started yet.

**Fix:** Add distinct states and labels:

- **Ended:** `now >= endDate` → "Challenge Ended"
- **Upcoming:** `now < startDate` → "Starts [date]" or "Starts in X days"
- **Not active:** `status !== ACTIVE` and not ended → "Not Active" or status-based label

---

## Problem 2: Time Remaining Truncates Days (HH:MM:SS Only)

**Location:** `src/lib/utils/timer-utils.ts` (lines 13–16)

```ts
const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
```

`diff % (24h)` discards full days. For a 10-day countdown:

- Actual remaining: ~10 days
- Displayed: only hours/minutes/seconds within the last day (e.g. `00:00:00` or partial day)

So the timer behaves correctly only when remaining time is under 24 hours.

**Fix:** Support a richer format such as:

- `DDd HH:MM:SS` for multi-day challenges
- Or `HH:MM:SS` only when under 24 hours
- Or a separate "days remaining" display above the timer

---

## Problem 3: Time Remaining Shows End Date for Upcoming Challenges

**Location:** `ChallengeUI.svelte.ts` (line 56), `timer-utils.ts`

The timer always formats time until `endDate`. For an upcoming challenge, the meaningful metric is usually **time until start**, not time until end. Showing "time until end" when the challenge has not started can be misleading.

**Recommendation:** Add logic such as:

- If `now < startDate`: show "Starts in X" (based on `startDate`)
- If `startDate <= now < endDate`: show "Time remaining: X" (based on `endDate`)

---

## Problem 4: No Explicit Timezone Handling (EST)

**Locations:**

- `src/routes/(app)/admin/_components/ChallengeForm.svelte` — `datetime-local` inputs
- `src/routes/(app)/admin/_components/ChallengeCard.svelte` — `formatDatetimeLocal()`, `datetime-local` inputs
- `src/routes/(app)/admin/+page.server.ts` — `new Date(startDateRaw)`, `new Date(endDateRaw)`

**Current behavior:**

- `datetime-local` sends strings like `2026-02-20T20:12` with no timezone.
- `new Date("2026-02-20T20:12")` is interpreted as **local time of the user’s machine** (or server at runtime).
- Database `timestamptz` stores UTC. The conversion depends on the environment that runs the code.

If admins are told "input in EST" but the server interprets values in its own timezone (e.g. UTC), you get incorrect stored times.

**Fix:** Make timezone explicit:

- Add clear UI text: e.g. "Dates in Eastern Time (EST/EDT)"
- Normalize on the server: e.g. use `America/New_York` and a library like `date-fns-tz` or `luxon` to parse and convert to UTC before DB insert
- Or accept EST date strings and append `Z` or `-05:00` / `-04:00` as appropriate before parsing

---

## Problem 5: ChallengeHero Always Shows "ACTIVE CHALLENGE"

**Location:** `src/routes/(app)/dashboard/_components/ChallengeHero.svelte` (lines 29–33)

The badge is hardcoded as "Active Challenge" for all challenges. There is no logic for:

- `upcoming` → e.g. "Upcoming Challenge"
- `completed` or ended → e.g. "Challenge Ended" or "Completed"
- `status !== active` but within date range → status-based label

**Fix:** Derive badge text from `challenge.status` and date checks (`now < startDate`, `now >= endDate`).

---

## Problem 6: Status vs. Dates Can Diverge

**Location:** `challenge-utils.ts` — `isChallengeJoinable()`

`status` is stored separately from `startDate`/`endDate`. So:

- A challenge can be `status: 'active'` even if `endDate` is in the past.
- Or `status: 'upcoming'` when dates say it should be active.

Join logic already uses dates for `startDate` and `endDate`. Consider:

- Using dates as the source of truth for joinability.
- Optionally deriving a "computed status" from dates (e.g. ended when `now >= endDate`) for UI, even if you keep the DB status for manual overrides.

---

## Problem 7: Date Display Without Timezone

**Locations:**

- `formatDate()` in `date-utils.ts` — uses `toLocaleDateString('en-US', {...})` with no timezone.
- `formatDate(challenge.startDate)` in `ChallengeHero.svelte`, `ChallengeDetails.svelte`.

`Date` objects from the DB are already UTC. `toLocaleDateString` uses the **browser’s local timezone**, so:

- An EST user and a PST user may see different dates for the same UTC timestamp.
- "FEB 11, 2026" vs "FEB 12, 2026" can differ by timezone.

**Recommendation:** If dates should be shown in EST, pass an explicit timezone:

```ts
new Date(date).toLocaleDateString('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'America/New_York'
});
```

---

## Problem 8: formatDatetimeLocal Uses Local Methods

**Location:** `admin/_components/ChallengeCard.svelte` (lines 37–40)

```ts
function formatDatetimeLocal(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
```

`getFullYear()`, `getMonth()`, `getDate()`, `getHours()` use the **local timezone** of the environment where the code runs. In a server-rendered context, that may not match the admin’s timezone (e.g. EST).

**Fix:** Format in the target zone (e.g. EST) using a timezone-aware formatter.

---

## Problem 9: Seed Uses CURRENT_DATE in Server Timezone

**Location:** `supabase/seed.sql` (lines 40–42)

```sql
CURRENT_DATE::timestamp with time zone,    -- Today at 00:00:00+00
(CURRENT_DATE + 1)::timestamp with time zone + TIME '23:59:59',
```

`CURRENT_DATE` in Postgres uses the **database server timezone**. If the DB is in UTC, you get midnight UTC, not midnight EST. That can misalign with admin expectations when "local" means EST.

**Fix:** If you want EST boundaries, use explicit conversion:

```sql
(CURRENT_DATE AT TIME ZONE 'America/New_York')::timestamptz
```

or equivalent logic for start/end.

---

## Problem 10: Join Blocked for Correct Reasons, Wrong Messaging

**Location:** `+page.server.ts` (lines 56–57, 104–106)

When `isChallengeJoinable(challenge)` is false, the server returns a generic error: "Challenge is not joinable. It may have ended or is not active." This covers:

- Challenge hasn’t started yet
- Challenge has ended
- Challenge status is not active

The user cannot tell which case applies.

**Fix:** Return more specific messages based on date and status:

- "This challenge hasn’t started yet. It begins on [date]."
- "This challenge has ended."
- "This challenge is not currently open for registration."

---

## Summary of Recommended Fixes

| Priority | Problem                                   | Recommended Action                                         |
| -------- | ----------------------------------------- | ---------------------------------------------------------- |
| **P0**   | "Challenge Ended" for upcoming challenges | Add separate UI states (ended / upcoming / not active)     |
| **P0**   | Time remaining truncates days             | Support DDd HH:MM:SS or days + HH:MM:SS                    |
| **P0**   | Wrong time for upcoming challenges        | Show "Starts in X" when `now < startDate`                  |
| **P1**   | No EST handling on admin input            | Parse EST explicitly and convert to UTC before DB          |
| **P1**   | Hero badge always "Active"                | Derive badge from status and dates                         |
| **P2**   | Date display timezone                     | Use `timeZone: 'America/New_York'` for user-facing dates   |
| **P2**   | `formatDatetimeLocal` in admin            | Use timezone-aware formatting for EST                      |
| **P2**   | Generic join error message                | Return specific reasons (not started / ended / not active) |
| **P3**   | Seed uses server timezone                 | Use explicit EST conversion if seed is meant to be EST     |
| **P3**   | Status vs. dates divergence               | Consider a derived/computed status from dates for UI       |

---

## Technical Notes

- **Schema:** `start_date` and `end_date` use `timestamp with time zone`; storage is correct.
- **Parsing:** `new Date(isoString)` and `new Date("2026-02-20T20:12")` behave as described above; timezone handling depends on the string format and environment.
- **`datetime-local`:** Always sends a local datetime string with no timezone. Explicit EST handling requires server-side logic.
