-- Criar políticas de storage para o bucket photo-perfil

-- Política para permitir visualização pública das fotos de perfil
CREATE POLICY "Fotos de perfil são públicas"
ON storage.objects
FOR SELECT
USING (bucket_id = 'photo-perfil');

-- Política para permitir que usuários autenticados façam upload de suas próprias fotos
CREATE POLICY "Usuários podem fazer upload de suas fotos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'photo-perfil' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para permitir que usuários atualizem suas próprias fotos
CREATE POLICY "Usuários podem atualizar suas fotos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'photo-perfil' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para permitir que usuários excluam suas próprias fotos
CREATE POLICY "Usuários podem excluir suas fotos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'photo-perfil' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);