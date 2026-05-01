-- Seed initial memories (Storage URLs for local dev - matches production pattern)
TRUNCATE memories RESTART IDENTITY CASCADE;
INSERT INTO memories (src, caption, sort_order, is_active) VALUES
('http://127.0.0.1:54321/storage/v1/object/public/memories/running1.jpg', 'Insert Description Here', 1, true),
('http://127.0.0.1:54321/storage/v1/object/public/memories/running2.jpg', 'Insert Description Here', 2, true),
('http://127.0.0.1:54321/storage/v1/object/public/memories/running3.jpg', 'Insert Description Here', 3, true),
('http://127.0.0.1:54321/storage/v1/object/public/memories/running4.jpg', 'Insert Description Here', 4, true),
('http://127.0.0.1:54321/storage/v1/object/public/memories/running5.jpg', 'Insert Description Here', 5, true),
('http://127.0.0.1:54321/storage/v1/object/public/memories/running6.jpg', 'Insert Description Here', 6, true),
('http://127.0.0.1:54321/storage/v1/object/public/memories/running7.jpg', 'Insert Description Here', 7, true),
('http://127.0.0.1:54321/storage/v1/object/public/memories/running8.jpg', 'Insert Description Here', 8, true),
('http://127.0.0.1:54321/storage/v1/object/public/memories/running9.jpg', 'Insert Description Here', 9, true);

-- Seed initial routine schedules
INSERT INTO routine_schedules (day, time, location, accent_color, description, sort_order, is_active) VALUES
('Tuesday', '05:00 AM', 'Hampton Park - Moultrie Lot', 'var(--frosted-blue)', 'Tuesday Speed', 1, true),
('Thursday', '05:00 AM', 'Grace Bridge Street', 'var(--accent-lime)', 'Bridge Run', 2, true),
('Saturday', '06:00 AM', 'Sullivan''s Island - Station 30', 'var(--frosted-blue)', 'Run. Dip. Sip.', 3, true);


-- 1. Seed Profiles (Mock Runners)
INSERT INTO profile (id, firstname, lastname, username, role, strava_athlete_id)
VALUES 
  ('d0c2c0e0-1111-4444-8888-000000000001', 'Sarah', 'Jenkins', 'sjenkins', 'user', 1001),
  ('d0c2c0e0-1111-4444-8888-000000000002', 'Marcus', 'Dill', 'mdill', 'user', 1002),
  ('d0c2c0e0-1111-4444-8888-000000000003', 'Emily', 'Voss', 'evoss', 'user', 1003),
  ('d0c2c0e0-1111-4444-8888-000000000004', 'Tyler', 'Durden', 'tdurden', 'user', 1004),
  ('d0c2c0e0-1111-4444-8888-000000000005', 'Jessica', 'Alba', 'jalba', 'user', 1005),
  ('d0c2c0e0-1111-4444-8888-000000000006', 'Ken', 'Block', 'kblock', 'user', 1006),
  ('d0c2c0e0-1111-4444-8888-000000000007', 'Alex', 'Newbie', 'anewbie', 'user', 1007)
ON CONFLICT (id) DO NOTHING;

