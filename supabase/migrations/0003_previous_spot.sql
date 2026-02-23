CREATE TYPE "public"."webhook_aspect_type" AS ENUM('create', 'update', 'delete');--> statement-breakpoint
CREATE TYPE "public"."webhook_object_type" AS ENUM('activity', 'athlete');--> statement-breakpoint
CREATE TYPE "public"."webhook_status" AS ENUM('pending', 'processed', 'error');--> statement-breakpoint
CREATE TABLE "strava_webhook_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payload" jsonb NOT NULL,
	"strava_athlete_id" bigint,
	"object_type" "webhook_object_type",
	"object_id" bigint,
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
BEGIN
  -- Fetch values from Vault
  webhook_url := public.get_secret('webhook_url');
  -- TODO: To add auth: create webhook_auth_token in Vault, fetch it here, add to Authorization header; validate in process-webhook handler

  -- Validation
  IF webhook_url IS NULL OR webhook_url = '' THEN
    RAISE WARNING 'Webhook skipped: "webhook_url" not found in vault';
    RETURN NEW;
  END IF;

  -- Perform the asynchronous HTTP POST request
  -- Using explicit jsonb for headers to ensure correct serialization
  PERFORM net.http_post(
    url := webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'record', jsonb_build_object(
        'id', NEW.id,
        'payload', NEW.payload,
        'stravaAthleteId', NEW.strava_athlete_id,
        'objectType', NEW.object_type,
        'objectId', NEW.object_id,
        'aspectType', NEW.aspect_type,
        'eventTime', NEW.event_time,
        'status', NEW.status,
        'errorMessage', NEW.error_message,
        'createdAt', NEW.created_at
      )
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