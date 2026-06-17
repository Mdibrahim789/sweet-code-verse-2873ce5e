CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_a text NOT NULL,
  team_b text NOT NULL,
  team_a_flag text,
  team_b_flag text,
  match_time timestamptz NOT NULL,
  stage text,
  status text NOT NULL DEFAULT 'scheduled',
  score_a int,
  score_b int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.matches TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matches TO authenticated;
GRANT ALL ON public.matches TO service_role;

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view matches"
  ON public.matches FOR SELECT
  USING (true);

CREATE POLICY "Master can insert matches"
  ON public.matches FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'master'));

CREATE POLICY "Master can update matches"
  ON public.matches FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'master'))
  WITH CHECK (public.has_role(auth.uid(), 'master'));

CREATE POLICY "Master can delete matches"
  ON public.matches FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'master'));

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;