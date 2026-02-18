# Strava Webhook: Future Work

This document captures the remaining work after the webhook ingest pipeline has shipped. The ingest layer (SvelteKit endpoint -> `strava_webhook_logs` table -> DB trigger -> Edge Function scaffold) is in place. The items below cover the **processing logic** and **operational concerns** that still need implementation.

---

## 1. Edge Function Processing Logic

**File:** `supabase/functions/process-strava-webhook/index.ts`

The Edge Function currently validates the request, logs the event, and updates the webhook log status. The full processing flow needs to be implemented:

1. **Look up athlete's Strava connection** -- Query `strava_connections` using `strava_athlete_id` from the webhook log record to get the `access_token` and `refresh_token`.
2. **Refresh token if expired** -- Check `expires_at` against the current time. If expired, call the Strava token refresh endpoint and update the `strava_connections` row with the new tokens. Reuse the pattern from `src/lib/server/strava.ts` (`refreshAccessToken()`).
3. **Fetch full activity details** -- Call `GET https://www.strava.com/api/v3/activities/{activity_id}` using the athlete's access token. The `activity_id` is `object_id` from the original Strava webhook payload (stored in `strava_webhook_logs.payload`).
4. **Check active challenges** -- Query `challenges` for rows where `status = 'active'` and the activity's `start_date` falls within the challenge's date range.
5. **Validate activity against challenge criteria** -- Depending on `challenge.type`:
   - `best_effort`: Is the activity type a Run? Does `distance >= goal_value`?
   - `cumulative`: Is the activity type a Run? Add distance to running total.
   - `segment_race`: Does the activity contain an effort on `challenge.segment_id`?
6. **Create contribution** -- Insert into `challenge_contributions` with the activity details and calculated value.
7. **Update participant aggregate** -- Update `challenge_participants.result_value` and `result_display` based on the new contribution.
8. **Update log status** -- Set `strava_webhook_logs.status` to `'processed'` on success, or `'error'` with `error_message` on failure.

### Error Handling

- If the athlete has no Strava connection, mark the log as `'error'` with a descriptive message.
- If the Strava API returns a rate limit (429), consider a retry strategy or log for manual follow-up.
- If no active challenge exists, mark as `'processed'` (not an error -- just nothing to do).

---

## 2. Token Refresh in Edge Function

The Edge Function runs in a Deno environment (Supabase Edge Runtime), separate from the SvelteKit server. It cannot import `src/lib/server/strava.ts` directly. The token refresh logic needs to be reimplemented within the Edge Function or extracted into a shared utility.

**Approach options:**

- **Inline in Edge Function:** Duplicate the refresh logic (simple, self-contained).
- **Shared via database function:** Create a Postgres function that handles token refresh and returns the valid access token. The Edge Function calls this via Supabase client RPC.

---

## 3. Production Webhook Registration

Register the Strava webhook subscription pointing to the production domain.

**Current state:** `scripts/manage-strava.ts` reads `PUBLIC_NGROK_URL` from `.env` and constructs the callback URL as `${PUBLIC_NGROK_URL}/api/strava/webhook`.

**To do:**

- Update the script to accept an optional `--prod` flag or `--url` argument that overrides the ngrok URL with the production domain.
- Production callback URL format: `https://your-domain.com/api/strava/webhook`
- Strava only allows **one** webhook subscription per application. Deleting the dev subscription before creating the production one is required.

---

## 4. Admin "Force Sync" Button

A fallback mechanism on the `/admin` route that manually triggers the activity fetch and challenge matching flow for a specific user or all participants.

**Use cases:**

- Webhook delivery failed or was missed.
- Testing during local development (webhooks cannot reach localhost without a tunnel).
- Manual correction after a bug fix.

**Implementation sketch:**

- Add a form action in `src/routes/(app)/admin/+page.server.ts` that:
  1. Queries all active challenge participants.
  2. For each participant, fetches their recent Strava activities.
  3. Runs the same matching/contribution logic as the Edge Function.
- This reuses the same core logic, so consider extracting it into a shared service layer.

---

## 5. Athlete Deauthorization Handling

Strava sends webhook events with `object_type: 'athlete'` when a user revokes the app's access. Currently the Edge Function skips non-activity events.

**To do:**

- When `object_type === 'athlete'` and `aspect_type === 'update'` with `updates.authorized === 'false'`:
  1. Look up the `strava_connections` row by `strava_athlete_id`.
  2. Delete or invalidate the connection (clear tokens, mark as revoked).
  3. Optionally notify the admin.
- This is required for Strava API compliance -- apps must respect deauthorization events and stop using the athlete's data.
