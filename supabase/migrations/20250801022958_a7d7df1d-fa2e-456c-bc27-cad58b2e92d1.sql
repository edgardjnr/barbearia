-- Corrigir a função switch_current_organization para permitir usuários master
CREATE OR REPLACE FUNCTION public.switch_current_organization(_organization_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Check if user is master - masters can switch to any organization
  IF public.is_master_user() THEN
    -- Update user's current organization
    UPDATE public.profiles 
    SET current_organization_id = _organization_id,
        updated_at = now()
    WHERE user_id = auth.uid();
    
    RETURN true;
  END IF;
  
  -- Check if user is a member of this organization
  IF NOT EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE user_id = auth.uid() 
      AND organization_id = _organization_id 
      AND status = 'active'
  ) THEN
    RETURN false;
  END IF;
  
  -- Update user's current organization
  UPDATE public.profiles 
  SET current_organization_id = _organization_id,
      updated_at = now()
  WHERE user_id = auth.uid();
  
  RETURN true;
END;
$$;