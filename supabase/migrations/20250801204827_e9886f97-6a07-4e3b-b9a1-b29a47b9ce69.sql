-- Adicionar coluna status para gerenciar status dos chats
ALTER TABLE "Mensagens" 
ADD COLUMN chat_status TEXT DEFAULT 'open' CHECK (chat_status IN ('open', 'closed'));