-- Adicionar campo theme_preference na tabela profiles para salvar a preferência de tema do usuário
ALTER TABLE public.profiles 
ADD COLUMN theme_preference text DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system'));