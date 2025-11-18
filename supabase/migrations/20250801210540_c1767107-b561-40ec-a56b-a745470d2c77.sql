-- Remover coluna chat_status da tabela Mensagens (não é mais necessária)
ALTER TABLE "Mensagens" DROP COLUMN IF EXISTS chat_status;