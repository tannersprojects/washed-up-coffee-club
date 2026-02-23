# Contribution Recalculation Options

**Purpose:** Design options for keeping `challenge_participants` cached totals (`result_distance`, `result_time`) in sync when `challenge_contributions` are modified.

---

## Background

When a Strava activity is processed, we:

1. Insert a row into `challenge_contributions` (distance, time, etc.)
2. Update the corresponding `challenge_participants` row with new cached totals

The participant totals are derived from contributions:

- **best_effort:** Max `distance` across contributions
- **cumulative:** Sum of `distance` across contributions
- **segment_race:** Min `time` across contributions

If a contribution is later edited, deleted, or invalidated, the participant's cached totals become stale.

---

## When Recalculation Is Needed

| Scenario | Impact |
|----------|--------|
| Contribution **deleted** | Totals include a run that no longer exists |
| Contribution **edited** (distance/time) | Totals use old values |
| Contribution **invalidated** (`is_valid = false`) | Totals include a disqualified run |
| Strava activity **updated** (re-synced) | Contribution values may change if we update from Strava |

---

## Options

### Option 1: Explicit Recalc on Edit/Delete

**How it works:** When the app edits or deletes a contribution, call a `recalculateParticipant(participantId)` (or similar) function in the same request. No trigger, no extra API.

**Flow:**
```
User edits/deletes contribution → Server action → Update/delete contribution → recalculateParticipant(participantId) → Update participant
```

**Pros:**
- Simple, no new infrastructure
- Recalc logic stays in TypeScript (reuse `computeNextParticipantState`-style logic)
- Synchronous: totals are correct before response

**Cons:**
- Only works when changes go through the app
- Direct DB edits, SQL scripts, or future tooling bypass recalc

**Best for:** Edits/deletes are rare and only via the app.

---

### Option 2: DB Trigger → API (Webhook-Style)

**How it works:** A trigger on `challenge_contributions` (INSERT/UPDATE/DELETE) fires `pg_net` to POST an API endpoint (e.g. `/api/recalculate-participant`) with the affected `participant_id`(s).

**Flow:**
```
Any change to challenge_contributions → DB trigger → pg_net HTTP request → /api/recalculate-participant → Fetch contributions, recompute totals, update participant
```

**Trigger considerations:**
- **INSERT:** `NEW.participant_id` (we already update inline in `processActivityForChallenges`; trigger would be redundant for inserts from our app)
- **UPDATE:** `OLD.participant_id` (or `NEW` if participant changed)
- **DELETE:** `OLD.participant_id`

One activity can contribute to multiple challenges, so one contribution change affects exactly one participant. The API should accept `participantId` and recalc that participant's totals from all their contributions for that challenge.

**Pros:**
- Works for direct DB changes, SQL scripts, future admin tools
- Decoupled: same pattern as Strava webhook (trigger → pg_net → API)
- Logic stays in TypeScript

**Cons:**
- Async: brief window where totals are stale
- Extra failure mode (network, API down)
- More moving parts

**Best for:** Defense-in-depth; contributions may be modified outside the app.

---

### Option 3: DB Trigger with Inline SQL

**How it works:** A trigger on `challenge_contributions` recalculates the participant's totals directly in SQL (aggregate contributions, update `challenge_participants`).

**Flow:**
```
Any change to challenge_contributions → DB trigger → SQL: aggregate contributions by challenge type, UPDATE challenge_participants
```

**Challenges:**
- Must join to `challenges` to get `type` (best_effort vs cumulative vs segment_race)
- Aggregation differs by type: `MAX(distance)` vs `SUM(distance)` vs `MIN(time)`
- Must filter `is_valid = true` if that column exists

**Pros:**
- No network, no extra API
- Synchronous: totals correct immediately
- Works for any source of change

**Cons:**
- Logic duplicated (TypeScript + SQL)
- Harder to maintain; SQL triggers can be tricky to debug

**Best for:** Simplicity of deployment; no external HTTP dependency.

---

### Option 4: Compute on Read (No Cache)

**How it works:** Remove `result_distance` and `result_time` from `challenge_participants`. Compute totals by aggregating `challenge_contributions` when loading the leaderboard.

**Flow:**
```
Load leaderboard → Query contributions, aggregate by participant/challenge type → Display
```

**Pros:**
- Always correct; no sync issues
- No recalc logic needed

**Cons:**
- Heavier queries (JOINs, GROUP BY, conditional aggregation)
- Slower as data grows
- Existing indexes on `result_distance`/`result_time` for sorting would need to change (e.g. subquery or materialized view)

**Best for:** Small datasets; correctness over performance.

---

## Recommendation Summary

| Situation | Recommended Option |
|-----------|--------------------|
| Edits/deletes rare, only via app | **Option 1** – explicit recalc in server action |
| Need to handle direct DB changes | **Option 2** – trigger → API |
| Prefer no HTTP, simpler infra | **Option 3** – trigger with inline SQL |
| Small data, correctness paramount | **Option 4** – compute on read |

**Practical path:** Start with **Option 1** when you add edit/delete. Add **Option 2** later if you introduce tooling or direct DB access that modifies contributions.
