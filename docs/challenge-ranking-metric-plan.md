# Challenge ranking metric & PR data — implementation plan

**Status:** Draft for review (not implemented).  
**Goal:** Let admins choose how leaderboard **ranking** is computed (using Strava standard-distance PRs / activity slices), persist rich per-activity data (moving vs elapsed, `best_efforts`), keep **cumulative totals** separate from **rank**, and update webhook processing accordingly.

**Assumption (migrations):** Target databases have **no existing rows** in `challenge_contributions`, `challenge_participants`, and `challenges` (or you are OK resetting them). **No SQL backfills** are required—only enum/column/index changes and dropping legacy columns.

---

## 1. Problem summary

Today, **best effort** and **cumulative** challenges store whole-activity **distance** and **elapsed** time from validation. If someone exceeds the goal distance on the same activity, **total** time and distance grow with cooldown miles, which skews time-based interpretation.

**Desired behavior:**

- **Ranking** is driven by an admin-selected **ranking metric** (e.g. best 5k moving time within qualifying activities), with **N/A → unranked** when the metric cannot be resolved.
- **Totals** for cumulative challenges remain **sum of distance** and **sum of moving time** (or as product defines), independent of how we sort the leaderboard.
- **Segment race:** challenge may still **accept** a ranking metric in the UI/schema for consistency, but **scoring** stays segment-based until product says otherwise.
- Times used for scoring should prefer **moving time** (with a safe fallback to elapsed when moving is missing/zero).

---

## 2. Product rules (decisions to lock before build)

| Topic             | Proposed default                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Missing metric    | Participant is **unranked** (`ranking_value_seconds` null); UI shows N/A / “Unranked”.                                                                                                                                                                                                                                                                                                             |
| Sort              | Ranked rows first (by metric, ascending for time); unranked last; keep existing **status** ordering where applicable.                                                                                                                                                                                                                                                                              |
| Moving vs elapsed | Primary: **moving time**; fallback: **elapsed time** if moving unavailable or 0.                                                                                                                                                                                                                                                                                                                   |
| Best effort       | One conceptual “attempt” per challenge is unrealistic once multiple qualifying activities exist. **Treat best effort as: among all qualifying activities, the “best run” is the one that produces the best (minimum) ranking-metric time** when the challenge has a time-based ranking metric. Leaderboard sort uses `ranking_value_seconds`; **`highlight_activity_id` points to that activity.** |
| Cumulative        | **Track** `result_distance` + **total moving seconds** separately from **ranking** value derived from metric across contributions.                                                                                                                                                                                                                                                                 |
| Segment           | Store metric on challenge; **do not** use it in rank calculation in v1.                                                                                                                                                                                                                                                                                                                            |

### 2.1 Best effort: longest distance vs best ranking (resolved)

For **best_effort** challenges with a **time-based ranking metric** (e.g. standard 5K):

- **Do not** pick the winning activity by **longest distance only**—that can select a slow long run over a shorter, faster run that still meets the goal.
- **Do** set **`highlight_activity_id`** to the Strava activity that contributed the **best** (minimum moving) time for the selected **ranking metric** across all qualifying contributions.
- **`result_distance`** for display/parity: use the **distance of that highlighted activity** (the best-ranking run), not the max distance ever logged, so the card matches the run you’re ranking on.

If **`ranking_metric` is `none`** (legacy / distance-only challenges), behavior can remain **max distance** wins with highlight = that activity (document in code).

**Edge case:** Two activities tie on ranking time—pick deterministic tiebreaker (e.g. lower `strava_activity_id`, or earlier `occurred_at`).

### 2.2 Ranking metric enum — align with Strava running best efforts

