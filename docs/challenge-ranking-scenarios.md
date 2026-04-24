# Challenge Ranking Scenarios

Reference for how contributions are validated, ranked, and reflected in each participant's row for every challenge type. Intended to be kept in sync with the runtime pipeline.

## Pipeline refresher

Ingestion path on a Strava activity create webhook:

```
process-webhook/+server.ts
  -> processors/activity-processor.ts            (aspect dispatch: CREATE / UPDATE / DELETE)
    -> processors/activity-create-processor.ts   (find active participant+challenge pairs)
      -> validators/activity-validator.ts        (per challenge_type dispatcher)
        -> validators/<type>-validator.ts        (strategy: decides if activity becomes a contribution)
      -> participant-state/participant-state.ts  (per challenge_type dispatcher)
        -> participant-state/<type>-state.ts     (strategy: recomputes participant aggregates)
```

Two key responsibilities:

- **Validator** decides whether an activity qualifies as a `challenge_contributions` row. Rejected activities are never persisted as contributions.
- **State strategy** recomputes the participant's aggregate row (`result_distance`, `ranking_value_seconds`, `highlight_activity_id`) from the set of contributions that already survived validation, and returns whether the participant has met the challenge goal (`goalMet`).

The dispatcher in `participant-state.ts` reads `goalMet` from the strategy result and flips `status` to `COMPLETED` when true. Each strategy owns its own definition of "complete" — there is no shared `isGoalMet` ladder.

BEST_EFFORT-specific ranking helpers (`getMetricTimeForContribution`, `selectFastestRanking`, `selectHighlightContribution`, `selectBestDistanceContribution`) are colocated inside `participant-state/best-effort-state.ts` rather than `challenge-ranking.ts`. The latter retains only shared data primitives (`extractRankingValueFromBestEfforts`, `getPreferredTime`, sums) and the CUMULATIVE-only reducer.

## Shared terminology

- **Contribution** — a `challenge_contributions` row. Only passing activities become contributions.
- **Ranking metric** — `challenges.ranking_metric`. One of `NONE`, `ACTIVITY_TOTAL`, or a standard distance (`STANDARD_5K`, etc.). Drives how `rankingValueSeconds` is computed.
- **Goal distance** — `challenges.goal_distance` in meters. Required for BEST_EFFORT and CUMULATIVE.
- **Highlight activity** — the single Strava activity referenced by `highlight_activity_id` for the participant; what the UI shows as the "featured" run for their ranking.

---

## BEST_EFFORT

Goal: complete a single qualifying run whose distance is at least `goal_distance`. Ranked by the fastest ranking-metric time across qualifying attempts.

### Validator behavior — `validators/best-effort-validator.ts`

An activity qualifies as a contribution when **both**:

1. `sportType` is in `RUN_SPORT_TYPES`.
2. `activity.distance >= challenge.goalDistance`.

Rejected activities never reach the state stage.

### State strategy — `participant-state/best-effort-state.ts`

Over the set of qualifying contributions:

- `goalMet` = `contributions.some((c) => (c.distance ?? 0) >= goalDistance)`. Reads contributions directly so a metric-extraction failure cannot block completion.
- `rankingValueSeconds` = fastest metric time via `selectFastestRanking(contributions, rankingMetric)`.
- `highlightActivityId` + `resultDistance` + `resultMovingTimeSeconds` + `resultElapsedTimeSeconds` = the contribution owning that fastest time via `selectHighlightContribution(contributions, rankingMetric)`. The two time columns mirror the highlighted contribution's `movingTime` / `elapsedTime` strictly (may be `null`); UI layer owns any fallback display.

Both `selectFastestRanking` and `selectHighlightContribution` evaluate one contribution at a time through `getMetricTimeForContribution`, which:

1. Returns `null` for `RANKING_METRIC.NONE` (the highlight selector handles NONE separately via distance ranking).
2. For `RANKING_METRIC.ACTIVITY_TOTAL`, returns the activity's `movingTime` (or `elapsedTime` fallback).
3. For a standard distance, first tries `extractRankingValueFromBestEfforts` against the contribution's `bestEfforts` snapshot. Splits are matched **name-first** via `RANKING_METRIC_BEST_EFFORT_NAME` (e.g. `STANDARD_5K` -> `'5k'`); if no split with that name is present, the historical 1% `DISTANCE_TOLERANCE_RATIO` distance check acts as a defensive fallback and emits a `console.warn` so the name table can be corrected.
4. **Fallback (BEST_EFFORT only):** when splits are missing or unusable (neither name nor distance matched), if the activity's total `distance` is within `FALLBACK_TOTAL_TOLERANCE_RATIO` (2%) of the metric's target distance, use the activity's total `movingTime` (or `elapsedTime` fallback). This recovers ranking for activities whose total distance is essentially the target distance but whose `bestEfforts` payload is empty or out-of-tolerance.

