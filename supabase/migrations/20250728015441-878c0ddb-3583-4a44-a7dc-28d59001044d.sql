-- Remover políticas públicas problemáticas e recriar corretamente
DROP POLICY IF EXISTS "Public can create clients for booking" ON public.clients;
DROP POLICY IF EXISTS "Public can create appointments for booking" ON public.appointments;

-- Criar política para clientes permitindo inserção pública apenas com organization_id válido
CREATE POLICY "Public can create clients for booking" 
ON public.clients 
FOR INSERT 
WITH CHECK (
  organization_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.organizations 
    WHERE id = organization_id
  )
);

-- Criar política para agendamentos permitindo inserção pública apenas com dados válidos
CREATE POLICY "Public can create appointments for booking" 
ON public.appointments 
FOR INSERT 
WITH CHECK (
  organization_id IS NOT NULL 
  AND client_id IS NOT NULL 
  AND service_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.organizations 
    WHERE id = organization_id
  )
);