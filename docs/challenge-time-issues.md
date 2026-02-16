# Challenge Time Bugs — Analysis & Recommendations

**Date:** February 12, 2026  
**Scope:** Time-related bugs affecting challenge display, join eligibility, and admin date handling.

---

## Executive Summary

The challenge system had several time-related issues. **Most are now fixed** (Problems 1–9, 11). **Remaining:** Problem 10 (generic join error message). See Summary table for status.

---

## Data Context (from JSON export)

| Challenge                 | Start (UTC)            | End (UTC)              | Status   |
| ------------------------- | ---------------------- | ---------------------- | -------- |
| The "Sunday Scaries" Half | 2026-02-12 00:00:00+00 | 2026-02-13 23:59:59+00 | active   |
| Test Challenge            | 2026-02-21 01:12:00+00 | 2026-02-22 01:12:00+00 | upcoming |

As of Feb 12, 2026: "Test Challenge" has not started (starts Feb 21 UTC / Feb 20 EST). It should never show "Challenge Ended."

---

## Problem 1: "Challenge Ended" Shown for Upcoming Challenges — **Fixed**

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

**Fix (implemented):** `getChallengeJoinDisplayState()` returns JOINABLE, PARTICIPATING, ENDED, NOT_ACTIVE. Upcoming shows "Starts [date]". JoinChallengeButton branches on `joinDisplayState`.

---

## Problem 2: Time Remaining Truncates Days (HH:MM:SS Only) — **Fixed** (HH:MM:SS Only)

**Location:** `src/lib/utils/timer-utils.ts` (lines 13–16)

```ts
const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
```

`diff % (24h)` discards full days. For a 10-day countdown:

- Actual remaining: ~10 days
- Displayed: only hours/minutes/seconds within the last day (e.g. `00:00:00` or partial day)

So the timer behaves correctly only when remaining time is under 24 hours.

**Fix (implemented):** `timer-utils.ts` returns `DDd HH:MM:SS` when days > 0, else `HH:MM:SS`.

---

## Problem 3: Time Remaining Shows End Date for Upcoming Challenges — **Fixed**

**Location:** `ChallengeUI.svelte.ts` (line 56), `timer-utils.ts`

The timer always formats time until `endDate`. For an upcoming challenge, the meaningful metric is usually **time until start**, not time until end. Showing "time until end" when the challenge has not started can be misleading.

**Fix (implemented):** `challengeTimeState` derives `targetDate` (start when UPCOMING, end when ACTIVE) and `label` ("Time Until" vs "Time Remaining"). CountdownTimer uses both.

---

## Problem 4: No Explicit Timezone Handling (EST) — **Fixed**

**Locations:**

- `src/routes/(app)/admin/_components/ChallengeForm.svelte` — `datetime-local` inputs
- `src/routes/(app)/admin/_components/ChallengeCard.svelte` — `formatDatetimeLocal()`, `datetime-local` inputs
- `src/routes/(app)/admin/+page.server.ts` — `new Date(startDateRaw)`, `new Date(endDateRaw)`

**Current behavior:**

- `datetime-local` sends strings like `2026-02-20T20:12` with no timezone.
- `new Date("2026-02-20T20:12")` is interpreted as **local time of the user’s machine** (or server at runtime).
- Database `timestamptz` stores UTC. The conversion depends on the environment that runs the code.

If admins are told "input in EST" but the server interprets values in its own timezone (e.g. UTC), you get incorrect stored times.

**Fix (implemented):** `src/lib/utils/datetime-utils.ts` uses Luxon with `America/New_York`. Admin forms show "Dates in Eastern Time (EST/EDT)". Server uses `parseEasternToUtc()` for create/update.

---

## Problem 5: ChallengeHero Always Shows "ACTIVE CHALLENGE" — **Fixed**

**Location:** `src/routes/(app)/dashboard/_components/ChallengeHero.svelte` (lines 29–33)

The badge is hardcoded as "Active Challenge" for all challenges. There is no logic for:

- `upcoming` → e.g. "Upcoming Challenge"
- `completed` or ended → e.g. "Challenge Ended" or "Completed"
- `status !== active` but within date range → status-based label

**Fix (implemented):** Badge derived from `challengeTimeState.status`: "Upcoming Challenge", "Active Challenge", or "Challenge Ended".

---

## Problem 6: Status vs. Dates Can Diverge — **Fixed**

**Location:** `challenge-utils.ts` — `isChallengeJoinable()`

`status` is stored separately from `startDate`/`endDate`. So:

- A challenge can be `status: 'active'` even if `endDate` is in the past.
- Or `status: 'upcoming'` when dates say it should be active.

**Fix (implemented):** `isChallengeJoinable()` uses `now >= endDate`. `getChallengeJoinDisplayState()` uses `getChallengeTimeStateFromDates()`. UI uses date-derived `challengeTimeState`.

---

## Problem 7: Date Display Without Timezone — **Fixed**

**Locations:**

- `formatDate()` in `datetime-utils.ts` — formats in EST.
- `formatDate(challenge.startDate)` in `ChallengeHero.svelte`, `ChallengeDetails.svelte`.

`Date` objects from the DB are already UTC. `toLocaleDateString` uses the **browser’s local timezone**, so:

