-- Análise das tabelas que precisam ser alteradas de user_id para member_id
-- Tabelas que devem MANTER user_id (referenciam auth.users):
-- - organization_members (correto - referencia usuário autenticado)
-- - profiles (correto - referencia usuário autenticado) 
-- - user_roles (correto - referencia usuário autenticado)

-- Tabelas que devem ALTERAR user_id para member_id (referenciam organization_members):
-- - appointments
-- - member_services  
-- - reviews
-- - service_history
-- - working_hours

-- 1. Alterar tabela appointments
ALTER TABLE public.appointments 
RENAME COLUMN user_id TO member_id;

-- 2. Alterar tabela member_services  
ALTER TABLE public.member_services 
RENAME COLUMN user_id TO member_id;

-- 3. Alterar tabela reviews
ALTER TABLE public.reviews 
RENAME COLUMN user_id TO member_id;

-- 4. Alterar tabela service_history
ALTER TABLE public.service_history 
RENAME COLUMN user_id TO member_id;

-- 5. Alterar tabela working_hours
ALTER TABLE public.working_hours 
RENAME COLUMN user_id TO member_id;

-- Adicionar foreign keys para referenciar organization_members.id
ALTER TABLE public.appointments 
ADD CONSTRAINT fk_appointments_member 
FOREIGN KEY (member_id) REFERENCES public.organization_members(id) ON DELETE SET NULL;

ALTER TABLE public.member_services 
ADD CONSTRAINT fk_member_services_member 
FOREIGN KEY (member_id) REFERENCES public.organization_members(id) ON DELETE CASCADE;

ALTER TABLE public.reviews 
ADD CONSTRAINT fk_reviews_member 
FOREIGN KEY (member_id) REFERENCES public.organization_members(id) ON DELETE SET NULL;

ALTER TABLE public.service_history 
ADD CONSTRAINT fk_service_history_member 
FOREIGN KEY (member_id) REFERENCES public.organization_members(id) ON DELETE SET NULL;

ALTER TABLE public.working_hours 
ADD CONSTRAINT fk_working_hours_member 
FOREIGN KEY (member_id) REFERENCES public.organization_members(id) ON DELETE CASCADE;