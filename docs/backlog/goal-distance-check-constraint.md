# Goal Distance CHECK Constraint

## Overview

Add a PostgreSQL CHECK constraint to enforce that `goal_distance` is required (non-null and positive) when the challenge type is CUMULATIVE or BEST_EFFORT. SEGMENT_RACE challenges do not use goal_distance and may keep it null.

## Current State

- `challenges.goal_distance` is nullable (real)
- Application validates goal_distance for CUMULATIVE/BEST_EFFORT in admin +page.server.ts
- No database-level enforcement; invalid data could be inserted via direct SQL or other code paths

## Constraint

```sql
ALTER TABLE challenges ADD CONSTRAINT chk_goal_distance_required
CHECK (
  type = 'segment_race'
  OR (goal_distance IS NOT NULL AND goal_distance > 0)
);
```

**Semantics:**
- **SEGMENT_RACE:** goal_distance may be null (unused)
- **CUMULATIVE / BEST_EFFORT:** goal_distance must be NOT NULL and > 0

## Pre-Migration Check

Before adding the constraint, verify no existing rows violate it:

```sql
SELECT id, type, goal_distance
FROM challenges
WHERE type IN ('cumulative', 'best_effort')
  AND (goal_distance IS NULL OR goal_distance <= 0);
```

If any rows are returned, fix them (set valid goal_distance or adjust type) before applying the constraint.

## Implementation

- Add the constraint in a new Supabase migration (e.g. `0007_*.sql`)
- No Drizzle schema changes (Drizzle does not support conditional CHECK constraints; keep as raw SQL in migration)
- No application code changes required; admin validation already enforces this
