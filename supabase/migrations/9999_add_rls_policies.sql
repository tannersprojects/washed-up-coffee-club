-- Enable RLS on strava_connections table
ALTER TABLE "strava_connections" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on profile table
ALTER TABLE "profile" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only SELECT their own connection record
CREATE POLICY "Users can view their own Strava connection"
ON "strava_connections"
FOR SELECT
USING (auth.uid() = profile_id);

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

-- 1. Enable RLS on the table (Essential step)
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- 2. Create the Policy: "Anyone can VIEW challenges"
-- This allows all logged-in users to see the challenges on the dashboard.
CREATE POLICY "Enable read access for authenticated users"
ON challenges
FOR SELECT
TO authenticated
USING (true);

-- 3. Create the Policy: "Only Admins can INSERT challenges"
-- This checks the 'profile' table to see if the current user has the 'admin' role.
CREATE POLICY "Enable insert for admins only"
ON challenges
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM profile
    WHERE profile.id = auth.uid() 
    AND profile.role = 'admin'
  )
);

-- 4. Create the Policy: "Only Admins can UPDATE challenges"
CREATE POLICY "Enable update for admins only"
ON challenges
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM profile
    WHERE profile.id = auth.uid() 
    AND profile.role = 'admin'
  )
);

-- 5. Create the Policy: "Only Admins can DELETE challenges"
CREATE POLICY "Enable delete for admins only"
ON challenges
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM profile
    WHERE profile.id = auth.uid() 
    AND profile.role = 'admin'
  )
);