Tie-break rules inside `selectHighlightContribution`:

1. Fastest `rankingValueSeconds` wins.
2. Tie on time -> lowest `stravaActivityId` (deterministic).

Special case: when `rankingMetric === NONE`, ranking falls back to `selectBestDistanceContribution`: longest distance wins, tie-break on fastest total time, then lowest `stravaActivityId`.

### Scenarios

Status legend: **OK** = current behavior matches expectation. **BUG** = current behavior diverges from expectation and should be fixed. **POLICY** = behavior is defensible but is a product decision that should be confirmed.

| # | Prior state | New activity | Expectation | Current behavior | Status |
|---|---|---|---|---|---|
| 1 | No contributions | Does not meet goal distance | Reject; do not compute or persist anything else. | Validator rejects in `best-effort-validator.ts:18-23`. `processCreateActivity` `continue`s; no insert, no state recompute. Participant row untouched. | OK |
| 2 | No contributions | Meets goal distance | Insert contribution; compute `rankingValueSeconds` from its `best_efforts`; mark `COMPLETED`. | Validator passes, contribution inserted, state strategy runs on a single-element list. Highlight = the new contribution. Strategy returns `goalMet = true`; dispatcher flips status to `COMPLETED`. | OK |
| 3 | Only failed attempts | Meets goal distance | Failed attempts must not pollute ranking; behave like Scenario 2. | Failed attempts were already rejected at validator time, so they are not in the contributions list at all. Identical path to Scenario 2. | OK (different mechanism than the user model: filtering happens at validator, not at state-compute) |
| 4 | One or more qualifying contributions | Meets goal distance, slower than prior best | Preserve prior `rankingValueSeconds` and `highlightActivityId`. | New contribution inserted for history. `selectFastestRanking` keeps `bestTime` on the older/faster row (`time < bestTime` guard). Highlight unchanged. Status stays `COMPLETED`. | OK |
| 5 | One or more qualifying contributions | Meets goal distance, faster than prior best | Replace `rankingValueSeconds` and `highlightActivityId` with the new contribution. | Same code path as 4; the `time < bestTime` guard now switches the winner. `resultDistance` updates to the new contribution's distance. | OK |
| 6 | Any | Meets goal distance, but ranking metric time cannot be extracted from `best_efforts` (no split with the target name, distance fallback also misses, or `best_efforts = null`) | Mark `COMPLETED` regardless; record a usable `rankingValueSeconds` whenever the activity's total distance is essentially the target distance, otherwise leave it `null`. | `goalMet` is computed directly from `contributions.some((c) => (c.distance ?? 0) >= goalDistance)`, independent of ranking. Status flips to `COMPLETED`. For ranking, `getMetricTimeForContribution` falls back to the activity's total `movingTime` (or `elapsedTime`) when total distance is within `FALLBACK_TOTAL_TOLERANCE_RATIO` (2%) of the target — so `rankingValueSeconds` and `highlightActivityId` are populated for typical race-distance runs even when splits are missing. Activities outside that 2% window remain "completed but unranked" (`rankingValueSeconds = null`). | OK (resolved) — completion never depends on ranking; the 2% fallback recovers ranking for the common "5050m run, no 5K split" case. Open follow-up: surface "completed but unranked" cleanly in the leaderboard UI for the residual cases outside the fallback window. |
| 7 | Qualifying contributions inserted under previous `goal_distance` | Admin raises `goal_distance` above some/all of those contributions' distances | Either (a) freeze `goal_distance` once challenge is `ACTIVE`, or (b) drop newly-disqualified contributions from ranking. | Filtering happens only at validator time, so historical contributions remain in the contributions list and continue to drive `rankingValueSeconds` / highlight even though they no longer meet the new bar. | POLICY — options: freeze `goal_distance` on transition to `ACTIVE`; re-validate on challenge update; or add a defensive `contribution.distance >= challenge.goalDistance` filter inside `best-effort-state.ts`. |
| 8 | Any | Meets goal distance, `challenge.rankingMetric === NONE` | Document that ranking is by longest distance, not time. | `getMetricTimeForContribution` returns `null` immediately for NONE, so `selectFastestRanking` returns `null`. `selectHighlightContribution` detects NONE and falls back to `selectBestDistanceContribution` (longest distance wins, tie-break: fastest total time, then lowest `stravaActivityId`). `resultDistance` is the longest contribution's distance. | OK (intended) — surface this in UI so "fastest" vs "longest" is unambiguous on `NONE` leaderboards. |

