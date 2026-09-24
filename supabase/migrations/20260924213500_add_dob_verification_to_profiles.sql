-- Add dob_status and dob_rejection_reason columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS dob_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS dob_rejection_reason TEXT;

-- Update existing profiles with a DOB to pending if not set
UPDATE public.profiles 
SET dob_status = 'pending' 
WHERE date_of_birth IS NOT NULL AND dob_status IS NULL;
