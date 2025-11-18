-- Allow organization members to view and manage messages from their organization's WhatsApp instance
CREATE POLICY "Organization members can manage their WhatsApp messages" 
ON public."Mensagens" 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 
    FROM public.organization_members om
    JOIN public.organizations o ON om.organization_id = o.id
    WHERE om.user_id = auth.uid() 
      AND om.status = 'active'
      AND o.whatsapp_instance_name = "Mensagens"."Instancia"
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.organization_members om
    JOIN public.organizations o ON om.organization_id = o.id
    WHERE om.user_id = auth.uid() 
      AND om.status = 'active'
      AND o.whatsapp_instance_name = "Mensagens"."Instancia"
  )
);