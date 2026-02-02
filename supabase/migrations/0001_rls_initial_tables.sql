-- =============================================================================
-- Row Level Security (RLS) Policies
-- =============================================================================

-- ─── strava_connections ─────────────────────────────────────────────────────
ALTER TABLE "strava_connections" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own Strava connection"
  ON "strava_connections"
  FOR SELECT
  USING ((select auth.uid()) = profile_id);

-- INSERT/UPDATE for strava_connections are handled by the service role during
-- OAuth callback, which bypasses RLS.

-- ─── profile ────────────────────────────────────────────────────────────────
ALTER TABLE "profile" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON "profile"
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON "profile"
  FOR UPDATE
  USING ((select auth.uid()) = id);

-- ─── challenges ─────────────────────────────────────────────────────────────
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users"
  ON challenges
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for admins only"
  ON challenges
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profile
      WHERE profile.id = (select auth.uid())
        AND profile.role = 'admin'
    )
  );

CREATE POLICY "Enable update for admins only"
  ON challenges
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profile
      WHERE profile.id = (select auth.uid())
        AND profile.role = 'admin'
    )
  );

CREATE POLICY "Enable delete for admins only"
  ON challenges
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profile
      WHERE profile.id = (select auth.uid())
        AND profile.role = 'admin'
    )
  );

-- ─── memories ───────────────────────────────────────────────────────────────
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all (landing page)"
  ON memories
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for admins only"
  ON memories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profile
      WHERE profile.id = (select auth.uid())
        AND profile.role = 'admin'
    )
  );

CREATE POLICY "Enable update for admins only"
  ON memories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profile
      WHERE profile.id = (select auth.uid())
        AND profile.role = 'admin'
    )
  );

CREATE POLICY "Enable delete for admins only"
  ON memories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profile
      WHERE profile.id = (select auth.uid())
        AND profile.role = 'admin'
    )
  );

-- ─── routine_schedules ─────────────────────────────────────────────────────
ALTER TABLE routine_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all (landing page)"
  ON routine_schedules
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for admins only"
  ON routine_schedules
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profile
      WHERE profile.id = (select auth.uid())
        AND profile.role = 'admin'
    )
  );

CREATE POLICY "Enable update for admins only"
  ON routine_schedules
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profile
      WHERE profile.id = (select auth.uid())
        AND profile.role = 'admin'
    )
  );

CREATE POLICY "Enable delete for admins only"
  ON routine_schedules
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profile
      WHERE profile.id = (select auth.uid())
        AND profile.role = 'admin'
    )
  );

-- ─── challenge_participants ─────────────────────────────────────────────────
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users"
  ON challenge_participants
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated (join challenge)"
  ON challenge_participants
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = profile_id);

CREATE POLICY "Enable update for self or admin"
  ON challenge_participants
  FOR UPDATE
  TO authenticated
  USING (
    (select auth.uid()) = profile_id
    OR EXISTS (
      SELECT 1
      FROM profile
      WHERE profile.id = (select auth.uid())
        AND profile.role = 'admin'
    )
  );

CREATE POLICY "Enable delete for self or admin"
  ON challenge_participants
  FOR DELETE
  TO authenticated
  USING (
    (select auth.uid()) = profile_id
    OR EXISTS (
      SELECT 1
      FROM profile
      WHERE profile.id = (select auth.uid())
        AND profile.role = 'admin'
    )
  );

-- ─── challenge_contributions ────────────────────────────────────────────────
ALTER TABLE challenge_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users"
  ON challenge_contributions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for admins only"
  ON challenge_contributions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profile
      WHERE profile.id = (select auth.uid())
        AND profile.role = 'admin'
    )
  );

CREATE POLICY "Enable update for admins only"
  ON challenge_contributions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profile
      WHERE profile.id = (select auth.uid())
        AND profile.role = 'admin'
    )
  );

CREATE POLICY "Enable delete for admins only"
  ON challenge_contributions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profile
      WHERE profile.id = (select auth.uid())
        AND profile.role = 'admin'
    )
  );
