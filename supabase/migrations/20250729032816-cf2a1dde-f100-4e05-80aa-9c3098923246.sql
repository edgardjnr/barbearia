-- Atualizar a função get_user_organization_id para retornar NULL em vez de string vazia
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT organization_id 
  FROM public.organization_members 
  WHERE user_id = auth.uid() 
    AND status = 'active'
  LIMIT 1;
$function$;

-- Atualizar as políticas da tabela clients para lidar melhor com NULLs
DROP POLICY IF EXISTS "Organization members can view and manage clients" ON public.clients;

CREATE POLICY "Organization members can view and manage clients" 
ON public.clients 
FOR ALL
USING (
  CASE 
    WHEN get_user_organization_id() IS NOT NULL 
    THEN organization_id = get_user_organization_id()
    ELSE false
  END
)
WITH CHECK (
  CASE 
    WHEN get_user_organization_id() IS NOT NULL 
    THEN organization_id = get_user_organization_id()
    ELSE false
  END
);