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
  ('d0c2c0e0-1111-4444-8888-000000000006', 'Ken', 'Block', 'kblock', 'user', 1006)
ON CONFLICT (id) DO NOTHING;

-- 2. Seed The Challenge
-- 'c' is a valid hex character, so this ID works fine.
INSERT INTO challenges (id, title, description, type, goal_value, start_date, end_date, status, is_active)
VALUES (
  'c0000000-0000-0000-0000-000000000001', 
  'The "Sunday Scaries" Half', 
  'Shake off the weekend with a half marathon.',
  'best_effort', 
  21097, -- 21.1 km in meters
  CURRENT_DATE::timestamp with time zone,    -- Today at 00:00:00+00
  (CURRENT_DATE + 1)::timestamp with time zone + TIME '23:59:59', -- Tomorrow at 23:59:59+00
  'active',
  true
)
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Participants (The Scoreboard)
-- FIXED: Changed 'p' to 'a' to ensure valid hexadecimal UUIDs.
INSERT INTO challenge_participants (id, challenge_id, profile_id, status, result_value, result_display)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'd0c2c0e0-1111-4444-8888-000000000001', 'completed', 5325, '1:28:45'),
  ('a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'd0c2c0e0-1111-4444-8888-000000000002', 'completed', 5530, '1:32:10'),
  ('a0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'd0c2c0e0-1111-4444-8888-000000000003', 'completed', 6330, '1:45:30'),
  ('a0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'd0c2c0e0-1111-4444-8888-000000000004', 'in_progress', 15000, 'Mile 9'),
  ('a0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'd0c2c0e0-1111-4444-8888-000000000005', 'in_progress', 5200, 'Mile 3'),
  ('a0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001', 'd0c2c0e0-1111-4444-8888-000000000006', 'did_not_finish', 8000, 'Stopped')
ON CONFLICT (id) DO NOTHING;

-- 4. Seed Contributions (The Evidence)
-- Updated foreign keys to match the new 'a' IDs
INSERT INTO challenge_contributions (id, participant_id, strava_activity_id, activity_name, value, occurred_at)
VALUES
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 99001, 'Morning Half Marathon', 5325, '2026-01-18 07:30:00+00'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', 99002, 'Sunday Long Run', 5530, '2026-01-18 08:00:00+00'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000003', 99003, 'Easy Pace Half', 6330, '2026-01-18 09:15:00+00'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000004', 99004, 'Partial Run', 15000, '2026-01-18 10:00:00+00');