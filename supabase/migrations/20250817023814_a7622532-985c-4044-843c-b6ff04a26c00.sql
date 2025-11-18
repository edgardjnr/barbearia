-- Corrigir vulnerabilidades de segurança: Remover acesso público a dados operacionais sensíveis

-- 1. BUSINESS OPERATIONS DATA - Remover acesso público a dados de operações comerciais
-- Remover políticas que expõem padrões de negócio e dados operacionais
DROP POLICY IF EXISTS "Public can view basic appointment availability" ON public.appointments;
DROP POLICY IF EXISTS "Allow public read access to reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public can view active services for booking" ON public.services;

-- 2. EMPLOYEE SCHEDULE INFORMATION - Remover acesso público a informações de horários dos funcionários  
-- Horários de trabalho e bloqueios de agenda são dados internos sensíveis
DROP POLICY IF EXISTS "Public can view working hours for booking" ON public.working_hours;
DROP POLICY IF EXISTS "Public can view schedule blocks for availability" ON public.member_schedule_blocks;

-- 3. CUSTOMER APPOINTMENT PATTERNS - Bloquear acesso público a padrões de agendamento
-- Criar políticas restritivas para proteger dados de agendamentos
CREATE POLICY "No public access to appointment data" 
ON public.appointments 
FOR SELECT 
USING (false);

CREATE POLICY "No public access to working hours data" 
ON public.working_hours 
FOR SELECT 
USING (false);

CREATE POLICY "No public access to schedule blocks data" 
ON public.member_schedule_blocks 
FOR SELECT 
USING (false);

CREATE POLICY "No public access to services data" 
ON public.services 
FOR SELECT 
USING (false);

CREATE POLICY "No public access to reviews data" 
ON public.reviews 
FOR SELECT 
USING (false);

-- Funcionalidades públicas continuarão funcionando através das funções seguras existentes:
-- 1. get_organizations_for_booking() - lista organizações disponíveis
-- 2. get_profiles_for_booking(org_id) - lista profissionais (apenas ID e nome)
-- 3. get_public_organization_info(org_id) - informações básicas da organização

-- Funcionalidades internas mantidas:
-- - Membros da organização continuam com acesso completo
-- - Master users mantêm acesso total  
-- - Managers podem gerenciar dados
-- - Sistema de agendamento interno permanece funcional