-- Criar tabela para bloqueios de horários/datas de colaboradores
CREATE TABLE public.member_schedule_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  member_id UUID NOT NULL,
  block_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  reason TEXT,
  is_all_day BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela
ALTER TABLE public.member_schedule_blocks ENABLE ROW LEVEL SECURITY;

-- Política para membros da organização poderem gerenciar bloqueios
CREATE POLICY "Organization members can manage schedule blocks"
ON public.member_schedule_blocks
FOR ALL
USING (organization_id = get_user_organization_id());

-- Política para visualização pública dos bloqueios (para agenda pública)
CREATE POLICY "Public can view schedule blocks for availability"
ON public.member_schedule_blocks
FOR SELECT
USING (true);

-- Trigger para atualizar o campo updated_at
CREATE TRIGGER update_member_schedule_blocks_updated_at
BEFORE UPDATE ON public.member_schedule_blocks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar índices para melhorar performance
CREATE INDEX idx_member_schedule_blocks_org_member ON public.member_schedule_blocks(organization_id, member_id);
CREATE INDEX idx_member_schedule_blocks_date ON public.member_schedule_blocks(block_date);
CREATE INDEX idx_member_schedule_blocks_member_date ON public.member_schedule_blocks(member_id, block_date);