# Challenge Ranking Module Split Epic

**Status:** Draft  
**Type:** Epic plan (implementation not started)  
**Primary goal:** Decouple BEST_EFFORT ranking logic from shared ranking helpers, and introduce CUMULATIVE-specific ranking logic that matches current product policy.

---

## 1) Why this epic exists

`src/lib/server/strava/challenge-ranking.ts` currently contains logic that is primarily BEST_EFFORT-oriented (for example, extracting ranking values from `bestEfforts` snapshots). As CUMULATIVE rules diverge (Rule A then Rule B fallback, completion-gated ranking visibility, tolerance-based fallback behavior, longest-run highlight semantics), shared helpers become harder to reason about and evolve safely.

This epic separates concerns so each challenge type owns its ranking behavior while preserving common primitives only where they are truly generic.

---

## 2) Scope

### In scope

- Move BEST_EFFORT-specific ranking extraction/selection behavior into BEST_EFFORT-owned modules.
- Create CUMULATIVE-owned ranking helpers with explicit Rule A / Rule B flow.
- Update participant state computation for CUMULATIVE to use the new helpers.
- Align leaderboard rank visibility behavior with completion policy.
- Add tests and migration-safe verification for the split.

### Out of scope

- Segment race redesign.
- New admin UX for ranking configuration.
- Historical backfill/migration of old ranking outcomes.
- Update/Delete webhook implementation beyond documenting TODO impacts.

---

## 3) Current-state snapshot (high level)

- `challenge-ranking.ts` includes:
  - split extraction from `bestEfforts`,
  - ranking-value computation across contributions,
  - generic sum helpers.
- `cumulative-state.ts` uses the same shared ranking function currently used by BEST_EFFORT patterns.
- `highlightActivityId` for CUMULATIVE is currently the latest activity id, not longest run.
- Leaderboard rankability currently checks metric presence rather than completion gate.

---

## 4) Epic milestones and stories

## Epic A: Define the module boundaries

### Story A1: Classify helpers as shared vs challenge-specific

- Create an inventory of functions in `challenge-ranking.ts`.
- Label each helper:
  - shared primitive,
  - BEST_EFFORT-owned,
  - CUMULATIVE-owned.
- Produce a final target module map.

**Helper ownership inventory (finalized)**

| Existing helper                        | Owner                         | Destination module                                                                                         | Why                                                                                        |
| -------------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `sumDistances`                         | Shared primitive              | `src/lib/server/strava/participant-state/ranking/shared-ranking.ts`                                        | Pure numeric aggregation with no strategy policy                                           |
| `sumMovingTimes`                       | Shared primitive              | `src/lib/server/strava/participant-state/ranking/shared-ranking.ts`                                        | Pure numeric aggregation with no strategy policy                                           |
| `sumElapsedTimes`                      | Shared primitive              | `src/lib/server/strava/participant-state/ranking/shared-ranking.ts`                                        | Pure numeric aggregation with no strategy policy                                           |
| `getPreferredTime`                     | Shared primitive              | `src/lib/server/strava/participant-state/ranking/shared-ranking.ts`                                        | Time-field selection fallback usable across strategies                                     |
| `extractRankingValueFromBestEfforts`   | BEST_EFFORT-owned             | `src/lib/server/strava/participant-state/ranking/best-effort-ranking.ts`                                   | Uses BEST_EFFORT split snapshot naming/distance matching                                   |
| `computeRankingValueFromContributions` | CUMULATIVE-owned              | `src/lib/server/strava/participant-state/ranking/cumulative-ranking.ts` as `computeCumulativeRankingValue` | CUMULATIVE currently consumes this behavior; explicit owner avoids ambiguous shared policy |
| `DISTANCE_TOLERANCE_RATIO`             | Shared primitive              | `src/lib/server/strava/participant-state/ranking/shared-ranking.ts`                                        | Shared split distance tolerance used by BEST_EFFORT and CUMULATIVE ranking extraction      |
| `getFastestContribution`               | Segment-race owned (deferred) | Removed from shared surface; reintroduce under segment-race module when segment ranking is implemented     | Not challenge-agnostic and currently unused in active logic                                |

**Acceptance criteria**

- Every helper has a clear owner.
- No helper is left in a "temporary/maybe shared" category.

### Story A2: Establish file/module structure

- Decide target files, e.g.:
  - `participant-state/best-effort-ranking.ts` (or similar),
  - `participant-state/cumulative-ranking.ts`,
  - a slimmed `challenge-ranking.ts` for pure shared math/time primitives.
- Define naming conventions and export boundaries.

**Target file/module structure (finalized)**

