-- Add three new columns to appointments table
ALTER TABLE public.appointments 
ADD COLUMN establishment_name text,
ADD COLUMN instance text, 
ADD COLUMN base text;