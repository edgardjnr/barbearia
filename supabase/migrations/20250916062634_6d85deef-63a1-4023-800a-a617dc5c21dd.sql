-- Remover políticas RLS existentes que dependem de organization_id
DROP POLICY IF EXISTS "Only master users can access messages" ON public."Mensagens";
DROP POLICY IF EXISTS "Organization members can manage their WhatsApp messages" ON public."Mensagens";

-- Criar nova política RLS mais simples - apenas usuários autenticados podem acessar mensagens
CREATE POLICY "Authenticated users can access all messages" 
ON public."Mensagens" 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Tornar organization_id opcional na tabela (se ainda não for)
ALTER TABLE public."Mensagens" ALTER COLUMN organization_id DROP NOT NULL;