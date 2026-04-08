

# Plan: Exam Suggestion Section

## যা করা হবে
প্রতিটি course এর জন্য exam suggestion files (PDF/links) upload ও share করার একটি section তৈরি হবে। Admin/CR রা suggestion যোগ করতে পারবে, students download করতে পারবে।

## Technical Changes

### 1. Database: `exam_suggestions` table (migration)
```sql
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
```

Storage bucket for suggestion PDFs:
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('exam-suggestions', 'exam-suggestions', true);
```
With RLS for upload by admins and public read.

### 2. New hook: `src/hooks/useExamSuggestions.ts`
- `useExamSuggestions()` — fetch all suggestions, grouped by course
- `useAddExamSuggestion()` — add new suggestion (file upload + link)
- `useDeleteExamSuggestion()` — delete suggestion

### 3. Academic Section এ নতুন "Exam Suggestions" sub-section যোগ করা
- AcademicSection এ Courses ও Resources এর পরে "Exam Suggestions" section থাকবে
- Course-wise grouped cards — প্রতিটি course এর নিচে suggestion list
- প্রতিটি suggestion এ: title, description, download button (PDF) বা external link button
- Admin/CR: "Add Suggestion" form — course select, title, description, file upload বা link input
- EditModeToggle দিয়ে admin form toggle হবে (existing pattern follow)

### 4. Design
- Course name header সহ grouped layout
- File icon + title + download/link button per item
- PDF upload: Supabase storage bucket এ upload হবে, public URL generate হবে
- Clean card-based design matching existing AcademicSection style

