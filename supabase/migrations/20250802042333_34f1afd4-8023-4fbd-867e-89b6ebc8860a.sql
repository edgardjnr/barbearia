-- Permitir acesso público para leitura de member_services (necessário para agendamento público)
CREATE POLICY "Public can view member services for booking" 
ON public.member_services 
FOR SELECT 
USING (true);