-- 2. Seed The Challenge
-- 'c' is a valid hex character, so this ID works fine.
INSERT INTO challenges (
  id,
  title,
  description,
  type,
  ranking_metric,
  goal_distance,
  start_date,
  end_date,
  status,
  is_active
)
VALUES (
  'c0000000-0000-0000-0000-000000000001', 
  'The "Sunday Scaries" Half', 
  'Shake off the weekend with a half marathon.',
  'cumulative', 
  'standard_half_marathon',
  21083, -- 13.1 miles converted to meters (rounded)
  CURRENT_DATE::timestamp with time zone,    -- Today at 00:00:00+00
  (CURRENT_DATE + 1)::timestamp with time zone + TIME '23:59:59', -- Tomorrow at 23:59:59+00
  'active',
  true
)
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Participants (The Scoreboard)
-- cumulative challenge: result_distance in meters, result_moving_time_seconds/result_elapsed_time_seconds/ranking_value_seconds in seconds
-- highlight_activity_id points at the contribution that "represents" this participant on the leaderboard.
INSERT INTO challenge_participants (
  id,
  challenge_id,
  profile_id,
  status,
  result_distance,
  result_moving_time_seconds,
  result_elapsed_time_seconds,
  ranking_value_seconds,
  ranking_computed_at,
  highlight_activity_id
)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'd0c2c0e0-1111-4444-8888-000000000001', 'completed',      21197, 5700, 5700, 5700, NOW(), 99001),  -- 1:35:00
  ('a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'd0c2c0e0-1111-4444-8888-000000000002', 'completed',      21197, 6120, 6120, 6120, NOW(), 99002),  -- 1:42:00
  ('a0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'd0c2c0e0-1111-4444-8888-000000000003', 'completed',      21197, 6480, 6480, 6480, NOW(), 99003),  -- 1:48:00
  ('a0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'd0c2c0e0-1111-4444-8888-000000000004', 'in_progress',    15000, NULL, NULL, NULL, NULL,   99004),
  ('a0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'd0c2c0e0-1111-4444-8888-000000000005', 'in_progress',    5200,  NULL, NULL, NULL, NULL,   NULL),
  ('a0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001', 'd0c2c0e0-1111-4444-8888-000000000006', 'did_not_finish', 8000,  NULL, NULL, NULL, NULL,   NULL),
  ('a0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000001', 'd0c2c0e0-1111-4444-8888-000000000007', 'registered',     NULL,  NULL, NULL, NULL, NULL,   NULL)
ON CONFLICT (id) DO NOTHING;

-- 4. Seed Contributions (The Evidence)
-- cumulative: distance in meters, moving_time/elapsed_time in seconds
INSERT INTO challenge_contributions (
  id,
  participant_id,
  strava_activity_id,
  activity_name,
  distance,
  moving_time,
  elapsed_time,
  occurred_at
)
VALUES
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 99001, 'Morning Half Marathon', 21197, 5700, 5700, '2026-01-18 07:30:00+00'),  -- 1:35:00
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', 99002, 'Sunday Long Run',       21197, 6120, 6120, '2026-01-18 08:00:00+00'),  -- 1:42:00
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000003', 99003, 'Easy Pace Half',        21197, 6480, 6480, '2026-01-18 09:15:00+00'),  -- 1:48:00
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000004', 99004, 'Partial Run',           15000, NULL, NULL, '2026-01-18 10:00:00+00');

-- 5. Seed The 400m Best Effort Challenge
INSERT INTO challenges (
  id,
  title,
  description,
  type,
  ranking_metric,
  goal_distance,
  start_date,
  end_date,
  status,
  is_active
)
VALUES (
  'c0000000-0000-0000-0000-000000000002',
  'Quarter-Mile Burner',
  'Rip your fastest 400m anywhere, any workout. Best time on the clock wins.',
  'best_effort',
  'standard_400m',
  400, -- Each completed effort contributes one 400m to the club total-distance stat
  CURRENT_DATE::timestamp with time zone,
  (CURRENT_DATE + 7)::timestamp with time zone + TIME '23:59:59',
  'active',
  true
)
ON CONFLICT (id) DO NOTHING;

-- 6. Seed 400m Participants
-- best_effort + standard_400m: ranking_value_seconds holds the best 400m split in seconds.
-- result_distance/result_moving_time_seconds describe the full workout the effort came from.
INSERT INTO challenge_participants (
  id,
  challenge_id,
  profile_id,
  status,
  result_distance,
  result_moving_time_seconds,
  result_elapsed_time_seconds,
  ranking_value_seconds,
  ranking_computed_at,
  highlight_activity_id
)
VALUES
  ('a0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000002', 'd0c2c0e0-1111-4444-8888-000000000001', 'completed',      6400, 1800, 1800, 68,   NOW(), 99011), -- 1:08
  ('a0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000002', 'd0c2c0e0-1111-4444-8888-000000000002', 'completed',      6400, 1860, 1860, 72,   NOW(), 99012), -- 1:12
  ('a0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000002', 'd0c2c0e0-1111-4444-8888-000000000003', 'completed',      6400, 1920, 1920, 76,   NOW(), 99013), -- 1:16
  ('a0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000000002', 'd0c2c0e0-1111-4444-8888-000000000004', 'in_progress',    3200, NULL, NULL, NULL, NULL,   99014),
  ('a0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000000002', 'd0c2c0e0-1111-4444-8888-000000000005', 'in_progress',    2000, NULL, NULL, NULL, NULL,   NULL),
  ('a0000000-0000-0000-0000-000000000016', 'c0000000-0000-0000-0000-000000000002', 'd0c2c0e0-1111-4444-8888-000000000006', 'did_not_finish', 4000, NULL, NULL, NULL, NULL,   NULL),
  ('a0000000-0000-0000-0000-000000000017', 'c0000000-0000-0000-0000-000000000002', 'd0c2c0e0-1111-4444-8888-000000000007', 'registered',     NULL, NULL, NULL, NULL, NULL,   NULL)
ON CONFLICT (id) DO NOTHING;

-- 7. Seed 400m Contributions (highlight workouts containing the fast splits)
INSERT INTO challenge_contributions (
  id,
  participant_id,
  strava_activity_id,
  activity_name,
  distance,
  moving_time,
  elapsed_time,
  occurred_at
)
VALUES
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000011', 99011, 'Track Tuesday - 400m Repeats', 6400, 1800, 1800, '2026-01-20 06:00:00+00'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000012', 99012, 'Speedwork Session',            6400, 1860, 1860, '2026-01-20 06:15:00+00'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000013', 99013, 'Intervals at Hampton Park',    6400, 1920, 1920, '2026-01-20 06:30:00+00'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000014', 99014, 'Warmup + 400s',                3200, NULL, NULL, '2026-01-21 06:00:00+00');

-- 8. Isolated test profile for the dev test-create-activity endpoint.
-- Quinn Miles is enrolled ONLY in the Quarter-Mile Burner challenge so that
-- processCreateActivity's profile+date fan-out naturally isolates to a single pair.
INSERT INTO profile (id, firstname, lastname, username, role, strava_athlete_id)
VALUES
  ('d0c2c0e0-1111-4444-8888-000000000008', 'Quinn', 'Miles', 'qmiles', 'user', 1008)
ON CONFLICT (id) DO NOTHING;

INSERT INTO challenge_participants (
  id,
  challenge_id,
  profile_id,
  status,
  result_distance,
  result_moving_time_seconds,
  result_elapsed_time_seconds,
  ranking_value_seconds,
  ranking_computed_at,
  highlight_activity_id
)
VALUES
  ('a0000000-0000-0000-0000-000000000018', 'c0000000-0000-0000-0000-000000000002', 'd0c2c0e0-1111-4444-8888-000000000008', 'registered', NULL, NULL, NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- 9. Webhook Vault Secrets (local dev)
-- Uses vault.create_secret() to properly encrypt secrets at rest.
-- Delete existing entries first since vault secret names must be unique.
DELETE FROM vault.secrets WHERE name IN ('webhook_url');
SELECT vault.create_secret(
  'https://fb2a-2600-382-b9f8-3387-5190-ae7b-125f-2766.ngrok-free.app/api/strava/process-webhook',
  'webhook_url',
  'Edge Function URL for the DB webhook trigger'
);

-- TODO: Add custom JWT for Edge Function auth
