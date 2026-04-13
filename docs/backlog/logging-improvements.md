# Logging Improvements

## Overview

Replace ad-hoc `console.log`/`console.error` usage across the Strava webhook pipeline and activity processing with structured, level-aware logging. Goals: easier debugging, production-safe verbosity, and traceability for webhook events.

## Current State

| File                                               | Logging style | Notes                                          |
| -------------------------------------------------- | ------------- | ---------------------------------------------- |
| `src/routes/api/strava/webhook/+server.ts`         | Minimal       | TODO for POST; only handshake + catch logged   |
| `src/routes/api/strava/process-webhook/+server.ts` | Moderate      | Entry, skips, errors, progress                 |
| `src/lib/server/strava-activity-processor.ts`      | Verbose       | Logs every step per challenge                  |
| `src/lib/server/strava-activity-validators.ts`     | Very verbose  | Debug-level validation pass/fail on every call |

## Issues

1. **No structured logger** — Raw `console`; no levels, no JSON output for aggregation.
2. **Missing POST logging** — Webhook ingest has `// TODO: Add logging`; no log when a webhook is received.
3. **Processor noise** — Per-challenge logs (validation result, existing check, insert, next state) will flood logs at scale.
4. **Validator noise** — Every validation pass/fail is logged; useful for debug, too noisy for production.
5. **No correlation IDs** — Can't trace a single webhook from receipt → processing → validation → DB.
6. **Inconsistent error handling** — Errors are logged but not consistently structured or correlated.

## Recommendations

### 1. Introduce a structured logger

- Use `pino` or `consola` with levels: `debug`, `info`, `warn`, `error`.
- Gate debug logs by env (e.g. `DEBUG=strava:*` or `NODE_ENV=development`).
- Output JSON in production for log aggregation (Vercel, Datadog, etc.).

### 2. Add POST logging in webhook ingest

Log on receipt: `object_type`, `object_id`, `owner_id`, and optionally the inserted `strava_webhook_logs` row ID.

### 3. Reduce processor verbosity

- **Info:** One log per activity (e.g. "Processed activity X for profile Y: N contributions").
- **Debug:** Per-challenge details (validation result, existing check, insert, next state).

### 4. Reduce validator verbosity

- **Debug:** All validation pass/fail (not a run, less than goal, valid, etc.).
- **Warn/Error:** Unexpected cases only (unknown challenge type, missing segment ID).

### 5. Add correlation context

Pass `webhookLogId` (and optionally `objectId`) through the call chain; include in log metadata so a single webhook can be traced end-to-end.

### 6. Standardize error logging

- Use the same logger and level for all errors.
- Ensure `strava_webhook_logs.errorMessage` remains the source of truth for persisted errors.

## Implementation Notes

- **Logger placement:** Create `src/lib/server/logger.ts` (or similar) and import where needed.
- **Context propagation:** Consider a lightweight context object or async-local storage for `webhookLogId` if the call chain grows.
- **Backward compatibility:** Existing `console.error` in catch blocks should be migrated to the logger; avoid breaking error handling.
- **Files to update:** `webhook/+server.ts`, `process-webhook/+server.ts`, `strava-activity-processor.ts`, `strava-activity-validators.ts`.
