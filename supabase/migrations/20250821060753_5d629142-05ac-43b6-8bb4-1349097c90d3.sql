-- Remover políticas restritivas que bloqueiam acesso público a dados necessários para agendamento
DROP POLICY IF EXISTS "No public access to member services data" ON public.member_services;
DROP POLICY IF EXISTS "No public access to schedule blocks data" ON public.member_schedule_blocks;