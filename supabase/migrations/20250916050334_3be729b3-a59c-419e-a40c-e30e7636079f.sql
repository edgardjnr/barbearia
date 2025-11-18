-- Add organization_id column to Mensagens table
ALTER TABLE public."Mensagens" 
ADD COLUMN organization_id uuid REFERENCES public.organizations(id);

-- Create index for better performance
CREATE INDEX idx_mensagens_organization_id ON public."Mensagens"(organization_id);

-- Backfill existing messages with organization_id based on instance name
UPDATE public."Mensagens" 
SET organization_id = (
  SELECT o.id 
  FROM public.organizations o 
  WHERE o.whatsapp_instance_name = "Mensagens"."Instancia"
  LIMIT 1
)
WHERE organization_id IS NULL 
  AND "Instancia" IS NOT NULL;

-- Update RLS policies to use organization_id instead of just instance name
DROP POLICY IF EXISTS "Organization members can manage their WhatsApp messages" ON public."Mensagens";

CREATE POLICY "Organization members can manage their WhatsApp messages" 
ON public."Mensagens"
FOR ALL 
USING (
  organization_id = get_user_organization_id() OR is_master_user()
)
WITH CHECK (
  organization_id = get_user_organization_id() OR is_master_user()
);