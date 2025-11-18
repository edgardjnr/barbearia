-- Habilitar RLS na tabela _prisma_migrations
ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir que apenas master users acessem migrations
CREATE POLICY "Only master users can access migrations" 
ON public._prisma_migrations 
FOR ALL 
USING (is_master_user())
WITH CHECK (is_master_user());