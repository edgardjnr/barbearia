-- Corrigir vulnerabilidade: Remover acesso público às atribuições de serviços

-- BUSINESS SERVICE ASSIGNMENTS - Remover acesso público a dados de atribuições internas
-- Essas informações revelam estrutura da equipe e especialidades dos funcionários

-- 1. Remover acesso público às atribuições de serviços por membro
DROP POLICY IF EXISTS "Public can view member services for booking" ON public.member_services;

-- 2. Criar política restritiva para proteger dados de atribuições
CREATE POLICY "No public access to member services data" 
ON public.member_services 
FOR SELECT 
USING (false);

-- As funcionalidades continuarão funcionando normalmente:
-- - Membros da organização podem ver atribuições via "Organization members can view member services"
-- - Membros podem gerenciar atribuições via "Organization members can manage member services"  
-- - Master users mantêm acesso total via "Master users can manage all member services"
-- - Sistema interno de agendamento permanece funcional

-- DADOS PROTEGIDOS AGORA:
-- - Quais funcionários realizam quais serviços (member_services)
-- - Especialidades e capacidades da equipe
-- - Estrutura organizacional interna
-- - Distribuição de competências por membro
-- - Configurações de atribuições de trabalho

-- O sistema de agendamento público continuará funcionando através das funções seguras:
-- - get_profiles_for_booking(org_id) para listar profissionais disponíveis
-- - Sem expor quais serviços específicos cada um realiza