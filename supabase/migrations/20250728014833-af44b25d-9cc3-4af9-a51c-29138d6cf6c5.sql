-- Permitir acesso público aos horários de trabalho para agendamento
CREATE POLICY "Public can view working hours for booking" 
ON public.working_hours 
FOR SELECT 
USING (is_active = true);