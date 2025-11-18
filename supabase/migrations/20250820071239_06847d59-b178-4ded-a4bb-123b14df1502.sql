-- Garantir que todas as tabelas públicas têm RLS habilitado
ALTER TABLE public.Mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;