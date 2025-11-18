-- Add company phone column to appointments table
ALTER TABLE public.appointments 
ADD COLUMN company_phone text;