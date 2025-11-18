-- Remove a constraint antiga que referencia auth.users
ALTER TABLE public.appointments 
DROP CONSTRAINT IF EXISTS appointments_employee_id_fkey;