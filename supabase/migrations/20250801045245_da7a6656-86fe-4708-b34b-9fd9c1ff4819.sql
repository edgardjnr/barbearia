-- Add column to track viewed messages
ALTER TABLE public."Mensagens" 
ADD COLUMN "Mensagem_visualizada" boolean DEFAULT NULL;