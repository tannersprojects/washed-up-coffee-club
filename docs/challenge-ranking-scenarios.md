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
- `rankingValueSeconds` = fastest metric time via `computeRankingValueFromContributions(contributions, rankingMetric)`.
- `highlightActivityId` + `resultDistance` = the contribution owning that fastest time via `getBestEffortHighlightContribution(contributions, rankingMetric)`.
- `resultMovingTimeTotal` = `null` (not meaningful for BEST_EFFORT).

Tie-break rules inside `getBestEffortHighlightContribution`:

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
| 4 | One or more qualifying contributions | Meets goal distance, slower than prior best | Preserve prior `rankingValueSeconds` and `highlightActivityId`. | New contribution inserted for history. `computeRankingValueFromContributions` keeps `bestTime` on the older/faster row (`time < bestTime` guard). Highlight unchanged. Status stays `COMPLETED`. | OK |
| 5 | One or more qualifying contributions | Meets goal distance, faster than prior best | Replace `rankingValueSeconds` and `highlightActivityId` with the new contribution. | Same code path as 4; the `time < bestTime` guard now switches the winner. `resultDistance` updates to the new contribution's distance. | OK |
| 6 | Any | Meets goal distance, but ranking metric time cannot be extracted from `best_efforts` (split missing, outside `DISTANCE_TOLERANCE_RATIO`, or `best_efforts = null`) | Mark `COMPLETED` regardless; record `rankingValueSeconds = null`. Highlight may be empty when no contribution has an extractable metric time, but completion must not depend on that. | `goalMet` is computed directly from `contributions.some((c) => (c.distance ?? 0) >= goalDistance)`, independent of ranking. Status flips to `COMPLETED`. `rankingValueSeconds` and `highlightActivityId` may still be `null` because the metric couldn't be extracted, but the participant is correctly counted as complete. | OK (resolved) — completion no longer depends on highlight-derived `resultDistance`. Open follow-up: surface "completed but unranked" cleanly in the leaderboard UI. |
| 7 | Qualifying contributions inserted under previous `goal_distance` | Admin raises `goal_distance` above some/all of those contributions' distances | Either (a) freeze `goal_distance` once challenge is `ACTIVE`, or (b) drop newly-disqualified contributions from ranking. | Filtering happens only at validator time, so historical contributions remain in the contributions list and continue to drive `rankingValueSeconds` / highlight even though they no longer meet the new bar. | POLICY — options: freeze `goal_distance` on transition to `ACTIVE`; re-validate on challenge update; or add a defensive `contribution.distance >= challenge.goalDistance` filter inside `best-effort-state.ts`. |
| 8 | Any | Meets goal distance, `challenge.rankingMetric === NONE` | Document that ranking is by longest distance, not time. | `computeRankingValueFromContributions` returns `null` immediately; `getBestEffortHighlightContribution` falls back to `selectBestDistanceContribution` (longest distance wins, tie-break: fastest total time, then lowest `stravaActivityId`). `resultDistance` is the longest contribution's distance. | OK (intended) — surface this in UI so "fastest" vs "longest" is unambiguous on `NONE` leaderboards. |

---

## CUMULATIVE

> TODO: Fill in after review. Initial sketch below — not yet validated.

Goal: accumulate `goal_distance` meters across any number of qualifying runs during the active window.

### Validator behavior — `validators/cumulative-validator.ts`

Current logic accepts any run-type activity with no distance filter. Every run contributes.

### State strategy — `participant-state/cumulative-state.ts`

- `resultDistance` = `sumDistances(contributions)`.
- `resultMovingTimeTotal` = `sumMovingTimes(contributions)`.
- `rankingValueSeconds` = `computeRankingValueFromContributions(contributions, rankingMetric)` (best single-run metric time, same algorithm as BEST_EFFORT).
- `highlightActivityId` = the **current** activity id (always the most recent activity that triggered processing).
- `goalMet` = `totalDistance >= goalDistance`. Strategy returns this; dispatcher flips status to `COMPLETED` accordingly.

### Scenarios

To be defined. Expected categories:

- No prior contributions, new activity below goal.
- Cumulative total crosses goal with this activity.
- Cumulative total already over goal; new activity adds more distance.
- Interaction with `rankingMetric` (does CUMULATIVE use it? If so, for what ordering?).
- Highlight-activity semantics: should it be "most recent" or "most representative" (longest? fastest on ranking metric?).

### Known open questions

- `highlightActivityId` currently always equals the triggering activity. Is that desirable if the leaderboard ranks by total distance?
- No validator filter on distance or goal relevance. Is a minimum-distance guard appropriate (e.g. reject 50m trailhead GPS blips)?
- Interaction between `resultMovingTimeTotal` and `rankingValueSeconds` — which drives tie-breaking on the leaderboard?

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
- Duplicate webhooks are de-duplicated at the contribution layer; they do not re-run the state strategy.

---

## Change log

- Initial draft: captures BEST_EFFORT in full, CUMULATIVE as a stub, SEGMENT_RACE as a TODO.
- Removed shared `isGoalMet` ladder; each state strategy now returns `{ metrics, goalMet }`. Resolves Scenario 6 (BEST_EFFORT could complete a goal whose ranking metric was unextractable but had its status stuck at `IN_PROGRESS`).
