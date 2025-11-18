-- PADRONIZAR TODAS AS REFERÊNCIAS PARA USER_ID

-- 1. Renomear member_id para user_id na tabela working_hours
ALTER TABLE public.working_hours RENAME COLUMN member_id TO user_id;

-- 2. Renomear member_id para user_id na tabela member_services  
ALTER TABLE public.member_services RENAME COLUMN member_id TO user_id;

-- 3. Renomear employee_id para user_id nas tabelas
ALTER TABLE public.appointments RENAME COLUMN employee_id TO user_id;
ALTER TABLE public.reviews RENAME COLUMN employee_id TO user_id;
ALTER TABLE public.service_history RENAME COLUMN employee_id TO user_id;