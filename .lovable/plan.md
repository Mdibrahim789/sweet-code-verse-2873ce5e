
# Plan: Subject Name কে বেশি Highlight করা

Exam countdown এ subject name কে exam title এর চেয়ে বেশি prominent করতে হবে।

## Changes to `src/components/dashboard/ExamCountdown.tsx`

### 1. Main exam (line 141-146)
- Title (`nextExam.title`): font size ছোট করা, lighter weight — `text-sm font-medium text-muted-foreground`
- Subject badge: বড় করা, bold, primary color — `text-sm font-bold bg-primary/10 text-primary border-primary/30`

### 2. Upcoming exam list (line 170-175)
- Title (`exam.title`): lighter — `text-muted-foreground text-xs`
- Subject badge: bolder, bigger — `text-xs font-bold bg-primary/10 text-primary border-primary/30`

### Technical Details
- Single file edit: `src/components/dashboard/ExamCountdown.tsx`
- 4 lines changed across 2 sections
