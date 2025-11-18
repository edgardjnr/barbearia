-- Corrigir politicas RLS para agendamento público

-- Primeiro, verificar a política atual de clientes
DROP POLICY IF EXISTS "Public can create clients for booking" ON public.clients;

-- Criar nova política mais específica para clientes
CREATE POLICY "Public can create clients for booking" 
ON public.clients 
FOR INSERT 
WITH CHECK (true);

-- Verificar se existe política para appointments e recriá-la se necessário
DROP POLICY IF EXISTS "Public can create appointments for booking" ON public.appointments;

-- Recriar política para appointments
CREATE POLICY "Public can create appointments for booking" 
ON public.appointments 
FOR INSERT 
WITH CHECK (true);