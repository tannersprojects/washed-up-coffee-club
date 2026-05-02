# Server logging

Structured logging uses **Pino** on the server. See `docs/backlog/logging/mvp-logging-plan.md` for the full MVP.

## Phase 1 (foundation)

- **Base logger:** `$lib/server/logging/logger.ts` exports `logger`, `createChildLogger`, and `serializeError`.
- **Request scope:** `hooks.server.ts` runs first a `requestLoggingHandle` that sets `event.locals.requestId`, `event.locals.logger`, logs `server.request.started` / `server.request.finished`, and echoes `x-request-id` on the response.
- **Correlation:** Prefer filtering logs by `requestId`. Incoming requests may send `x-request-id`; otherwise the server generates one.

## Phase 2 (webhook traceability)

Ingest (`src/routes/api/strava/webhook/+server.ts`):

| Event                          | When                                          |
| ------------------------------ | --------------------------------------------- |
| `strava.webhook.handshake_ok`  | GET subscription verification succeeds        |
| `strava.webhook.received`      | POST body parsed (summary fields only)        |
| `strava.webhook.persisted`     | Row inserted; child logger has `webhookLogId` |
| `strava.webhook.ingest_failed` | Any ingest error (response still 200)         |

Processing (`src/routes/api/strava/process-webhook/+server.ts`), after Supabase trigger delivers the row:

| Event                                 | Level | When                                        |
| ------------------------------------- | ----- | ------------------------------------------- |
| `strava.webhook.process.invalid_json` | warn  | Request body is not valid JSON (HTTP 400)   |
| `strava.webhook.process.started`      | info  | Record loaded; before validation            |
| `strava.webhook.process.skipped`      | warn  | Validation skip (e.g. non-activity type)    |
| `strava.webhook.process.failed`       | error | Validation error or `processActivity` throw |
| `strava.webhook.process.completed`    | info  | Activity processed and row marked processed |

**Correlation:** Use `webhookLogId` (UUID from `strava_webhook_logs.id`) together with `requestId`. Ingest logs attach `webhookLogId` after insert; process logs use a child logger with `webhookLogId`, `aspectType`, `objectType`, `activityId`, `stravaAthleteId` where present.

**Processors:** `WebhookCorrelation` is passed through `processActivity` → `processCreateActivity` so activity logs can include `webhookLogId` when present.

**Vercel / log exploration:** Filter JSON logs by `webhookLogId` for one webhook end-to-end, or by `requestId` for a single HTTP request (ingest and process may differ if trigger runs asynchronously).

## Phase 3 (business flow visibility)

### Dashboard challenge actions (`src/routes/(app)/dashboard/+page.server.ts`)

| Event                      | Level        | When                                                        |
| -------------------------- | ------------ | ----------------------------------------------------------- |
| `challenge.join.requested` | info         | User passed validation; about to insert participant         |
| `challenge.join.succeeded` | info         | Join persisted; includes `participantId`                    |
| `challenge.join.failed`    | warn         | Expected failures (unauthenticated, validation, conflict)   |
| `challenge.join.failed`    | error        | DB / unexpected error (`err`)                               |
| `challenge.leave.*`        | same pattern | Includes `participantId` on requested/succeeded where known |

Failure logs include a machine-readable **`reason`** (e.g. `already_participating`, `not_participating`).

### Activity processor (`src/lib/server/strava/processors/activity-processor.ts`)

Uses root `logger` with child fields `profileId`, `activityId`, `aspectType`, optional `webhookLogId`:

| Event                               | Level | When                  |
| ----------------------------------- | ----- | --------------------- |
| `strava.activity.process.started`   | info  | Before aspect handler |
| `strava.activity.process.completed` | info  | Handler returned      |
| `strava.activity.process.failed`    | error | Handler threw (`err`) |

### Activity create (`src/lib/server/strava/processors/activity-create-processor.ts`)

| Event                                             | Level | When                                                                                |
| ------------------------------------------------- | ----- | ----------------------------------------------------------------------------------- |
| `strava.activity.challenge.skipped`               | debug | Validation failed for a challenge                                                   |
| `strava.activity.challenge.validated`             | debug | Validation passed                                                                   |
| `strava.activity.challenge.contribution_inserted` | debug | New contribution row                                                                |
| `strava.activity.challenge.duplicate`             | debug | Same activity already counted (`onConflictDoNothing`)                               |
| `strava.activity.participant_state.updated`       | info  | Aggregates updated after an insert                                                  |
| `strava.activity.create.summary`                  | info  | One rollup: eligible count, insert/duplicate/skip counts, participant state updates |

Optional fourth argument **`parentLogger`** (e.g. `locals.logger` from [`test-create-activity/+server.ts`](src/routes/api/dev/test-create-activity/+server.ts)) merges `requestId` into create-path logs in dev.

### Debugging workflows

- **`webhookLogId`:** Strava ingest → DB row → async process → activity pipeline (when webhook-driven).
- **`requestId`:** Single HTTP request (dashboard actions, dev routes); pairs with request lifecycle logs.
- **`activityId` + `profileId`:** Narrow activity processing across webhook and dev replay.

## Required baseline fields

Per MVP conventions, structured logs should include:

| Field       | Notes                                                    |
| ----------- | -------------------------------------------------------- |
| `event`     | Stable name, e.g. `server.request.started`               |
| `level`     | Provided by Pino                                         |
| `requestId` | When the log is request-scoped (child logger from hooks) |
| `env`       | From `NODE_ENV` (default `development`) on base logger   |
| `service`   | `washed-up-coffee-club` on base logger                   |

Child loggers include `requestId`, `method`, and `path` where applicable.

## Event names

Use `domain.action.stage` strings. Phase 1 lifecycle events live in `$lib/server/logging/events.ts` (`LoggingEvents`).

## Log level

- Default production level: **`info`**.
- Override with **`LOG_LEVEL`** (e.g. `debug` for verbose diagnostics).

## Security

- Do not log secrets, full auth payloads, or raw session data.
- The base logger redacts paths including `accessToken`, `refreshToken`, `authorization`, and `cookie` (see `logger.ts`).

## Usage in route handlers and server modules

- **Inside a request** (handlers, `load`, actions): use `event.locals.logger` so logs include `requestId`.
- **Outside a request** (scripts, rare server utilities): import `logger` from `$lib/server/logging/logger.ts`.

Errors should attach `err: serializeError(error)` for structured traces.

## Manual verification

1. `npm run dev`, open any page or API route.
2. In the terminal, confirm JSON lines for `server.request.started` and `server.request.finished` share the same `requestId`.
3. Confirm the response includes header `x-request-id`.
