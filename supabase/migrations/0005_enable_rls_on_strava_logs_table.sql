-- Enable RLS on strava_webhook_logs
ALTER TABLE public.strava_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view webhook logs (for admin dashboard / debugging)
CREATE POLICY "Admins can view webhook logs"
  ON public.strava_webhook_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profile
      WHERE profile.id = auth.uid()
        AND profile.role = 'admin'
    )
  );

-- Admins can delete webhook logs (for cleanup)
CREATE POLICY "Admins can delete webhook logs"
  ON public.strava_webhook_logs
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