# Dev Endpoint Test Scenarios: Bad Requests + CUMULATIVE

This runbook covers end-to-end testing for:

- `POST /api/dev/test-create-activity` request validation (bad requests)
- CUMULATIVE ranking behavior using seeded data

It is written for the body-only endpoint contract in:

- `src/routes/api/dev/test-create-activity/+server.ts`

## Pre-reqs

- App server is running locally (example: `npm run dev`).
- Seed data from `supabase/seed.sql` has been applied.
- Endpoint URL:

```bash
BASE_URL="http://localhost:5173/api/dev/test-create-activity"
```

If your local server is bound to IPv4 only, switch to:

```bash
BASE_URL="http://127.0.0.1:5173/api/dev/test-create-activity"
```

## Seeded profile used for cumulative scenarios

Use this profile for all CUMULATIVE tests:

- `d0c2c0e0-1111-4444-8888-000000000007`

Why this one:

- It is seeded as a participant in the CUMULATIVE challenge
  (`challenge_id = c0000000-0000-0000-0000-000000000001`, status `registered`).
- It starts from an empty result state in the cumulative table, so transitions are easy to verify.

Note:

- This profile is also seeded into the best-effort challenge, so each test activity can fan out into both active challenges. That is expected with current processor behavior.

## Optional reset guidance (repeatable tests)

If you need a clean slate between runs for this profile, clear its contributions for both seeded challenges and reset its participant aggregate fields in SQL before rerunning scenarios.

## 1) Bad Request Scenarios

### BR-1: Missing Content-Type

```bash
curl -i -X POST "$BASE_URL"
```

Expected:

- `400`
- message includes: `Content-Type must be application/json`

### BR-2: Invalid JSON body

```bash
curl -i -X POST "$BASE_URL" \
  -H "content-type: application/json" \
  --data '{invalid'
```

Expected:

- `400`
- message includes: `Request body must be valid JSON`

### BR-3: Empty JSON object

```bash
curl -i -X POST "$BASE_URL" \
  -H "content-type: application/json" \
  --data '{}'
```

Expected:

- `400`
- message includes: `Request body is required`

### BR-4: Unexpected top-level field

```bash
curl -i -X POST "$BASE_URL" \
  -H "content-type: application/json" \
  --data '{
    "profileId":"d0c2c0e0-1111-4444-8888-000000000007",
    "foo":"bar"
  }'
```

Expected:

- `400`
- message includes: `Unexpected request body field: foo`

### BR-5: Invalid startDate

```bash
curl -i -X POST "$BASE_URL" \
  -H "content-type: application/json" \
  --data '{
    "profileId":"d0c2c0e0-1111-4444-8888-000000000007",
    "startDate":"not-a-date",
    "overrides":{"id":970001}
  }'
```

Expected:

- `400`
- message includes: `startDate must be a valid ISO date string`

### BR-6: Invalid overrides type/value

```bash
curl -i -X POST "$BASE_URL" \
  -H "content-type: application/json" \
  --data '{
    "profileId":"d0c2c0e0-1111-4444-8888-000000000007",
    "startDate":"2026-04-29T12:00:00.000Z",
    "overrides":{"id":-1}
  }'
```

Expected:

- `400`
- message includes: `overrides.id must be a positive integer`

## 2) CUMULATIVE Scenario Set

Challenge context from seed:

- CUMULATIVE challenge id: `c0000000-0000-0000-0000-000000000001`
- Ranking metric: `standard_half_marathon`
- Goal distance: `21083` (13.1 miles rounded)
- Active window: `CURRENT_DATE` through end of next day

These scenarios validate Rule A and Rule B paths for half-marathon ranking behavior.

Use unique `overrides.id` per request to avoid dedupe no-op.

### C-A: Rule A success with valid Half Marathon best effort

```bash
curl -i -X POST "$BASE_URL" \
  -H "content-type: application/json" \
  --data '{
    "profileId":"d0c2c0e0-1111-4444-8888-000000000007",
    "bestEffortsMode":"injectHalfMarathonCascade",
    "halfMarathonEffortTimeSeconds":5600,
    "halfMarathonEffortSource":"moving",
    "cascadeStrategy":"vdotDefault",
    "rounding":"nearestSecond",
    "overrides":{
      "id":980301,
      "distance":21083,
      "movingTime":5650,
      "elapsedTime":5720,
      "sportType":"Run"
    }
  }'
```

