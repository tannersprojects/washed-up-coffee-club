# MVP Logging Plan (Pino + Vercel)

## Goal

Introduce structured, traceable logging with Pino so challenge participation and Strava activity processing can be debugged end-to-end in Vercel.

## MVP Scope

- Add a centralized server logger module using `pino`
- Add request correlation (`requestId`) at the server boundary
- Instrument challenge join/leave actions
- Instrument Strava webhook ingest and processing pipeline
- Document log conventions so future logs stay consistent

## Success Criteria

- Logs are structured JSON with stable event names
- Every critical flow includes correlation fields (`requestId`, `webhookLogId` where relevant)
- Errors are structured and actionable
- Production log volume remains manageable (`info` summaries, `debug` details gated by env)

## Deliverables

- `src/lib/server/logging/logger.ts`
- `src/lib/server/logging/events.ts`
- `src/lib/server/logging/request-context.ts`
- Instrumented routes/processors:
  - `src/hooks.server.ts`
  - `src/routes/(app)/dashboard/+page.server.ts`
  - `src/routes/api/strava/webhook/+server.ts`
  - `src/routes/api/strava/process-webhook/+server.ts`
  - `src/lib/server/strava/processors/activity-processor.ts`
  - `src/lib/server/strava/processors/activity-create-processor.ts`
- `docs/dev/logging.md`

## Event Naming Convention

Use `domain.action.stage`:

- `challenge.join.requested|succeeded|failed`
- `challenge.leave.requested|succeeded|failed`
- `strava.webhook.received|persisted|ingest_failed`
- `strava.webhook.process.started|skipped|completed|failed`
- `strava.activity.process.started|completed|failed`
- `strava.activity.challenge.validated|skipped|contribution_inserted|duplicate`
- `strava.activity.participant_state.updated`

## Required Log Fields

All logs:

- `event`
- `level`
- `requestId` (when request-scoped)
- `env`
- `service`

Challenge actions:

- `profileId`
- `challengeId`
- `participantId` (when available)

Webhook and processor flow:

- `webhookLogId`
- `aspectType`
- `objectType`
- `activityId`
- `stravaAthleteId`
- `profileId`
- `challengeId`
- `participantId`

Error logs:

- `err` (name/message/stack)
- relevant IDs above for correlation

## Log Level Policy

- `info`: lifecycle checkpoints and outcomes
- `warn`: recoverable anomalies (validation skips, suspicious state)
- `error`: failed operations
- `debug`: detailed per-challenge/validator internals

Default production level: `info`.  
Enable verbose diagnostics with `LOG_LEVEL=debug`.

## Implementation Plan

### Phase 1: Foundation

1. Install and configure `pino`.
2. Create a base logger module with:
   - env-driven log level
   - redaction for sensitive fields (`accessToken`, `authorization`, `cookie`, `refreshToken`)
   - child logger helper for context propagation
3. Add request ID generation/extraction in `hooks.server.ts`.
4. Emit request lifecycle logs:
   - request start
   - request finish (`status`, `durationMs`)

Acceptance:

- Shared logger available across server modules.
- Every request can be filtered by `requestId`.

### Phase 2: Webhook Traceability

1. Add ingest logs in `webhook/+server.ts`:
   - `strava.webhook.received`
   - `strava.webhook.persisted`
   - `strava.webhook.ingest_failed`
2. Add processing logs in `process-webhook/+server.ts`:
   - process start
   - validation skip/reason
   - process success/failure
3. Ensure `webhookLogId` is carried through processor calls.

Acceptance:

- A webhook is traceable from receipt to completion/error using `webhookLogId`.

### Phase 3: Business Flow Visibility

1. Add join/leave logs in dashboard actions.
2. Add activity processor summary logs:
   - start/completion/failure
   - activity ID + profile ID + aspect type
3. Add activity-create summary logs at `info`:
   - eligible challenge count
   - insert/duplicate counts
   - participant state updates
4. Keep per-challenge details at `debug`.

Acceptance:

- You can answer "why did/didn't this activity count?" from logs without local repro.
- Join/leave behavior is visible for admin debugging.

## Guardrails

- Never log secrets or full auth/session payloads.
- Avoid logging entire payload blobs at `info`; log selected fields.
- Use stable event names and typed helpers to prevent drift.
- Keep `strava_webhook_logs.errorMessage` as persisted source of truth for processing errors.

## Verification Checklist

- Trigger join/leave and verify event sequence in Vercel.
- Replay one webhook and confirm full trace by `webhookLogId`.
- Force one validation skip and one processing error; verify `warn`/`error` shape.
- Confirm `debug` logs appear only when enabled.
- Confirm sensitive fields are redacted.
