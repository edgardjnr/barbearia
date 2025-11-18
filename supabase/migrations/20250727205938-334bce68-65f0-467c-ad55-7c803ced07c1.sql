-- Permitir acesso público para visualizar organizações (apenas dados básicos)
-- Isso permite que a página de agendamento público encontre a organização pelo nome
CREATE POLICY "Public can view organizations for booking" 
ON public.organizations 
FOR SELECT 
USING (true);

-- Permitir acesso público para visualizar serviços ativos de qualquer organização
-- Necessário para mostrar os serviços disponíveis na página de agendamento público
CREATE POLICY "Public can view active services for booking" 
ON public.services 
FOR SELECT 
USING (is_active = true);

-- Permitir acesso público para visualizar membros ativos das organizações
-- Necessário para mostrar os profissionais disponíveis na página de agendamento público
CREATE POLICY "Public can view active organization members for booking" 
ON public.organization_members 
FOR SELECT 
USING (status = 'active');

-- Permitir acesso público para visualizar perfis de membros da organização
-- Necessário para mostrar os nomes dos profissionais na página de agendamento público
CREATE POLICY "Public can view profiles for booking" 
ON public.profiles 
FOR SELECT 
USING (user_id IN (
  SELECT user_id 
  FROM public.organization_members 
  WHERE status = 'active'
));

-- Permitir acesso público para criar clientes (quando alguém agenda um serviço)
-- Isso permite que a página pública crie registros de clientes
CREATE POLICY "Public can create clients for booking" 
ON public.clients 
FOR INSERT 
WITH CHECK (true);

-- Permitir acesso público para criar agendamentos
-- Isso permite que a página pública crie novos agendamentos
CREATE POLICY "Public can create appointments for booking" 
ON public.appointments 
FOR INSERT 
WITH CHECK (true);