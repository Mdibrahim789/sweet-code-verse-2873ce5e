

# Plan: Exam Countdown UI Improvements

## Changes to `src/components/dashboard/ExamCountdown.tsx`

### 1. Serial numbering
- Add serial numbers (1, 2, 3...) before each exam in the list — both the main exam and the "more upcoming" list

### 2. Date format fix (DD/MM/YYYY)
- Change date display from US format (MM/DD/YYYY) to DD/MM/YYYY format
- Line 142: Change `toLocaleString('en-US', ...)` to `toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })`
- Line 165: Same change for the upcoming exams list dates

### 3. Click to show exam details
- Add a `selectedExam` state to track which exam was clicked
- Make each exam row clickable (cursor-pointer)
- Show a Dialog/modal with full exam details (title, subject, date, location, countdown) when clicked

### 4. Show exam type (title) and subject on the side
- In the exam list, display the exam title on the left and the subject as a Badge on the right side
- Both clickable to open the details modal

### Technical Details
- Single file edit: `src/components/dashboard/ExamCountdown.tsx`
- Add `selectedExam` state (`Exam | null`)
- New `ExamDetailDialog` section showing full details with countdown
- All exams shown with format: `1. Final Exam | Physics — 15/04/2026`

