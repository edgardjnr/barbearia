-- Adicionar campo de data de aniversário na tabela clients
ALTER TABLE public.clients 
ADD COLUMN birth_date DATE;