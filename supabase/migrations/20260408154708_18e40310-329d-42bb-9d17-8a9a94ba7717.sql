
CREATE TABLE public.exam_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_name text NOT NULL,
  title text NOT NULL,
  file_url text,
  link_url text,
  description text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.exam_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view suggestions" ON public.exam_suggestions FOR SELECT USING (true);
CREATE POLICY "Admins can manage suggestions" ON public.exam_suggestions FOR ALL USING (has_permission(auth.uid(), 'academic'));

INSERT INTO storage.buckets (id, name, public) VALUES ('exam-suggestions', 'exam-suggestions', true);

CREATE POLICY "Anyone can view exam suggestion files" ON storage.objects FOR SELECT USING (bucket_id = 'exam-suggestions');
CREATE POLICY "Admins can upload exam suggestion files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'exam-suggestions' AND auth.uid() IS NOT NULL);
CREATE POLICY "Admins can delete exam suggestion files" ON storage.objects FOR DELETE USING (bucket_id = 'exam-suggestions' AND auth.uid() IS NOT NULL);