- `src/lib/server/strava/participant-state/ranking/shared-ranking.ts`
  - Shared math/time primitives only (`sum*`, `getPreferredTime`, `DISTANCE_TOLERANCE_RATIO`).
- `src/lib/server/strava/participant-state/ranking/best-effort-ranking.ts`
  - BEST_EFFORT ranking extraction/selection and highlight logic.
- `src/lib/server/strava/participant-state/ranking/cumulative-ranking.ts`
  - CUMULATIVE ranking entrypoint (`computeCumulativeRankingValue`) with strategy-owned policy path.
- `src/lib/server/strava/participant-state/best-effort-state.ts`
  - Orchestration-only state assembly; imports BEST_EFFORT ranking entrypoints.
- `src/lib/server/strava/participant-state/cumulative-state.ts`
  - Orchestration-only state assembly; imports CUMULATIVE entrypoint + shared aggregate helpers.

**Naming and export boundaries**

- Keep `compute*` naming for strategy entrypoints (`computeBestEffortRankingValue`, `computeCumulativeRankingValue`).
- Keep `select*`/`extract*` naming for strategy-local internals.
- Keep named exports only across `ranking/*` modules (no wildcard strategy re-exporting).
- Keep import directions one-way:
  - `participant-state/* -> ranking/*`
  - `participant-state/ranking/* -> participant-state/ranking/shared-ranking.ts`
  - no `best-effort-ranking <-> cumulative-ranking` cross-imports.

**Acceptance criteria**

- Import graph is acyclic and readable.
- Strategy modules no longer depend on ambiguous shared ranking behavior.

---

## Epic B: Extract BEST_EFFORT ranking ownership

### Story B1: Move BEST_EFFORT extraction logic out of shared module

- Relocate BEST_EFFORT-centric effort extraction and matching logic from `challenge-ranking.ts` into BEST_EFFORT-owned module(s).
- Keep behavior unchanged during move (pure extraction/refactor step).

**Acceptance criteria**

- BEST_EFFORT ranking outputs remain behaviorally identical.
- `challenge-ranking.ts` no longer contains BEST_EFFORT-only policy logic.

### Story B2: Preserve deterministic effort selection behavior

- Ensure tie-breaking/selection semantics remain explicit and deterministic.
- Keep "pick fastest valid effort" behavior documented and covered.

**Acceptance criteria**

- Deterministic outcomes for equal-time/equal-candidate scenarios.
- Tests assert stable winner selection.

---

## Epic C: Build CUMULATIVE-specific ranking engine

### Story C1: Implement Rule A path (single-activity metric extraction)

- Add CUMULATIVE helper that first attempts metric extraction from single-activity efforts for each contribution.
- Keep this path explicit and separable from fallback logic.

**Implementation note**

- `computeCumulativeRuleARankingValue` owns the single-activity extraction path.
- `computeCumulativeRankingValue` delegates to Rule A until Rule B fallback is introduced.
- Rule A preserves current behavior for documented scenarios wh ere a qualifying single-activity effort exists.

**Acceptance criteria**

- Rule A path can be reasoned about independently.
- Scenario parity with documented CUMULATIVE table for Rule A cases.

### Story C2: Implement Rule B path (fallback ranking derivation)

- Add fallback logic that runs only when Rule A cannot produce a result and participant is eligible by policy.
- Use moving-time-centric derivation per policy.

**Implementation note**

- `computeCumulativeRankingValue` returns the Rule A value immediately when single-activity extraction succeeds.
- Rule B runs only when Rule A returns `null`.
- C2 uses strict eligibility: the ranking metric distance must match `goalDistance`, and total cumulative distance must be at least that target distance.
- Rule B derives ranking time from cumulative moving time: `round(totalMovingTime * (targetMetricDistance / totalDistance))`.
- Near-goal tolerance remains deferred to Story C3.

**Acceptance criteria**

- Rule B executes only when Rule A fails.
- Fallback is deterministic and documented.

### Story C3: Add tolerance-aware fallback eligibility

- Implement near-goal tolerance gate (1%).
- Ensure tolerance affects fallback ranking eligibility but does not bypass completion policy.

**Implementation note**

- CUMULATIVE Rule B fallback uses the shared `DISTANCE_TOLERANCE_RATIO` (`0.01`) for near-goal distance eligibility.
- A participant can receive a fallback ranking value when `totalDistance >= targetMetricDistance * (1 - DISTANCE_TOLERANCE_RATIO)`.
- Completion remains strict and unchanged: `goalMet` still requires `totalDistance >= goalDistance`.
- Tolerance applies only after Rule A fails and only inside Rule B eligibility.

