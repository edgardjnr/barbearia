-- Atualizar a política de criação pública de clientes para ser mais permissiva
DROP POLICY IF EXISTS "Public can create clients with minimal data" ON public.clients;

-- Criar nova política mais simples para criação pública de clientes
CREATE POLICY "Public can create clients for appointments" 
ON public.clients 
FOR INSERT 
WITH CHECK (
  name IS NOT NULL 
  AND organization_id IS NOT NULL 
  AND (email IS NOT NULL OR phone IS NOT NULL)
);

-- Garantir que a tabela clients tem RLS habilitado
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;