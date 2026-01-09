-- Enable RLS on strava_connections table
ALTER TABLE "strava_connections" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on profile table
ALTER TABLE "profile" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only SELECT their own connection record
CREATE POLICY "Users can view their own Strava connection"
ON "strava_connections"
FOR SELECT
USING (auth.uid() = user_id);

-- Note: INSERT and UPDATE operations for strava_connections are handled by the service role
-- during OAuth callback, which bypasses RLS automatically

-- Policy: Users can SELECT their own profile
CREATE POLICY "Users can view their own profile"
ON "profile"
FOR SELECT
USING (auth.uid() = id);

-- Policy: Allow public read access to basic profile info (needed for Leaderboard)
-- Everyone can view profiles
CREATE POLICY "Profiles are viewable by everyone"
ON "profile"
FOR SELECT
USING (true);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON "profile"
FOR UPDATE
USING (auth.uid() = id);