ALTER TABLE "challenge_participants" RENAME COLUMN "result_moving_time_total" TO "result_moving_time_seconds";--> statement-breakpoint
DROP INDEX "idx_contribution_unique";--> statement-breakpoint
ALTER TABLE "challenge_participants" ADD COLUMN "result_elapsed_time_seconds" integer;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_contribution_participant_activity" ON "challenge_contributions" USING btree ("participant_id","strava_activity_id");