CREATE TYPE "public"."challenge_ranking_metric" AS ENUM('none', 'activity_total', 'standard_400m', 'standard_800m', 'standard_1k', 'standard_1_mile', 'standard_2_mile', 'standard_5k', 'standard_10k', 'standard_15k', 'standard_10_mile', 'standard_20k', 'standard_half_marathon', 'standard_30k', 'standard_marathon', 'standard_50k');--> statement-breakpoint
DROP INDEX "idx_participant_result_time";--> statement-breakpoint
ALTER TABLE "challenge_contributions" ADD COLUMN "moving_time" integer;--> statement-breakpoint
ALTER TABLE "challenge_contributions" ADD COLUMN "elapsed_time" integer;--> statement-breakpoint
ALTER TABLE "challenge_contributions" ADD COLUMN "best_efforts" jsonb;--> statement-breakpoint
ALTER TABLE "challenge_contributions" ADD COLUMN "splits_metric" jsonb;--> statement-breakpoint
ALTER TABLE "challenge_contributions" ADD COLUMN "splits_standard" jsonb;--> statement-breakpoint
ALTER TABLE "challenge_contributions" ADD COLUMN "laps" jsonb;--> statement-breakpoint
ALTER TABLE "challenge_contributions" ADD COLUMN "activity_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "challenge_participants" ADD COLUMN "result_moving_time_total" integer;--> statement-breakpoint
ALTER TABLE "challenge_participants" ADD COLUMN "ranking_value_seconds" integer;--> statement-breakpoint
ALTER TABLE "challenge_participants" ADD COLUMN "ranking_computed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "challenges" ADD COLUMN "ranking_metric" "challenge_ranking_metric" DEFAULT 'none' NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_participant_ranking_value" ON "challenge_participants" USING btree ("challenge_id","ranking_value_seconds");--> statement-breakpoint
ALTER TABLE "challenge_contributions" DROP COLUMN "time";--> statement-breakpoint
ALTER TABLE "challenge_participants" DROP COLUMN "result_time";