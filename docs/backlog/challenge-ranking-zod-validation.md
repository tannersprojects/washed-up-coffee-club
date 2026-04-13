# Challenge Ranking: Zod Validation Boundaries

## Overview

Add runtime validation with Zod for the new challenge ranking metric pipeline so Strava payloads, ranking inputs, and JSONB snapshots are validated before persistence and before ranking calculations.

## Why This Matters

- `jsonb(...).$type<T>()` in Drizzle is compile-time only
- Webhook payloads and Strava API responses can evolve
- Ranking logic depends on nested `best_efforts`, `splits`, and `laps`
- Validation at boundaries reduces silent bad data and ranking regressions

## Scope

Validate at three boundaries:

1. **Webhook ingest boundary**
   - Validate the process-webhook request payload
   - Validate critical fields (`record.objectId`, `record.stravaAthleteId`, event type/aspect)

2. **Strava activity boundary**
   - Validate detailed activity response from `getActivityById(..., include_all_efforts=true, ...)`
   - Validate required ranking fields:
     - top-level: `id`, `distance`, `moving_time`, `elapsed_time`, `sport_type`
     - arrays: `best_efforts`, `splits_metric`, `splits_standard`, `laps`
     - segment efforts for segment-race path

3. **Ranking extraction boundary**
   - Validate JSON read from `challenge_contributions.best_efforts` before matching against ranking metric
   - Return `null` (unranked) if schema mismatch instead of throwing

## Suggested Schemas

- `stravaWebhookRecordSchema`
- `stravaDetailedActivitySchema` (full or focused subset)
- `stravaBestEffortSchema`
- `stravaSplitSchema`
- `stravaLapSchema`
- `challengeActivitySnapshotSchema`
- `rankingMetricSchema` (enum derived from constants)

## File Plan

- **Create:** `src/lib/schemas/strava.ts`
  - Strava response/input schemas
- **Create:** `src/lib/schemas/challenge-ranking.ts`
  - Ranking metric and snapshot schemas
- **Update:** `src/lib/server/strava.ts`
  - Parse `response.json()` through schema before camel-case conversion/use
- **Update:** `src/routes/api/strava/process-webhook/+server.ts`
  - Parse inbound request with schema
- **Update:** `src/lib/server/strava-activity-validators.ts`
  - Use parsed/validated shapes; avoid `unknown` branches
- **Update:** `src/lib/server/challenge-ranking.ts` (planned file)
  - Parse JSONB payloads before ranking extraction

## Error Handling Rules

- **Webhook request invalid:** mark webhook log as `error` with actionable message
- **Strava response invalid:** mark webhook log as `error`; do not write contribution
- **Ranking JSON invalid:** log warning + set participant unranked for that metric (`ranking_value_seconds = null`)
- Keep failures observable (structured logs including activity ID and participant/challenge IDs)

## Testing Checklist

- Unit tests for each schema:
  - valid payload from sample activity
  - missing critical fields
  - malformed `best_efforts` entries
- Integration tests:
  - webhook processing with valid payload inserts contribution
  - invalid Strava shape fails safely and logs error
  - invalid `best_efforts` JSON yields unranked participant, no crash

## Notes

- Start with focused schemas for ranking-critical fields; expand gradually.
- Prefer `safeParse` + explicit error mapping over throwing raw Zod errors.
- Reuse schema-derived types (`z.infer`) where possible to avoid duplicate type declarations.
