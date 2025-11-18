-- Remover políticas atuais e criar políticas mais simples para testar
DROP POLICY IF EXISTS "Usuários podem fazer upload de suas fotos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem atualizar suas fotos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem excluir suas fotos" ON storage.objects;

-- Criar políticas temporárias mais permissivas para debug
CREATE POLICY "Debug: Usuários autenticados podem inserir no photo-perfil"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'photo-perfil' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Debug: Usuários autenticados podem atualizar no photo-perfil"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'photo-perfil' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Debug: Usuários autenticados podem excluir no photo-perfil"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'photo-perfil' 
  AND auth.uid() IS NOT NULL
);