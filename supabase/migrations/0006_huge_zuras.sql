ALTER TABLE "challenges" RENAME COLUMN "goal_value" TO "goal_distance";
ALTER TABLE "challenges" ALTER COLUMN "goal_distance" TYPE real USING goal_distance::real;