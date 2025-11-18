-- Adicionar 'messages' ao enum module_name se não existir
DO $$
BEGIN
    -- Verificar se o valor 'messages' já existe no enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'messages' 
        AND enumtypid = 'public.module_name'::regtype
    ) THEN
        -- Adicionar o valor 'messages' ao enum
        ALTER TYPE public.module_name ADD VALUE 'messages';
    END IF;
END$$;