---

## CUMULATIVE

Goal: accumulate `goal_distance` meters across any number of qualifying runs during the active window.

### Validator behavior — `validators/cumulative-validator.ts`

Current logic accepts any run-type activity with no distance filter. Every run contributes.

### State strategy — `participant-state/cumulative-state.ts`

- `resultDistance` = `sumDistances(contributions)`.
- `resultMovingTimeSeconds` = `sumMovingTimes(contributions)`.
- `resultElapsedTimeSeconds` = `sumElapsedTimes(contributions)`.
- `rankingValueSeconds` = currently `computeRankingValueFromContributions(contributions, rankingMetric)` (best single-run metric time, same algorithm as BEST_EFFORT).
- `highlightActivityId` = the **current** activity id (always the most recent activity that triggered processing).
- `goalMet` = `totalDistance >= goalDistance`. Strategy returns this; dispatcher flips status to `COMPLETED` accordingly.

### Scenarios

Status legend: **CURRENT** = what code does today. **TARGET** = agreed policy for cumulative refactor.

#### 1) Goal distance = 13.1 miles, ranking metric = fastest mile (`STANDARD_1_MILE`)

- **Single contribution path**
  - **CURRENT:** if the activity has a mile best effort, ranking is populated from that single activity; completion depends on cumulative distance meeting goal.
  - **TARGET:** same behavior.
- **Multiple contributions path**
  - **CURRENT:** ranking is the fastest mile from any single contribution; no cross-activity stitched mile.
  - **TARGET:** same behavior (single-activity split remains primary for this metric).

#### 2) Goal distance = 13.1 miles, ranking metric = `STANDARD_HALF_MARATHON`

- **Primary rule (Rule A):** derive ranking from a single qualifying activity whose half-marathon split/effort can be read directly.
- **Fallback rule (Rule B):** when Rule A cannot provide a ranking but participant has enough cumulative distance, allow cumulative fallback ranking.

##### Scenario matrix

- **Runner does half-marathon in one contribution**
  - **CURRENT:** ranked via that activity's split/effort when available.
  - **TARGET:** Rule A wins; fallback not used.
- **Runner spreads half-marathon across many contributions**
  - **CURRENT:** often completes goal but remains unranked for `STANDARD_HALF_MARATHON` unless one activity alone contains a HM effort.
  - **TARGET:** attempt Rule A first; if unavailable, apply Rule B fallback to produce a ranking value from cumulative context.
- **Runner totals 14 miles (single or multiple contributions)**
  - **CURRENT:** same split behavior as above; extra distance does not change extraction mode.
  - **TARGET:** same extraction order: Rule A first, Rule B only when needed. Exceeding goal does not disable either path.

#### 3) Goal distance = 13.1 miles, participant ends slightly short in meters vs canonical race distance

- **CURRENT:** strict comparisons can create "13.1 miles shown, but not 21097m" edge behavior depending on stored meter values and split availability.
- **TARGET:** add a tolerance gate for cumulative fallback evaluation: if end-result distance is within 1-2% of goal distance, treat as close enough for time fallback usage.
- **Interpretation:** tolerance is a recovery mechanism for real-world rounding/GPS variance and should be deterministic and documented.

### CUMULATIVE ranking policy (agreed)

For cumulative challenges:

1. **Goal completion remains cumulative-distance based** (`sumDistances >= goalDistance`).
2. **Ranking extraction order for standard-distance metrics:**
   - First try **Rule A** (single-activity best effort/split extraction).
   - If Rule A fails and participant is otherwise eligible, apply **Rule B** cumulative fallback.
