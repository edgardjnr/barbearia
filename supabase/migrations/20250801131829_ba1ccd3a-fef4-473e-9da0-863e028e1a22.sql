-- Adicionar campo para URL base da Evolution API
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS whatsapp_base_url text DEFAULT 'https://api.onebots.com.br';