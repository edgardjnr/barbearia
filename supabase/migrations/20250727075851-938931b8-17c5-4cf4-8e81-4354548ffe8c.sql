-- Criar tabela para configurações de fidelidade
CREATE TABLE public.loyalty_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  points_per_real NUMERIC DEFAULT 1.0, -- pontos por real gasto
  points_per_visit INTEGER DEFAULT 10, -- pontos por visita
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

-- Criar tabela para tiers de fidelidade personalizados
CREATE TABLE public.loyalty_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  min_points INTEGER NOT NULL,
  max_points INTEGER, -- NULL para tier mais alto
  color TEXT DEFAULT '#6B7280', -- cor hex
  icon TEXT DEFAULT 'gift', -- nome do ícone lucide
  benefits TEXT, -- descrição dos benefícios
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loyalty_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_tiers ENABLE ROW LEVEL SECURITY;

-- Create policies for loyalty_settings
CREATE POLICY "Organization members can manage loyalty settings" 
ON public.loyalty_settings 
FOR ALL 
USING (organization_id = get_user_organization_id());

-- Create policies for loyalty_tiers
CREATE POLICY "Organization members can manage loyalty tiers" 
ON public.loyalty_tiers 
FOR ALL 
USING (organization_id = get_user_organization_id());

-- Create triggers for updated_at
CREATE TRIGGER update_loyalty_settings_updated_at
BEFORE UPDATE ON public.loyalty_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loyalty_tiers_updated_at
BEFORE UPDATE ON public.loyalty_tiers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings and tiers for existing organizations
INSERT INTO public.loyalty_settings (organization_id, points_per_real, points_per_visit)
SELECT id, 0.1, 10 FROM public.organizations;

-- Insert default tiers for existing organizations
DO $$
DECLARE
    org_record RECORD;
BEGIN
    FOR org_record IN SELECT id FROM public.organizations
    LOOP
        INSERT INTO public.loyalty_tiers (organization_id, name, min_points, max_points, color, icon, order_index) VALUES
        (org_record.id, 'Bronze', 0, 99, '#EA580C', 'gift', 1),
        (org_record.id, 'Prata', 100, 199, '#6B7280', 'star', 2),
        (org_record.id, 'Ouro', 200, 499, '#EAB308', 'award', 3),
        (org_record.id, 'Diamante', 500, NULL, '#7C3AED', 'crown', 4);
    END LOOP;
END $$;