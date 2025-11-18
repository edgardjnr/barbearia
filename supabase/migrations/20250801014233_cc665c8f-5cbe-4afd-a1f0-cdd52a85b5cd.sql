-- Add master user functionality
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_master boolean DEFAULT false;

-- Create function to check if user is master
CREATE OR REPLACE FUNCTION public.is_master_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT COALESCE(
    (SELECT is_master FROM public.profiles WHERE user_id = auth.uid()),
    false
  );
$$;

-- Update get_user_organization_id to handle master users
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT 
    CASE 
      WHEN public.is_master_user() THEN 
        -- For master users, return current_organization_id or first available organization
        COALESCE(
          (SELECT current_organization_id FROM public.profiles WHERE user_id = auth.uid()),
          (SELECT id FROM public.organizations ORDER BY created_at ASC LIMIT 1)
        )
      ELSE
        -- For regular users, use existing logic
        COALESCE(
          (SELECT current_organization_id FROM public.profiles WHERE user_id = auth.uid()),
          (SELECT organization_id 
           FROM public.organization_members 
           WHERE user_id = auth.uid() 
             AND status = 'active' 
           ORDER BY joined_at ASC 
           LIMIT 1)
        )
    END;
$$;

-- Set edgard.drinks@gmail.com as master user
UPDATE public.profiles 
SET is_master = true 
WHERE email = 'edgard.drinks@gmail.com';