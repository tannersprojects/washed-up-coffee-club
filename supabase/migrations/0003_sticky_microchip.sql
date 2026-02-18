-- Existing Types for Strava Webhook
CREATE TYPE "public"."webhook_aspect_type" AS ENUM('create', 'update', 'delete');
CREATE TYPE "public"."webhook_object_type" AS ENUM('activity', 'athlete');
CREATE TYPE "public"."webhook_status" AS ENUM('pending', 'processed', 'error');

-- Webhook Logs Table
CREATE TABLE IF NOT EXISTS "strava_webhook_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "payload" jsonb NOT NULL,
  "strava_athlete_id" bigint,
  "object_type" "webhook_object_type",
  "aspect_type" "webhook_aspect_type",
  "event_time" integer,
  "status" "webhook_status" DEFAULT 'pending',
  "error_message" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Helper: safely retrieve a named secret from Vault
CREATE OR REPLACE FUNCTION public.get_secret(secret_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT decrypted_secret
    FROM vault.decrypted_secrets
    WHERE name = secret_name
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger function: reads URL and key from Vault at execution time
CREATE OR REPLACE FUNCTION public.handle_new_strava_webhook()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Fetch values from Vault
  webhook_url := public.get_secret('webhook_url');
  -- service_role_key := public.get_secret('service_role_key');

  -- Validation
  IF webhook_url IS NULL OR webhook_url = '' THEN
    RAISE WARNING 'Webhook skipped: "webhook_url" not found in vault';
    RETURN NEW;
  END IF;

  -- IF service_role_key IS NULL OR service_role_key = '' THEN
  --   RAISE WARNING 'Webhook skipped: "service_role_key" not found in vault';
  --   RETURN NEW;
  -- END IF;

  -- Debugging: Check the key length in Postgres logs (supabase log --db)
  RAISE LOG 'Attempting webhook to % with key length %', webhook_url, length(service_role_key);

  -- Perform the asynchronous HTTP POST request
  -- Using explicit jsonb for headers to ensure correct serialization
  PERFORM net.http_post(
    url := webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
      -- 'Authorization', (SELECT 'Bearer ' || trim(both ' ' from service_role_key))
      -- TODO: Add custom JWT for Edge Function auth
    ),
    body := jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'record', row_to_json(NEW)
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Attach trigger
DROP TRIGGER IF EXISTS on_strava_webhook_inserted ON public.strava_webhook_logs;
CREATE TRIGGER on_strava_webhook_inserted
  AFTER INSERT ON public.strava_webhook_logs
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_strava_webhook();