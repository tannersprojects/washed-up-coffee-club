SELECT cp.*, c.*
FROM challenge_participants cp
INNER JOIN challenges c ON cp.challenge_id = c.id
WHERE cp.profile_id = '8f06e271-952e-499c-bf90-9d5fbc93fa1a'
  AND c.is_active = true
  AND c.start_date <= '2026-02-19T14:52:54Z'::timestamptz
  AND c.end_date >= '2026-02-19T14:52:54Z'::timestamptz;