-- Recriar tabelas que estavam na estrutura anterior

-- 1. Criar tabela service_history para histórico de serviços
CREATE TABLE public.service_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  client_id UUID NOT NULL,
  service_id UUID NOT NULL,
  employee_id UUID,
  appointment_id UUID,
  price NUMERIC,
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_history ENABLE ROW LEVEL SECURITY;

-- Create policy for service_history
CREATE POLICY "Organization members can manage service history" 
ON public.service_history 
FOR ALL 
USING (organization_id = get_user_organization_id());

-- 2. Criar tabela user_roles para controle de papéis
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  role user_role NOT NULL DEFAULT 'employee',
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_roles
CREATE POLICY "Organization members can view roles" 
ON public.user_roles 
FOR SELECT 
USING (organization_id = get_user_organization_id());

CREATE POLICY "Managers can manage roles" 
ON public.user_roles 
FOR ALL 
USING (organization_id = get_user_organization_id() AND can_manage_users());

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_service_history_updated_at
BEFORE UPDATE ON public.service_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add missing trigger for handle_new_user (estava na configuração mas não no schema)
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();