**Acceptance criteria**

- Tolerance behavior matches documented scenarios.
- Completion semantics remain explicit and unchanged unless intentionally updated.

### Story C4: Set CUMULATIVE highlight semantics

- Replace "latest activity" highlight behavior with "longest run" highlight selection.
- Define deterministic tie-breaks for equal longest distance.

**Implementation note**

- `selectCumulativeHighlightActivityId` selects the longest contribution by distance.
- Equal distances break by faster preferred time (`movingTime` then `elapsedTime`).
- Equal distance and equal preferred time break by lower `stravaActivityId`.
- Deterministic behavior is implemented; test coverage is deferred to the upcoming unit-test story.

**Acceptance criteria**

- `highlightActivityId` resolves to longest-run contribution.
- Tie behavior is deterministic and test-covered.

---

## Epic D: Integrate state + UI policy alignment

### Story D1: Wire new helpers into participant state

- Update `computeMetricsForCumulativeChallenge` to call CUMULATIVE-owned ranking flow.
- Keep aggregate totals (`sumDistances`, `sumMovingTimes`, `sumElapsedTimes`) intact.

**Implementation note**

- `computeMetricsForCumulativeChallenge` keeps aggregate totals independent from ranking derivation.
- CUMULATIVE ranking value comes from `computeCumulativeRankingValue`.
- CUMULATIVE highlight selection comes from `selectCumulativeHighlightActivityId`.

**Acceptance criteria**

- Participant aggregate values are correct and unchanged except where policy dictates.
- Ranking value source is CUMULATIVE-owned logic.

### Story D2: Enforce ranking visibility gate in leaderboard flow

- Ensure ranking display/order is gated by completion status for CUMULATIVE policy.
- Preserve existing status ordering and null-safety behavior.

**Implementation note**

- Leaderboard row rankability is centralized in `isParticipantRankable`.
- CUMULATIVE participants are not rankable until `status === COMPLETED`.
- In-progress CUMULATIVE participants may still show progress totals, but active rank/time is hidden.
- Test coverage is deferred to the upcoming unit-test story.

**Acceptance criteria**

- In-progress participants are not shown with active rank/time.
- Completed participants remain rankable per metric policy.

---

## Epic E: Verification and rollout hardening

### Story E1: Add focused unit tests for ranking modules

- BEST_EFFORT tests:
  - extraction matching,
  - fastest-valid-effort selection,
  - tie-break determinism.
- CUMULATIVE tests:
  - Rule A success,
  - Rule A fail -> Rule B success,
  - tolerance boundary behavior,
  - longest-run highlight.

**Acceptance criteria**

- Coverage exists for all documented scenario categories.
- Regression tests protect module split from accidental behavior drift.

### Story E2: Add participant-state integration tests

- Validate end-to-end recompute outcomes from contribution sets.
- Assert rank/time/goal/highlight status combinations for both challenge types.

**Acceptance criteria**

- Integration tests align with `docs/challenge-ranking-scenarios.md`.
- Recompute remains deterministic regardless of contribution order.

### Story E3: Operational readiness and cleanup

- Remove dead/duplicated ranking helpers.
- Add inline docs/comments for ownership boundaries.
- Update planning docs and changelog entries.

**Acceptance criteria**

- No stale helper paths remain.
- Documentation accurately reflects shipped architecture.

---

## 5) Suggested implementation order

1. Epic A (boundary definition)
2. Epic B (BEST_EFFORT extraction move, behavior-preserving)
3. Epic C (new CUMULATIVE engine)
4. Epic D (state/UI wiring)
5. Epic E (tests + cleanup)

This order minimizes risk by first isolating behavior, then introducing new CUMULATIVE policy logic.

---

## 6) Key risks and mitigations

- **Risk:** behavior drift during helper relocation.  
  **Mitigation:** move-only PR step with snapshot tests before policy changes.

- **Risk:** ambiguous Rule B formula causes fairness disputes.  
  **Mitigation:** lock formula in doc before implementation and test boundary cases.

- **Risk:** UI ranking gate conflicts with existing sorting assumptions.  
  **Mitigation:** integration tests for mixed participant statuses and null ranking values.

---

## 7) Definition of done (epic)

- BEST_EFFORT ranking logic is owned by BEST_EFFORT modules.
- CUMULATIVE ranking logic is owned by CUMULATIVE modules.
- Shared module contains only truly shared primitives.
- CUMULATIVE behavior matches documented policy scenarios.
- Ranking visibility honors completion gate.
- Tests cover core scenarios and deterministic tie behavior.
- Docs are updated to reflect final architecture and decisions.
