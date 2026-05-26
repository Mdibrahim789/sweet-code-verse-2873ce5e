
CREATE TABLE public.academic_terms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  season TEXT NOT NULL CHECK (season IN ('Spring', 'Summer', 'Fall')),
  year INTEGER NOT NULL,
  trimester_number INTEGER NOT NULL CHECK (trimester_number IN (1, 2, 3)),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX academic_terms_one_active_idx
  ON public.academic_terms (is_active)
  WHERE is_active = true;

ALTER TABLE public.academic_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Terms viewable by everyone"
  ON public.academic_terms FOR SELECT
  USING (true);

CREATE POLICY "Academic admins can manage terms"
  ON public.academic_terms FOR ALL
  USING (has_permission(auth.uid(), 'academic'))
  WITH CHECK (has_permission(auth.uid(), 'academic'));

CREATE OR REPLACE FUNCTION public.deactivate_other_terms()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.academic_terms
    SET is_active = false, updated_at = now()
    WHERE id <> NEW.id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_single_active_term
AFTER INSERT OR UPDATE OF is_active ON public.academic_terms
FOR EACH ROW
WHEN (NEW.is_active = true)
EXECUTE FUNCTION public.deactivate_other_terms();

CREATE TRIGGER update_academic_terms_updated_at
BEFORE UPDATE ON public.academic_terms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();
