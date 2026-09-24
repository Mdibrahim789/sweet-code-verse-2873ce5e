-- Add academic_results, results_last_synced, and cgpa columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS academic_results JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS results_last_synced TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cgpa NUMERIC(4,2);
