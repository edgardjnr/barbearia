-- Tornar organization_id opcional na tabela chats
ALTER TABLE public.chats ALTER COLUMN organization_id DROP NOT NULL;

-- Atualizar RLS policies da tabela chats para não depender de organization_id
DROP POLICY IF EXISTS "Master users can manage all chats" ON public.chats;
DROP POLICY IF EXISTS "Organization members can manage chats" ON public.chats;

-- Criar nova política mais simples para chats
CREATE POLICY "Authenticated users can manage chats" 
ON public.chats 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);