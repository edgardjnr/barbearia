-- Corrigir política RLS para permitir criação de organizações
-- Primeiro, vamos remover a política existente e criar uma nova mais permissiva

DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;

-- Criar nova política para inserção que permite usuários autenticados criarem organizações
CREATE POLICY "Authenticated users can create organizations"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- Verificar se a política de visualização está correta
DROP POLICY IF EXISTS "Members can view their organization" ON public.organizations;

CREATE POLICY "Members can view their organization"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid() OR
  id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- Verificar se a política de atualização está correta
DROP POLICY IF EXISTS "Owners can update their organization" ON public.organizations;

CREATE POLICY "Owners can update their organization"
ON public.organizations
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());