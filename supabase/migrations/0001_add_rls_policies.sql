-- Enable RLS on strava_connections table
ALTER TABLE "strava_connections" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only SELECT their own connection record
CREATE POLICY "Users can view their own Strava connection"
ON "strava_connections"
FOR SELECT
USING (auth.uid() = user_id);

-- Note: INSERT and UPDATE operations are handled by the service role
-- during OAuth callback, which bypasses RLS automatically

