

# Plan: Exam Countdown Timer

## যা করা হবে
Dashboard এর Home page এ পরবর্তী exam এর countdown timer দেখাবে — দিন, ঘণ্টা, মিনিট, সেকেন্ড সহ real-time countdown। Admin/CR রা exam যোগ/মুছতে পারবে।

## Technical Changes

### 1. Database: `exams` table তৈরি করা (migration)
```sql
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
-- Everyone can view
CREATE POLICY "Exams viewable by everyone" ON public.exams FOR SELECT USING (true);
-- Admins can manage
CREATE POLICY "Admins can manage exams" ON public.exams FOR ALL USING (has_permission(auth.uid(), 'academic'));
```

### 2. নতুন hook: `src/hooks/useExams.ts`
- `useExams()` — সব upcoming exams fetch করবে (date > now), sorted by date ascending
- `useAddExam()` — নতুন exam যোগ করা
- `useDeleteExam()` — exam মুছে ফেলা

### 3. নতুন component: `ExamCountdown` (HomeSection এর ভিতরে)
- পরবর্তী exam (earliest upcoming) এর countdown দেখাবে
- `useState` + `setInterval` (1 সেকেন্ড) দিয়ে real-time countdown
- দিন | ঘণ্টা | মিনিট | সেকেন্ড — 4টি box এ দেখাবে
- Exam title ও subject দেখাবে
- Exam শেষ হলে পরের exam এ switch হবে
- কোনো exam না থাকলে "No upcoming exams" message

### 4. HomeSection এ integrate করা
- Latest Notice এর পরে, Bus Schedule এর আগে countdown card বসবে
- Admin দের জন্য "Add Exam" button ও form থাকবে
- Design: gradient card, bold countdown numbers, pulse animation on urgency (< 24 hours)

## Design
- Card with exam icon (📝), title, subject
- 4 boxes: Days | Hours | Minutes | Seconds — bold monospace numbers
- < 24 hours হলে red/urgent color scheme
- Admin: simple form — title, subject, date/time, location

