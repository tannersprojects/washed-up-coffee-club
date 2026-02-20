DROP INDEX "idx_participant_result";--> statement-breakpoint
ALTER TABLE "challenge_contributions" ADD COLUMN "distance" real;--> statement-breakpoint
ALTER TABLE "challenge_contributions" ADD COLUMN "time" integer;--> statement-breakpoint
ALTER TABLE "challenge_participants" ADD COLUMN "result_distance" real;--> statement-breakpoint
ALTER TABLE "challenge_participants" ADD COLUMN "result_time" integer;--> statement-breakpoint
CREATE INDEX "idx_participant_result_distance" ON "challenge_participants" USING btree ("challenge_id","result_distance");--> statement-breakpoint
CREATE INDEX "idx_participant_result_time" ON "challenge_participants" USING btree ("challenge_id","result_time");--> statement-breakpoint
ALTER TABLE "challenge_contributions" DROP COLUMN "value";--> statement-breakpoint
ALTER TABLE "challenge_participants" DROP COLUMN "result_value";--> statement-breakpoint
ALTER TABLE "challenge_participants" DROP COLUMN "result_display";

-- -- challenge_participants: Add result_distance, result_time; migrate data; drop result_value, result_display
-- ALTER TABLE "challenge_participants"
--   ADD COLUMN "result_distance" integer,
--   ADD COLUMN "result_time" integer;

-- -- Migrate existing result_value: segment_race -> result_time, others -> result_distance
-- UPDATE "challenge_participants" cp
-- SET
--   "result_distance" = CASE WHEN c.type = 'segment_race' THEN NULL ELSE cp."result_value" END,
--   "result_time" = CASE WHEN c.type = 'segment_race' THEN cp."result_value" ELSE NULL END
-- FROM "challenges" c
-- WHERE cp."challenge_id" = c.id AND cp."result_value" IS NOT NULL;

-- -- Drop old columns and index
-- DROP INDEX IF EXISTS "idx_participant_result";
-- ALTER TABLE "challenge_participants"
--   DROP COLUMN "result_value",
--   DROP COLUMN "result_display";

-- -- New indexes for sorting
-- CREATE INDEX "idx_participant_result_distance" ON "challenge_participants" USING btree ("challenge_id", "result_distance" DESC NULLS LAST);
-- CREATE INDEX "idx_participant_result_time" ON "challenge_participants" USING btree ("challenge_id", "result_time" ASC NULLS LAST);

-- -- challenge_contributions: Add value_distance, value_time; migrate data; drop value
-- ALTER TABLE "challenge_contributions"
--   ADD COLUMN "value_distance" integer,
--   ADD COLUMN "value_time" integer;

-- -- Migrate existing value: segment_race -> value_time, others -> value_distance
-- UPDATE "challenge_contributions" cc
-- SET
--   "value_distance" = CASE WHEN c.type = 'segment_race' THEN NULL ELSE cc."value" END,
--   "value_time" = CASE WHEN c.type = 'segment_race' THEN cc."value" ELSE NULL END
-- FROM "challenge_participants" cp
-- JOIN "challenges" c ON cp."challenge_id" = c.id
-- WHERE cc."participant_id" = cp.id AND cc."value" IS NOT NULL;

-- ALTER TABLE "challenge_contributions" DROP COLUMN "value";