3. **Ranking visibility gate:** do not display rank/time before participant completion.
4. **Rule B fallback quality target:** Rule B should produce a value as close as possible to the true ranking distance metric.
5. **Tolerance fallback:** allow a 1-2% distance tolerance check for near-goal outcomes when deciding whether fallback ranking can be used. This does not bypass completion.
6. **Rule B time source:** use cumulative `movingTime` (store both moving + elapsed in DB; ranking derivation prefers moving time).
7. **Units:** persist canonical distances in meters; admin input may be miles/km and is converted server-side.
8. **Over-goal totals are valid:** going beyond goal (e.g. 14 miles in a 13.1-mile challenge) is allowed and should not penalize ranking extraction.
9. **Effort disambiguation:** when multiple candidate efforts in one activity match a metric, pick the fastest valid effort.
10. **Highlight semantics for cumulative:** default `highlightActivityId` to the participant's longest run.
11. **Data and ordering assumptions:** trust Strava payloads as-is; recompute from all contributions on each webhook so processing order/retries do not affect final state.
12. **Challenge edits while active:** assume admins do not change active challenge configuration.
13. **UI semantics:** show completion status (`IN_PROGRESS` / `COMPLETED`); no need to indicate whether ranking came from fallback.

### Known open questions

- Exact tolerance constant: lock to a single value (1% or 2%) and apply consistently.
- Tie-breaking policy across all ranking modes (not only Rule B): define deterministic ordering if times are equal.
- UPDATE/DELETE webhook behavior remains TODO (expected low impact, mostly metadata updates).
- Minimum-contribution guardrails are intentionally deferred for now.

---

## SEGMENT_RACE

Not functional. The validator and state strategy are stubs guarded by `TODO(segment-race)` markers. When segment flow is implemented, fill in:

- Validator: match `activity.segmentEfforts[].segment.id === challenge.segmentId`; pick fastest effort.
- State strategy: best (fastest) segment effort across contributions defines `rankingValueSeconds`; highlight = contribution owning that effort.
- Completion criteria: any valid segment effort counts as completed, or a time threshold, depending on product requirements.

---

## Invariants across types

- A contribution always reflects the state of an activity at insert time; we do not mutate existing contributions when the activity changes upstream. (UPDATE and DELETE webhooks are not yet implemented — see `activity-update-processor.ts` and `activity-delete-processor.ts`.)
- Each state strategy owns its own definition of "goal met" and returns it as `goalMet: boolean`. The dispatcher does not re-derive completion from aggregate fields, so a `null` ranking metric or highlight cannot block the `COMPLETED` transition.
- `rankingValueSeconds = null` is a first-class state meaning "not rankable on metric" (e.g. `RANKING_METRIC.NONE` or data gap). Leaderboard sorts must handle null.
- Duplicate webhooks are de-duplicated at the contribution layer via a `uniqueIndex` on `(participant_id, strava_activity_id)`. The create processor uses `INSERT ... ON CONFLICT DO NOTHING` and skips the state recompute when the insert returns no rows.

---

## Change log

- Initial draft: captures BEST_EFFORT in full, CUMULATIVE as a stub, SEGMENT_RACE as a TODO.
- Removed shared `isGoalMet` ladder; each state strategy now returns `{ metrics, goalMet }`. Resolves Scenario 6 (BEST_EFFORT could complete a goal whose ranking metric was unextractable but had its status stuck at `IN_PROGRESS`).
- BEST_EFFORT ranking helpers colocated in `participant-state/best-effort-state.ts` (`getMetricTimeForContribution`, `selectFastestRanking`, `selectHighlightContribution`, `selectBestDistanceContribution`). Added 2% total-distance fallback (`FALLBACK_TOTAL_TOLERANCE_RATIO`) for `rankingValueSeconds` when `bestEfforts` splits are missing. CUMULATIVE behavior unchanged.
- `best_effort` split matching switched to name-first (`RANKING_METRIC_BEST_EFFORT_NAME` in `src/lib/constants/challenge.ts`); the existing 1% `DISTANCE_TOLERANCE_RATIO` is retained as a defensive fallback that emits a `console.warn` when it rescues a name miss, so the mapping table can be corrected.
- Renamed `result_moving_time_total` -> `result_moving_time_seconds` and added `result_elapsed_time_seconds` on `challenge_participants`. BEST_EFFORT now populates both columns from the highlighted contribution (strict, no moving->elapsed fallback server-side). CUMULATIVE populates both as `sumMovingTimes` / `sumElapsedTimes`. SEGMENT_RACE passes through cached values. Validators stopped collapsing missing `movingTime` into `elapsedTime` on insert; contributions now store exactly what Strava reports. UI layer owns any fallback display logic.
- Promoted `idx_contribution_unique` to `uniqueIndex('uniq_contribution_participant_activity')`; contribution insert now uses `onConflictDoNothing` to handle concurrent webhook redelivery.
