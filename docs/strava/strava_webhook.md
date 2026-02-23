# Strava Webhook Guide

Reference for how the Strava webhook pipeline works and how to set it up. For schema and compliance details, see [`project_context.md`](../project/project_context.md).

---

## How It Works

The webhook pipeline has three stages: **ingest**, **trigger**, and **process**.

```
Strava                    SvelteKit                    Supabase DB
   │                          │                              │
   │  POST (activity event)   │                              │
   │ ──────────────────────► │  /api/strava/webhook         │
   │                          │  Insert into strava_webhook_logs
   │                          │ ──────────────────────────► │
   │                          │                              │
   │                          │         AFTER INSERT trigger │
   │                          │         handle_new_strava_webhook()
   │                          │         pg_net.http_post(webhook_url)
   │                          │ ◄──────────────────────────  │
   │                          │                              │
   │                          │  POST (record payload)       │
   │                          │  /api/strava/process-webhook │
   │                          │ ◄──────────────────────────  │ (internal)
   │                          │                              │
   │                          │  1. Look up strava_connections
   │                          │  2. Refresh token if expired
   │                          │  3. Fetch activity from Strava API
   │                          │  4. Validate vs active challenges
   │                          │  5. Insert challenge_contributions
   │                          │  6. Update challenge_participants
   │                          │  7. Set strava_webhook_logs.status
   │                          │ ──────────────────────────► │
   │                          │                              │
```

### Stage 1: Ingest (`/api/strava/webhook`)

Strava sends a POST when an activity is created, updated, or deleted. The ingest endpoint:

1. **GET** (subscription verification): When you create a subscription, Strava sends `hub.mode=subscribe`, `hub.verify_token`, and `hub.challenge`. The endpoint returns `hub.challenge` if the token matches `STRAVA_WEBHOOK_VERIFY_TOKEN`.
2. **POST** (event delivery): Receives the raw payload, extracts `owner_id`, `object_id`, `object_type`, `aspect_type`, `event_time`, and inserts a row into `strava_webhook_logs`. Returns `EVENT_RECEIVED` within 2 seconds (Strava requirement). Always returns 200 on ingest to avoid retries.

### Stage 2: Trigger (DB)

An `AFTER INSERT` trigger on `strava_webhook_logs` runs `handle_new_strava_webhook()`, which:

1. Reads `webhook_url` from `vault.secrets` (configured per environment).
2. Calls `pg_net.http_post` with a JSON body: `{ type: 'INSERT', table: 'strava_webhook_logs', record: { id, payload, stravaAthleteId, objectType, objectId, aspectType, eventTime, ... } }`.
3. The URL must point to your SvelteKit app’s `/api/strava/process-webhook` endpoint (e.g. ngrok URL for local dev, production URL for prod).

### Stage 3: Process (`/api/strava/process-webhook`)

The processor receives the DB record (not the raw Strava payload) and:

1. **Filter**: Skip if `object_type !== 'activity'` or `aspect_type !== 'create'`. Mark as `processed`.
2. **Lookup**: Find `strava_connections` by `strava_athlete_id`. If missing, mark `error`.
3. **Refresh**: Refresh the access token if expired (`refreshConnectionIfNeeded`).
4. **Fetch**: Call Strava `GET /activities/{id}` with `include_all_efforts=true`.
5. **Process**: For each active challenge the user participates in:
   - Validate activity (sport type, distance, segment effort) via `strava-activity-validators.ts`.
   - Skip if invalid or contribution already exists.
   - Insert into `challenge_contributions` (distance, time, activity name, etc.).
   - Update `challenge_participants` (result_distance, result_time, status, highlight_activity_id) via `strava-activity-processor.ts`.
6. **Status**: Set `strava_webhook_logs.status` to `processed` or `error` (with `error_message`).

---

## Setup

### Environment Variables

```env
STRAVA_CLIENT_ID="your_client_id"
STRAVA_CLIENT_SECRET="your_client_secret"
STRAVA_WEBHOOK_VERIFY_TOKEN="STRAVA_LOCAL_DEV"

# Local dev: ngrok URL (update when ngrok restarts)
PUBLIC_NGROK_URL="https://your-id.ngrok-free.app"

# Production
PUBLIC_APP_URL="https://your-domain.com"

# Database (Drizzle)
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# Supabase
SUPABASE_URL="http://127.0.0.1:54321"
SUPABASE_SERVICE_ROLE_KEY="your_local_service_role_key"
```

### Strava Subscription

Use the manage script to create, view, or delete the Strava push subscription:

```bash
# Local dev (uses PUBLIC_NGROK_URL)
npx tsx scripts/manage-strava.ts create

# Production (uses PUBLIC_APP_URL)
npx tsx scripts/manage-strava.ts create --prod

# View current subscription
npx tsx scripts/manage-strava.ts view

# Delete subscription
npx tsx scripts/manage-strava.ts delete <subscription_id>
```

The callback URL is `{PUBLIC_NGROK_URL|PUBLIC_APP_URL}/api/strava/webhook`.

### Vault Secret (process-webhook URL)

The DB trigger needs the process-webhook URL in `vault.secrets`. Set it via SQL:

```sql
DELETE FROM vault.secrets WHERE name IN ('webhook_url');
SELECT vault.create_secret(
  'https://your-ngrok-id.ngrok-free.app/api/strava/process-webhook',
  'webhook_url',
  'SvelteKit process-webhook endpoint for DB trigger'
);
```

For local dev, use your ngrok URL. For production, use your production domain. Update when ngrok restarts (local) or when deploying to a new URL.

---

## Key Files

| Purpose | Path |
|--------|------|
| Webhook ingest (Strava → DB) | `src/routes/api/strava/webhook/+server.ts` |
| Webhook processor (DB → leaderboard) | `src/routes/api/strava/process-webhook/+server.ts` |
| Activity validation | `src/lib/server/strava-activity-validators.ts` |
| Participant/contribution updates | `src/lib/server/strava-activity-processor.ts` |
| DB trigger | `supabase/migrations/0003_previous_spot.sql` |
| Subscription management | `scripts/manage-strava.ts` |
