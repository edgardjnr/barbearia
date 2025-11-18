-- Criar trigger para automaticamente conceder pontos de fidelidade quando um serviço é inserido na service_history
CREATE TRIGGER award_loyalty_points_trigger
    AFTER INSERT ON public.service_history
    FOR EACH ROW
    EXECUTE FUNCTION public.award_loyalty_points();