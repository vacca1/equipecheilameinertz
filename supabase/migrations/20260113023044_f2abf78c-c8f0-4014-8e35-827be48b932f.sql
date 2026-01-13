-- Add health_plan_notes column to patients table
ALTER TABLE public.patients 
ADD COLUMN health_plan_notes TEXT;