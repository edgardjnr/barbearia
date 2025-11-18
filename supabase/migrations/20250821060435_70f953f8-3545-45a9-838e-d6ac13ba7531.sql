-- Permitir acesso público aos profiles dos colaboradores para agendamento
CREATE POLICY "Public can view member profiles for booking" 
ON public.profiles 
FOR SELECT 
USING (
  user_id IN (
    SELECT om.user_id 
    FROM organization_members om 
    WHERE om.status = 'active'
  )
);

-- Permitir acesso público aos serviços por membro para agendamento
CREATE POLICY "Public can view member services for booking" 
ON public.member_services 
FOR SELECT 
USING (true);

-- Permitir acesso público aos bloqueios de horário para verificar disponibilidade
CREATE POLICY "Public can view schedule blocks for booking" 
ON public.member_schedule_blocks 
FOR SELECT 
USING (true);