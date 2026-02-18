# Comprehensive Guide: Strava Webhooks with SvelteKit, Drizzle & Supabase

This document outlines the workflow for implementing Strava Webhooks using SvelteKit, Drizzle ORM, and Supabase (Local Docker/CLI).

---

## 1. Prerequisites & Environment Setup

### Environment Variables (.env)

These are for your SvelteKit server and management scripts.

```env
STRAVA_CLIENT_ID="your_client_id"
STRAVA_CLIENT_SECRET="your_client_secret"
STRAVA_WEBHOOK_VERIFY_TOKEN="STRAVA_LOCAL_DEV"

# Local Tunnel (Update this when ngrok restarts)
PUBLIC_NGROK_URL="https://your-id.ngrok-free.app"

# Database Connection (for Drizzle)
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# Local Supabase Secrets (for SvelteKit side)
SUPABASE_URL="http://127.0.0.1:54321"
SUPABASE_SERVICE_ROLE_KEY="your_local_service_role_key"
```

---

## 2. Constants file

Create `src/lib/constants/strava.ts` to include the following constants.

```ts

export const WEBHOOK_OBJECT_TYPE = {
	ACTIVITY: 'activity',
	ATHLETE: 'athlete'
} as const;

export type WebhookObjectType = (typeof WEBHOOK_OBJECT_TYPE)[keyof typeof WEBHOOK_OBJECT_TYPE];

export const WEBHOOK_ASPECT_TYPE = {
	CREATE: 'create',
	UPDATE: 'update',
	DELETE: 'delete'
} as const;

export type WebhookAspectType = (typeof WEBHOOK_ASPECT_TYPE)[keyof typeof WEBHOOK_ASPECT_TYPE];

export const WEBHOOK_STATUS = {
	PENDING: 'pending',
	PROCESSED: 'processed',
	ERROR: 'error'
} as const;

export type WebhookStatus = (typeof WEBHOOK_STATUS)[keyof typeof WEBHOOK_STATUS];

```

## 2. Drizzle Schema & Migration Strategy

### Define the Schema

Update your `src/lib/db/schema.ts` to include the logs table. We extract key fields from the Strava payload for easier querying.

```ts
import { pgTable, uuid, jsonb, text, timestamp, bigint, integer, pgEnum } from 'drizzle-orm/pg-core';
import { WEBHOOK_OBJECT_TYPE, WEBHOOK_ASPECT_TYPE, WEBHOOK_STATUS } from '$lib/constants/webhook-constants';

// Webhook Enums mapped to our constants
export const webhookObjectTypeEnum = pgEnum('webhook_object_type', [
  WEBHOOK_OBJECT_TYPE.ACTIVITY,
  WEBHOOK_OBJECT_TYPE.ATHLETE
]);

export const webhookAspectTypeEnum = pgEnum('webhook_aspect_type', [
  WEBHOOK_ASPECT_TYPE.CREATE,
  WEBHOOK_ASPECT_TYPE.UPDATE,
  WEBHOOK_ASPECT_TYPE.DELETE
]);

export const stravaWebhookLogs = pgTable('strava_webhook_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  // The raw payload for audit purposes
  payload: jsonb('payload').notNull(),
  // Extracted fields for easier querying and type safety
  stravaAthleteId: bigint('strava_athlete_id', { mode: 'number' }),
  objectType: webhookObjectTypeEnum('object_type'),
  aspectType: webhookAspectTypeEnum('aspect_type'),
  // Note: event_time from Strava is a Unix timestamp (seconds)
  eventTime: integer('event_time'),
  // Processing metadata
  status: text('status').default(WEBHOOK_STATUS.PENDING),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});
```

### Create the Combined Migration

1. **Generate:**

   ```bash
   npm run db:generate
   ```

2. **Edit:** Open the generated `.sql` file in `drizzle/` and append the following trigger logic:

```sql
-- Custom SQL for Strava Webhook Trigger

-- 1. Create function to call local Edge Function
CREATE OR REPLACE FUNCTION public.handle_new_strava_webhook()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM
    net.http_post(
      url:='http://host.docker.internal:54321/functions/v1/process-strava-webhook',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
      body:=jsonb_build_object('record', row_to_json(NEW))::jsonb
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the Trigger
CREATE TRIGGER on_strava_webhook_inserted
  AFTER INSERT ON public.strava_webhook_logs
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_strava_webhook();
```

---

## 3. SvelteKit Webhook Endpoint (with Luxon)

Update `src/routes/api/strava/webhook/+server.ts`. We use Luxon here to ensure we handle the Strava `event_time` (Unix seconds) correctly if we ever need to transform it before the insert.

```ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { DateTime } from 'luxon';
import { STRAVA_WEBHOOK_VERIFY_TOKEN } from '$env/static/private';
import { db } from '$lib/db';
import { stravaWebhookLogs } from '$lib/db/schema';
import { WEBHOOK_OBJECT_TYPE, WEBHOOK_ASPECT_TYPE } from '$lib/constants/webhook-constants';
import type { WebhookObjectType, WebhookAspectType } from '$lib/constants/webhook-constants';

export const GET: RequestHandler = async ({ url }) => {
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === STRAVA_WEBHOOK_VERIFY_TOKEN) {
    return json({ "hub.challenge": challenge });
  }
  return new Response('Forbidden', { status: 403 });
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();

    // Luxon Example: Converting the event_time for logging purposes if needed
    // Strava event_time is in seconds; Luxon fromSeconds handles it perfectly
    const eventTimeLuxon = DateTime.fromSeconds(body.event_time);
    console.log(`Received event from ${eventTimeLuxon.toHTTP()}`);

    // Quickest possible DB operation to stay under 2-second limit
    await db.insert(stravaWebhookLogs).values({
      payload: body,
      stravaAthleteId: body.owner_id,
      objectType: body.object_type as WebhookObjectType,
      aspectType: body.aspect_type as WebhookAspectType,
      eventTime: body.event_time
    });

    return new Response('EVENT_RECEIVED', { status: 200 });
  } catch (err) {
    console.error('Webhook Ingest Error:', err);
    return new Response('Internal Error', { status: 500 });
  }
};
```

---

## 4. Local Edge Function Development

### Managing Secrets

Create a file at `supabase/functions/.env`:

```env
SUPABASE_URL=http://host.docker.internal:54321
SUPABASE_SERVICE_ROLE_KEY=your_local_service_role_key
```

Run the worker locally:

```bash
supabase functions serve
```

---
