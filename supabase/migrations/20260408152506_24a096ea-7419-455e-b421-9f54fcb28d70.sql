CREATE TABLE public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  exam_date timestamptz NOT NULL,
  subject text,
  location text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Exams viewable by everyone" ON public.exams FOR SELECT USING (true);

CREATE POLICY "Admins can manage exams" ON public.exams FOR ALL USING (has_permission(auth.uid(), 'academic'));