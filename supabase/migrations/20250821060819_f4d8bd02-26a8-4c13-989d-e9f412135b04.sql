-- Remover políticas restritivas adicionais necessárias para agendamento público
DROP POLICY IF EXISTS "No public access to organization member data" ON public.organization_members;
DROP POLICY IF EXISTS "No public access to services data" ON public.services;  
DROP POLICY IF EXISTS "No public access to working hours data" ON public.working_hours;