Expected cumulative effects:

- contribution inserted
- `result_distance` reaches/exceeds goal
- status transitions to `completed`
- `ranking_value_seconds` comes from Rule A HM effort (`5600`)
- highlight still follows longest-run semantics.

### C-B: Single 13.1-mile run with no valid HM effort -> Rule B fallback

```bash
curl -i -X POST "$BASE_URL" \
  -H "content-type: application/json" \
  --data '{
    "profileId":"d0c2c0e0-1111-4444-8888-000000000007",
    "bestEffortsMode":"none",
    "overrides":{
      "id":980302,
      "distance":21083,
      "movingTime":6000,
      "elapsedTime":6100,
      "sportType":"Run"
    }
  }'
```

Expected cumulative effects:

- Rule A returns null (no HM effort data)
- Rule B is used for ranking
- status transitions to `completed`
- with one contribution at goal distance, expected ranking approximates `6000` seconds.

### C-C: Multiple contributions, no HM efforts -> Rule B over cumulative totals

```bash
# Contribution 1: below goal, no HM effort
curl -i -X POST "$BASE_URL" \
  -H "content-type: application/json" \
  --data '{
    "profileId":"d0c2c0e0-1111-4444-8888-000000000007",
    "bestEffortsMode":"none",
    "overrides":{
      "id":980303,
      "distance":12000,
      "movingTime":3600,
      "elapsedTime":3700,
      "sportType":"Run"
    }
  }'

# Contribution 2: crosses goal, still no HM effort
curl -i -X POST "$BASE_URL" \
  -H "content-type: application/json" \
  --data '{
    "profileId":"d0c2c0e0-1111-4444-8888-000000000007",
    "bestEffortsMode":"none",
    "overrides":{
      "id":980304,
      "distance":10083,
      "movingTime":3200,
      "elapsedTime":3290,
      "sportType":"Run"
    }
  }'
```

Expected cumulative effects:

- first request remains `in_progress`
- second request reaches/exceeds goal and becomes `completed`
- Rule A remains null across both contributions
- Rule B ranking uses cumulative moving-time ratio:
  - `round((3600 + 3200) * (21097 / (12000 + 10083)))`
  - approximately `6494` seconds.

### C-D: Duplicate activity id is ignored (idempotency)

```bash
curl -i -X POST "$BASE_URL" \
  -H "content-type: application/json" \
  --data '{
    "profileId":"d0c2c0e0-1111-4444-8888-000000000007",
    "bestEffortsMode":"none",
    "overrides":{
      "id":980304,
      "distance":9999,
      "movingTime":9999,
      "elapsedTime":9999,
      "sportType":"Run"
    }
  }'
```

Expected cumulative effects:

- no new contribution row for duplicate `strava_activity_id`
- no additional totals or ranking changes from duplicate call.

## 3) CUMULATIVE policy scenario mapping notes

This runbook assumes the seed challenge now uses `standard_half_marathon` and goal `21083`.
The endpoint controls (`bestEffortsMode` + optional HM cascade fields) are used to force Rule A/Rule B paths deterministically.

## 4) Quick SQL checks after each scenario

Run these against local DB to validate cumulative participant state:

```sql
-- Cumulative participant row for profile ...0007
select
  cp.id,
  cp.status,
  cp.result_distance,
  cp.result_moving_time_seconds,
  cp.result_elapsed_time_seconds,
  cp.ranking_value_seconds,
  cp.highlight_activity_id,
  cp.ranking_computed_at
from challenge_participants cp
where cp.challenge_id = 'c0000000-0000-0000-0000-000000000001'
  and cp.profile_id = 'd0c2c0e0-1111-4444-8888-000000000007';

-- Contributions used for cumulative recompute
select
  c.strava_activity_id,
  c.distance,
  c.moving_time,
  c.elapsed_time,
  c.occurred_at
from challenge_contributions c
join challenge_participants cp on cp.id = c.participant_id
where cp.challenge_id = 'c0000000-0000-0000-0000-000000000001'
  and cp.profile_id = 'd0c2c0e0-1111-4444-8888-000000000007'
order by c.occurred_at asc;
```
