-- Inicializar permissões para membros existentes
DO $$
DECLARE
  member_record RECORD;
BEGIN
  -- Executar o trigger para todos os membros ativos existentes
  FOR member_record IN 
    SELECT * FROM public.organization_members 
    WHERE status = 'active'
  LOOP
    -- Simular um UPDATE para disparar o trigger de inicialização
    UPDATE public.organization_members 
    SET updated_at = now() 
    WHERE id = member_record.id;
  END LOOP;
END $$;