Strava documents the following **running** benchmark best efforts (see [Best Efforts – Running](https://support.strava.com/hc/en-us/articles/16601494390285-Best-Efforts-Running)):

| Strava benchmark   | Suggested enum value     | Typical match (implementation)                                                            |
| ------------------ | ------------------------ | ----------------------------------------------------------------------------------------- |
| _(no standard PR)_ | `none`                   | Legacy / distance-only sort                                                               |
| _(whole activity)_ | `activity_total`         | Min **whole-activity** moving time across qualifying contributions (optional product use) |
| 400 m              | `standard_400m`          | Match `best_efforts[]` by distance (m) ± tolerance                                        |
| 800 m              | `standard_800m`          | same                                                                                      |
| 1K                 | `standard_1k`            | same                                                                                      |
| 1 mile             | `standard_1_mile`        | same                                                                                      |
| 2 miles            | `standard_2_mile`        | same                                                                                      |
| 5K                 | `standard_5k`            | same                                                                                      |
| 10K                | `standard_10k`           | same                                                                                      |
| 15K                | `standard_15k`           | same                                                                                      |
| 10 miles           | `standard_10_mile`       | same                                                                                      |
| 20K                | `standard_20k`           | same                                                                                      |
| Half marathon      | `standard_half_marathon` | same                                                                                      |
| 30K                | `standard_30k`           | same                                                                                      |
| Marathon           | `standard_marathon`      | same                                                                                      |
| 50k                | `standard_50k`           | same                                                                                      |

**Implementation note:** Strava’s API returns `best_efforts` with `name`, `distance` (meters), `moving_time`, `elapsed_time`, etc. **Prefer matching by `distance` in meters** (small tolerance, e.g. ±1%) so minor API naming changes do not break you. Log or snapshot unknown `best_efforts` entries in JSON for future enum additions. If Strava adds benchmarks later, extend the Postgres enum + TS constants in a follow-up migration.

---

## 3. Schema changes

### 3.1 New enum: `challenge_ranking_metric`

Add a Postgres enum (Drizzle `pgEnum`) plus TypeScript `as const` in `$lib/constants`.

**Values:** `none`, `activity_total`, and every `standard_`\* row in §2.2.

### 3.2 `challenges` table

| Column           | Type                       | Notes                     |
| ---------------- | -------------------------- | ------------------------- |
| `ranking_metric` | `challenge_ranking_metric` | NOT NULL, default `none`. |

Optional later: DB check constraints by `challenge_type` (not required for v1).

### 3.3 `challenge_contributions` table — final column set

**Core (scoring + queries):**

| Column         | Type      | Notes                                                                                     |
| -------------- | --------- | ----------------------------------------------------------------------------------------- |
| `distance`     | `real`    | Meters for the validated slice (whole activity or segment effort), same meaning as today. |
| `moving_time`  | `integer` | Seconds, **moving**, validated slice. Primary field for aggregation and ranking.          |
| `elapsed_time` | `integer` | Seconds, **elapsed**, same slice. Audit + Strava parity.                                  |

**Replaces (greenfield migration):** legacy column `time` — use `moving_time` + `elapsed_time` only (see §3.6).

**PR / optional payloads (all recommended for storage):**

| Column              | Type    | Notes                                                                                                                                                                       |
| ------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `best_efforts`      | `jsonb` | Full snapshot of Strava activity `best_efforts` (array of efforts). Nullable if empty or non-run.                                                                           |
| `splits_metric`     | `jsonb` | Strava `splits_metric` (per-km etc.).                                                                                                                                       |
| `splits_standard`   | `jsonb` | Strava `splits_standard`.                                                                                                                                                   |
| `laps`              | `jsonb` | Strava `laps` (optional analytics / future rules).                                                                                                                          |
| `activity_snapshot` | `jsonb` | Small structured blob, e.g. `{ stravaActivityId, distance, movingTime, elapsedTime, sportType, startDate, manual, trainer }` for debugging, support, and compliance trails. |

**Not stored by default (too large / redundant):** full `segment_efforts`, `map`, photos—unless product later requires a trimmed subset (e.g. only efforts for challenge `segment_id`).

### 3.4 `challenge_participants` table — final column set

| Column                     | Type          | Notes                                                                                                          |
| -------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------- |
| `result_distance`          | `real`        | Same roles as today (max for best_effort **highlight run**, sum for cumulative, etc.—see processor §6).        |
| `result_moving_time_total` | `integer`     | **Cumulative only:** sum of contribution `moving_time`. NULL for best_effort / segment_race if not applicable. |
| `ranking_value_seconds`    | `integer`     | Nullable. Cached sort key for current `challenges.ranking_metric` (e.g. min best-5k moving time).              |
| `ranking_computed_at`      | `timestamptz` | Optional. When this cache was last computed (helps if admin changes metric or you add admin “recalculate”).    |

**Replaces (greenfield migration):** legacy column `result_time` — use `result_moving_time_total` (cumulative), `ranking_value_seconds`, and contribution/highlight joins for time display (see §3.6).

**Unchanged:** `highlight_activity_id`, status/join fields, indexes as needed.

### 3.5 Indexes

- `(challenge_id, ranking_value_seconds)` on participants if server-side sort/filter grows.
- Revisit `idx_participant_result_time` after dropping `result_time`—replace with index on `ranking_value_seconds` if useful.

### 3.6 Migration strategy (empty database — no backfills)

With **no rows** in the affected tables, the migration is **schema-only**:

1. **Create** enum `challenge_ranking_metric` (all values from §2.2 plus `none` / `activity_total`).
2. **`challenges`:** add `ranking_metric` NOT NULL DEFAULT `none`.
3. **`challenge_contributions`:** add `moving_time`, `elapsed_time`, `best_efforts`, `splits_metric`, `splits_standard`, `laps`, `activity_snapshot`; **drop** `time` (if the previous schema had it).
4. **`challenge_participants`:** add `result_moving_time_total`, `ranking_value_seconds`, `ranking_computed_at` (if using); **drop** `result_time` (if present); **drop** index on `result_time` if it exists and add/replace indexes per §3.5.

**Deploy order:** Ship the migration **with** the app version that reads/writes the new columns (no expand-contract cycle required when there is no data).

**If you later migrate an environment that already has rows:** add a one-off migration or script that (1) copies `time` → `moving_time` and `elapsed_time` with documented semantics, (2) aggregates cumulative `result_moving_time_total` from contributions, (3) drops legacy columns—see archived pattern in git history or reintroduce the backfill section from an older revision of this doc.

---

## 4. Dashboard / leaderboard UI

**Should we add columns to the dashboard table?** Recommended **yes**, minimally:

| UI column             | Purpose                                                                                                                                                                           |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Rank / sort**       | Already implicit; ensure unranked rows sort last and show “—”.                                                                                                                    |
| **Ranking value**     | Show the time (or distance if you ever rank on distance) used for sort—e.g. “5K: 22:14” with tooltip “Moving time (Strava)”.                                                      |
| **Metric label**      | At challenge header: “Ranked by: 5K (moving)”.                                                                                                                                    |
| **Cumulative totals** | If you show volume: **distance** + **total moving time** (`result_moving_time_total`) as separate from ranking cell so users see both “miles in challenge” and “your ranked 10K”. |

Exact layout stays a UX choice; the **data model** above supports splitting “totals” vs “rank”.

---

## 5. Strava validation layer (`strava-activity-validators.ts`)

1. Return **both** `movingTime` and `elapsedTime` for the validated slice (whole activity or segment effort).
2. Use **moving** as primary scoring time; fallback to **elapsed** if moving missing or 0.
3. **Segment race:** compare and return **moving** time from `StravaDetailedSegmentEffort`; same fallback.
4. Extend `ValidationResult` (or parallel fields) so the processor can persist **best_efforts**, **splits_metric**, **splits_standard**, **laps**, and **activity_snapshot** without re-parsing.

**Dependencies:** `StravaDetailedActivityCamel` already includes `movingTime`, `elapsedTime`, `bestEfforts`, splits, laps.

### 5.1 Strava API: fetch completeness (`best_efforts`, segment efforts)

Use **`GET /api/v3/activities/{id}?include_all_efforts=true`** when loading an activity for webhook processing so the payload includes **all segment efforts** (not only a subset). That maximizes data for debugging, future rules, and parity with what you see in Postman.

**Already wired:** `getActivityById(activityId, true, accessToken)` in `src/lib/server/strava.ts` appends `include_all_efforts=true`; `src/routes/api/strava/process-webhook/+server.ts` calls it with `includeAllEfforts: true`.

`best_efforts` (standard-distance PRs for that activity), `splits_metric`, `splits_standard`, and `laps` come from this detailed activity response—**not** from a separate endpoint.

---

## 6. Activity processor (`src/lib/server/strava-activity-processor.ts`)

### 6.1 On new contribution insert

Persist: `distance`, `moving_time`, `elapsed_time`, `best_efforts`, `splits_metric`, `splits_standard`, `laps`, `activity_snapshot` (all available from the detailed activity payload).

Idempotency: unchanged (`participant_id` + `strava_activity_id`).

### 6.2 Recompute participant state

**A. Type-specific aggregates (moving-based)**

- **Best effort:** Update **`result_distance`** and **`highlight_activity_id`** from the activity that yields the **best ranking metric** (§2.1). Recompute **`ranking_value_seconds`** from all contributions.
- **Cumulative:** `result_distance` += contribution distance; `result_moving_time_total` += `moving_time`. Recompute **`ranking_value_seconds`** from metric across contributions.
- **Segment race:** Best segment **moving** time; **`ranking_metric` ignored** for v1 scoring. **`ranking_value_seconds`** = same value (best segment moving time) so leaderboard sorting can use one field across challenge types.

**B. Ranking value**

Scan contributions’ `best_efforts` JSON for the challenge’s `ranking_metric`; take **minimum** matching **moving** time (with fallback to elapsed only if moving missing in JSON). If none → `ranking_value_seconds = NULL`.

**C. Completion / status**

Unchanged goal rules; use **moving** time where time is part of completion logic.

### 6.3 Optional module split

`$lib/server/strava/participant-state.ts` is the single writer of `ranking_value_seconds` on the participant row (via `computeNextParticipantState` + `updateChallengeParticipantAggregates` in `activity-create-processor.ts`). `$lib/server/strava/challenge-ranking.ts` stays as a pure-math helper library (no DB access).

---

## 7. Downstream updates (checklist)

| Area                            | Work                                                                                                                                          |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Admin**                       | `ranking_metric` on create/edit; segment: “stored but not used for rank in v1”.                                                               |
| **Dashboard / `LeaderboardUI`** | Sort on `ranking_value_seconds`; unranked. **Layout (desktop/mobile):** defer dedicated UX pass until core ranking + data are done (see §11). |
| **Display**                     | Moving time labeling; Strava attribution per `docs/strava/`.                                                                                  |
| **Constants & types**           | `RANKING_METRIC` + Drizzle enum; loaders/DTOs.                                                                                                |
| **Seed / fixtures**             | Sample `ranking_metric` values.                                                                                                               |

---

## 8. Phased rollout (suggested)

1. **Migration:** new enum + columns; drop legacy `time` / `result_time` (no backfill SQL).
2. **Validators + processor** write full payload and recompute ranking + highlight rules.
3. **Leaderboard + admin** (functional sort/display; polish layout after).
4. **Dashboard UX:** responsive desktop/mobile design for leaderboard and challenge detail (after metrics are stable).
5. **Optional:** Strava refetch / repair job only if you later import or fix legacy data.

---

## 9. Testing notes

- Unit: metric extraction from `best_efforts` JSON; ties; missing efforts → unranked.
- Integration: multi-activity best_effort chooses correct highlight + `ranking_value_seconds`.
- Migration: apply to a fresh DB and confirm schema (enum, columns, indexes, no `time` / `result_time`). Processor tests cover `result_moving_time_total` vs sum of contributions.

---

## 10. References (codebase)

- Strava activity fetch (`include_all_efforts`): `src/lib/server/strava.ts` → `getActivityById`
- Webhook handler (passes `true` for full efforts): `src/routes/api/strava/process-webhook/+server.ts`
- Validators: `src/lib/server/strava-activity-validators.ts`
- Processor: `src/lib/server/strava-activity-processor.ts`
- Schema: `src/lib/db/schema.ts`
- Leaderboard: `src/routes/(app)/dashboard/_logic/LeaderboardUI.svelte.ts`
- Strava types: `src/lib/types/strava.ts`

---

## 11. Decisions & follow-ups

### Resolved

| Topic                                      | Decision                                                                                                                                                                                                        |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Segment race + `ranking_value_seconds`** | **Yes** — set `ranking_value_seconds` to **best segment moving time** (same as segment rank), so one sort field works across types. `ranking_metric` on the challenge remains **unused for calculation** in v1. |
| **Dashboard layout**                       | **Defer** — after ranking + persistence work, do a **desktop + mobile** design pass for leaderboard / challenge views (density, columns vs combined cells).                                                     |

### TODO when you have a sample activity JSON

After you capture a real **`GET /api/v3/activities/{id}?include_all_efforts=true`** response (e.g. from Postman), use it to:

- Verify **`best_efforts[]`** shape: `name`, `distance` (meters), `moving_time`, `elapsed_time`.
- Tune **enum → distance matching** (tolerances, edge labels like 50k / half marathon).

**Code anchors:** search for `TODO(challenge-ranking-metric)` in `src/lib/server/strava.ts`, `src/lib/types/strava.ts`, and `src/lib/server/strava-activity-validators.ts` (extend with the same tag in `$lib/server/challenge-ranking.ts` when that module exists).

### Out of scope for empty-DB rollout

Legacy **historical fairness** / `time_source` on contributions — only if you migrate populated DBs later.

---

## 12. Revision log

| Date       | Author | Notes                                                                                                                                                                                                                                             |
| ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-03-20 | —      | Initial draft from planning discussion.                                                                                                                                                                                                           |
| 2026-03-21 | —      | Strava-aligned enum list; best_effort = best ranking run + highlight; dashboard columns; full optional contribution fields. **Empty-DB migrations:** §3.6 schema-only (no backfills); rollout/testing/questions updated; markdown fixes in §2/§6. |
| 2026-03-23 | —      | §5.1 Strava `include_all_efforts`; segment `ranking_value_seconds` decision; dashboard UX deferred; §11 → decisions + TODO; code comments `TODO(challenge-ranking-metric)`.                                                                       |

When you edit this doc, bump the revision log and align §2–§3 with what you ship.
