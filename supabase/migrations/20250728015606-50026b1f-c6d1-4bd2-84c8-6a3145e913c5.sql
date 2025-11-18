-- Remover políticas problemáticas e criar versões mais simples
DROP POLICY IF EXISTS "Public can create clients for booking" ON public.clients;
DROP POLICY IF EXISTS "Public can create appointments for booking" ON public.appointments;

-- Política simples para clientes (apenas exige organization_id)
CREATE POLICY "Public can create clients for booking" 
ON public.clients 
FOR INSERT 
TO public
WITH CHECK (organization_id IS NOT NULL);

-- Política simples para agendamentos 
CREATE POLICY "Public can create appointments for booking" 
ON public.appointments 
FOR INSERT 
TO public
WITH CHECK (organization_id IS NOT NULL);