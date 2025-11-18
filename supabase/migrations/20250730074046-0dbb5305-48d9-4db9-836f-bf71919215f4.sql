-- Adicionar política para permitir que usuários públicos vejam agendamentos
-- para verificar disponibilidade de horários
CREATE POLICY "Public can view appointments for availability check" 
ON public.appointments 
FOR SELECT 
USING (true);