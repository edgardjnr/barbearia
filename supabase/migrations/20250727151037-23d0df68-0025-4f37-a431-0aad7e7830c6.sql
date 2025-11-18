-- Create table to link organization members to services they provide
CREATE TABLE public.member_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  member_id UUID NOT NULL,
  service_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure unique combination of member and service within an organization
  UNIQUE (organization_id, member_id, service_id)
);

-- Enable Row Level Security
ALTER TABLE public.member_services ENABLE ROW LEVEL SECURITY;

-- Create policies for organization members to manage their services
CREATE POLICY "Organization members can view member services" 
ON public.member_services 
FOR SELECT 
USING (organization_id = get_user_organization_id());

CREATE POLICY "Organization members can manage member services" 
ON public.member_services 
FOR ALL 
USING (organization_id = get_user_organization_id());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_member_services_updated_at
BEFORE UPDATE ON public.member_services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();