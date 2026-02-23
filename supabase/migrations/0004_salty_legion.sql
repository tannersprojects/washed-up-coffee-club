DROP INDEX "idx_participant_result";--> statement-breakpoint
ALTER TABLE "challenge_contributions" ADD COLUMN "distance" real;--> statement-breakpoint
ALTER TABLE "challenge_contributions" ADD COLUMN "time" integer;--> statement-breakpoint
ALTER TABLE "challenge_participants" ADD COLUMN "result_distance" real;--> statement-breakpoint
ALTER TABLE "challenge_participants" ADD COLUMN "result_time" integer;--> statement-breakpoint
-- Migrate challenge_participants: result_value -> result_distance (best_effort/cumulative) or result_time (segment_race)
UPDATE "challenge_participants" cp
SET
  "result_distance" = CASE WHEN c.type = 'segment_race' THEN NULL ELSE cp."result_value" END,
  "result_time" = CASE WHEN c.type = 'segment_race' THEN cp."result_value" ELSE NULL END
FROM "challenges" c
WHERE cp."challenge_id" = c.id AND cp."result_value" IS NOT NULL;--> statement-breakpoint

-- Migrate challenge_contributions: value -> distance (best_effort/cumulative) or time (segment_race)
UPDATE "challenge_contributions" cc
SET
  "distance" = CASE WHEN c.type = 'segment_race' THEN NULL ELSE cc."value" END,
  "time" = CASE WHEN c.type = 'segment_race' THEN cc."value" ELSE NULL END
FROM "challenge_participants" cp
JOIN "challenges" c ON cp."challenge_id" = c.id
WHERE cc."participant_id" = cp.id AND cc."value" IS NOT NULL;--> statement-breakpoint

ALTER TABLE "challenge_contributions" DROP COLUMN "value";--> statement-breakpoint
ALTER TABLE "challenge_participants" DROP COLUMN "result_value";--> statement-breakpoint
ALTER TABLE "challenge_participants" DROP COLUMN "result_display";--> statement-breakpoint
CREATE INDEX "idx_participant_result_distance" ON "challenge_participants" USING btree ("challenge_id","result_distance");--> statement-breakpoint
CREATE INDEX "idx_participant_result_time" ON "challenge_participants" USING btree ("challenge_id","result_time");
