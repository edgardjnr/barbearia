-- Criar bucket para armazenar imagens das mensagens
INSERT INTO storage.buckets (id, name, public) 
VALUES ('image-message', 'image-message', true);

-- Criar políticas para o bucket image-message
CREATE POLICY "Anyone can view image messages" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'image-message');

CREATE POLICY "Authenticated users can upload image messages" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'image-message' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update their image messages" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'image-message' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete their image messages" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'image-message' AND auth.role() = 'authenticated');