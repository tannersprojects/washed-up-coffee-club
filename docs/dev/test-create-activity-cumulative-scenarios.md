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
- Ranking metric: `activity_total`
- Goal distance: `21097`
- Active window: `CURRENT_DATE` through end of next day

Because the seeded cumulative metric is `activity_total`, these scenarios validate cumulative totals, completion, and metric ranking behavior under `ACTIVITY_TOTAL`.

Use unique `overrides.id` per request to avoid dedupe no-op.

### C-1: First qualifying run -> participant moves from REGISTERED to IN_PROGRESS

```bash
curl -i -X POST "$BASE_URL" \
  -H "content-type: application/json" \
  --data '{
    "profileId":"d0c2c0e0-1111-4444-8888-000000000007",
    "startDate":"2026-04-29T12:00:00.000Z",
    "overrides":{
      "id":970101,
      "distance":5000,
      "movingTime":1500,
      "elapsedTime":1540,
      "sportType":"Run"
    }
  }'
```

Expected cumulative effects:

- contribution inserted
- `result_distance` increases to about `5000`
- `result_moving_time_seconds` increases to about `1500`
- `result_elapsed_time_seconds` increases to about `1540`
- `status` becomes `in_progress`
- `ranking_value_seconds` equals cumulative moving time (`1500`)

### C-2: Additional run while still below goal

```bash
curl -i -X POST "$BASE_URL" \
  -H "content-type: application/json" \
  --data '{
    "profileId":"d0c2c0e0-1111-4444-8888-000000000007",
    "startDate":"2026-04-29T12:10:00.000Z",
    "overrides":{
      "id":970102,
      "distance":7000,
      "movingTime":2100,
      "elapsedTime":2160,
      "sportType":"Run"
    }
  }'
```

Expected cumulative effects:

- totals increase cumulatively (distance/time sums)
- `ranking_value_seconds` equals cumulative moving time (`1500 + 2100 = 3600`)
- status remains `in_progress`

### C-3: Cross goal threshold -> status flips to COMPLETED

```bash
curl -i -X POST "$BASE_URL" \
  -H "content-type: application/json" \
  --data '{
    "profileId":"d0c2c0e0-1111-4444-8888-000000000007",
    "startDate":"2026-04-29T12:20:00.000Z",
    "overrides":{
      "id":970103,
      "distance":10000,
      "movingTime":3300,
      "elapsedTime":3400,
      "sportType":"Run"
    }
  }'
```

Expected cumulative effects:

- total distance reaches/exceeds `21097`
- status transitions to `completed`
- totals remain sums of contributions
- `ranking_value_seconds` equals cumulative moving time (`1500 + 2100 + 3300 = 6900`)

### C-4: Over-goal additional run remains valid

```bash
curl -i -X POST "$BASE_URL" \
  -H "content-type: application/json" \
  --data '{
    "profileId":"d0c2c0e0-1111-4444-8888-000000000007",
    "startDate":"2026-04-29T12:30:00.000Z",
    "overrides":{
      "id":970104,
      "distance":3000,
      "movingTime":900,
      "elapsedTime":940,
      "sportType":"Run"
    }
  }'
```

Expected cumulative effects:

- totals continue increasing (over-goal is allowed)
- `ranking_value_seconds` continues as cumulative moving-time sum (`7800` after this step)
- status stays `completed`

### C-5: Duplicate activity id is ignored (idempotency)

```bash
curl -i -X POST "$BASE_URL" \
  -H "content-type: application/json" \
  --data '{
    "profileId":"d0c2c0e0-1111-4444-8888-000000000007",
    "startDate":"2026-04-29T12:30:00.000Z",
    "overrides":{
      "id":970104,
      "distance":9999,
      "movingTime":9999,
      "elapsedTime":9999,
      "sportType":"Run"
    }
  }'
```

Expected cumulative effects:

- no new contribution row for duplicate `strava_activity_id`
- no additional totals from this duplicate call
- `ranking_value_seconds` remains unchanged from C-4 (`7800`)

### C-6: movingTime null, elapsedTime present (preferred-time fallback path)

```bash
curl -i -X POST "$BASE_URL" \
  -H "content-type: application/json" \
  --data '{
    "profileId":"d0c2c0e0-1111-4444-8888-000000000007",
    "startDate":"2026-04-29T12:40:00.000Z",
    "overrides":{
      "id":970105,
      "distance":1600,
      "movingTime":0,
      "elapsedTime":520,
      "sportType":"Run"
    }
  }'
```

Expected cumulative effects:

- contribution accepted
- cumulative distance and elapsed totals include this contribution
- cumulative moving totals do not increase for `movingTime: 0`
- for cumulative `activity_total`, `ranking_value_seconds` remains tied to cumulative moving-time sum

## 3) CUMULATIVE policy scenario mapping notes

The seed challenge uses `activity_total`, so standard-distance Rule A / Rule B fallback scenarios are not directly exercised by this challenge configuration.

To test full Rule A/Rule B cumulative policy behavior (1-mile/half-marathon style metrics), create or seed a cumulative challenge with a standard-distance ranking metric (for example `standard_half_marathon`) and rerun the same pattern with activity payloads that do and do not include matching `best_efforts`.

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
