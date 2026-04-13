# Webhook Error Handling

## Overview

Document the current behavior of the Strava webhook ingest endpoint when errors occur, and outline options for improving failure handling and observability.

## Current Behavior

| Location                                   | Behavior                                                                                                                                                              |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/routes/api/strava/webhook/+server.ts` | POST handler returns `200 EVENT_RECEIVED` even when DB insert fails                                                                                                   |
| Rationale                                  | Strava retries webhooks on non-2xx responses. Returning 200 prevents duplicate processing and avoids Strava's retry storm if our DB or API is temporarily unavailable |

## Trade-offs

1. **Failed events are lost** — If the insert throws (DB down, schema mismatch, etc.), we log the error but return 200. Strava will not retry; the event is never persisted.
2. **No dead-letter** — There is no secondary storage for failed payloads.
3. **Limited traceability** — `console.error` captures the error but does not correlate it with the payload for later reprocessing.

## Future Options

### 1. Persist failed payloads before returning 200

- Create a `strava_webhook_failures` table (or similar) with `payload`, `error_message`, `created_at`.
- In the catch block: insert into failures, then return 200.
- Enables manual or scheduled reprocessing of failed events.

### 2. Retry queue

- Use a job queue (e.g. Trigger.dev, BullMQ) to process webhooks asynchronously.
- Ingest endpoint: insert into `strava_webhook_logs` (or queue), return 200 immediately.
- Worker: process from queue; on failure, retry with backoff or move to dead-letter.

### 3. Structured logging with correlation IDs

- Log failed payloads (or a hash) with a correlation ID in structured format (JSON).
- Enables log aggregation tools to trace and alert on webhook failures.
- Does not enable reprocessing but improves debugging.

## Related Docs

- [logging-improvements.md](./logging-improvements.md) — Structured logger and correlation context
- [project_context.md](../project/project_context.md) — Schema, webhook flow
