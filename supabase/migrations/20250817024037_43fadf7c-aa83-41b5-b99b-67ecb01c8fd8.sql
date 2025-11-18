-- Corrigir vulnerabilidade: Remover acesso público aos dados do programa de fidelidade

-- LOYALTY PROGRAM DATA - Remover acesso público a dados estratégicos do programa de fidelidade
-- Essas informações revelam estratégias comerciais e configurações internas sensíveis

-- 1. Remover acesso público às recompensas - expõe estratégia de preços e ofertas
DROP POLICY IF EXISTS "Public can view active loyalty rewards" ON public.loyalty_rewards;

-- 2. Criar políticas restritivas para proteger dados do programa de fidelidade
CREATE POLICY "No public access to loyalty rewards data" 
ON public.loyalty_rewards 
FOR SELECT 
USING (false);

-- As funcionalidades do programa de fidelidade continuarão funcionando:
-- - Clientes autenticados podem ver seus próprios pontos via "Clients can view their own loyalty points"
-- - Clientes podem criar resgates via "Clients can create their own redemptions"  
-- - Clientes podem ver suas transações via "Clients can view their own loyalty point transactions"
-- - Membros da organização mantêm acesso completo para gerenciar o programa
-- - Master users mantêm acesso total

-- DADOS PROTEGIDOS AGORA:
-- - Configurações de pontos por real/visita (loyalty_settings)
-- - Estrutura de recompensas e custos em pontos (loyalty_rewards) 
-- - Limites de resgate e disponibilidade (loyalty_rewards)
-- - Estratégias de gamificação e níveis VIP (loyalty_settings)
-- - Dados agregados de transações de pontos