- An EST user and a PST user may see different dates for the same UTC timestamp.
- "FEB 11, 2026" vs "FEB 12, 2026" can differ by timezone.

**Fix (implemented):** `formatDate()` in `datetime-utils.ts` uses Luxon to format in `America/New_York`.

---

## Problem 8: formatDatetimeLocal Uses Local Methods — **Fixed**

**Location:** `admin/_components/ChallengeCard.svelte` (lines 37–40)

```ts
function formatDatetimeLocal(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
```

`getFullYear()`, `getMonth()`, `getDate()`, `getHours()` use the **local timezone** of the environment where the code runs. In a server-rendered context, that may not match the admin’s timezone (e.g. EST).

**Fix (implemented):** `formatDatetimeForInput()` in `datetime-utils.ts` uses Luxon to format UTC dates in EST for `datetime-local` inputs.

---

## Problem 9: Seed Uses CURRENT_DATE in Server Timezone — **Fixed**

**Location:** `supabase/seed.sql`

`CURRENT_DATE` in Postgres uses the **database server timezone**. If the DB is in UTC, you get midnight UTC, not midnight EST.

**Fix (implemented):** Use explicit EST conversion so seed matches app timezone:

```sql
(CURRENT_DATE AT TIME ZONE 'America/New_York')                    -- Midnight EST today → UTC
(CURRENT_DATE + 1) AT TIME ZONE 'America/New_York' + INTERVAL '23 hours 59 minutes 59 seconds'  -- 23:59:59 EST tomorrow → UTC
```

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

## Problem 11: Status Column Redundant with Dates — **Fixed (client-side)**

**Location:** `challenges.status` (DB), `challenge.status` (client), layout sync in `+layout.server.ts`

**Root cause:** Status is stored separately from `startDate`/`endDate` but can always be derived from them:

- `now < startDate` → UPCOMING
- `startDate <= now < endDate` → ACTIVE
- `now >= endDate` → COMPLETED

This creates sync drift (layout must update status on load) and two sources of truth.

**Plan:**

1. **Client-side:** Stop using `challenge.status` for UI logic. Introduce a derived value (e.g. `challengeTimeState` or `effectiveStatus`) computed from dates in `ChallengeUI`. Use it for countdown target/label, join display state, list styling, hero badge, etc. The derived value depends on `timeLeft` so it updates automatically when time crosses boundaries.
2. **Future migration:** Remove the `status` column from the DB. Replace status-based queries with date-based conditions (`WHERE start_date <= now() AND end_date > now()`). Remove layout sync.
3. **For now:** Keep the DB `status` column for backward compatibility. All client logic should use the derived value instead of `challenge.status`.

**Fix (implemented):** Client uses `challengeTimeState` (derived from dates) for all UI. DB `status` column and layout sync retained for now; migration is future work.

**Note:** If admin overrides (e.g. end early, pause) are needed later, reintroduce status as an optional override.

---

## Summary of Recommended Fixes

| Priority | Problem                                   | Status | Action                                                      |
| -------- | ----------------------------------------- | ------ | ----------------------------------------------------------- |
| **P0**   | "Challenge Ended" for upcoming challenges | Fixed  | `joinDisplayState`, "Starts [date]" for upcoming            |
| **P0**   | Time remaining truncates days             | Fixed  | `DDd HH:MM:SS` in timer-utils                               |
| **P0**   | Wrong time for upcoming challenges        | Fixed  | `challengeTimeState.targetDate` and `.label`                 |
| **P1**   | No EST handling on admin input            | Fixed  | `datetime-utils.ts`, `parseEasternToUtc`                    |
| **P1**   | Hero badge always "Active"                | Fixed  | Badge from `challengeTimeState.status`                       |
| **P2**   | Date display timezone                     | Fixed  | `formatDate` in datetime-utils uses EST                     |
| **P2**   | `formatDatetimeLocal` in admin            | Fixed  | `formatDatetimeForInput` in datetime-utils                   |
| **P2**   | Generic join error message                | Open   | Return specific reasons (not started / ended / not active)  |
| **P3**   | Seed uses server timezone                 | Fixed  | `AT TIME ZONE 'America/New_York'` in seed.sql                 |
| **P3**   | Status vs. dates divergence               | Fixed  | Date-derived `challengeTimeState`, `isChallengeJoinable`   |
| **P3**   | Status column redundant with dates        | Fixed  | Client derives from dates; DB migration future work          |

---

## Technical Notes

### Future: Remove Status Column

Status is derived from dates on the client. The DB `status` column is retained for now but should be removed in a future migration. All client logic should use the derived `challengeTimeState` (or equivalent) instead of `challenge.status`. See Problem 11.

- **Schema:** `start_date` and `end_date` use `timestamp with time zone`; storage is correct.
- **`datetime-utils.ts`:** Single source for EST handling. Uses Luxon with `APP_TIMEZONE = 'America/New_York'`. Exports: `parseEasternToUtc`, `formatDate`, `formatDatetimeForInput`, `formatDateRange`.
- **Parsing:** Admin form values parsed via `parseEasternToUtc()`; datetime-local strings treated as Eastern and converted to UTC.
