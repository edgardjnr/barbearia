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

-- Create function to get all organizations for master users
CREATE OR REPLACE FUNCTION public.get_user_organizations()
RETURNS TABLE (
  organization_id uuid,
  organization_name text,
  organization_description text,
  user_role user_role,
  member_status member_status,
  joined_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT 
    CASE 
      WHEN public.is_master_user() THEN
        -- Master users can see all organizations
        (SELECT o.id, o.name, o.description, 'owner'::user_role, 'active'::member_status, o.created_at
         FROM public.organizations o
         ORDER BY o.created_at ASC)
      ELSE
        -- Regular users see only their organizations
        (SELECT o.id, o.name, o.description, om.role, om.status, om.joined_at
         FROM public.organizations o
         INNER JOIN public.organization_members om ON o.id = om.organization_id
         WHERE om.user_id = auth.uid() 
           AND om.status = 'active'
         ORDER BY om.joined_at ASC)
    END;
$$;

-- Set edgard.drinks@gmail.com as master user
UPDATE public.profiles 
SET is_master = true 
WHERE email = 'edgard.drinks@gmail.com';

-- Update RLS policies to allow master users full access

-- Organizations table
DROP POLICY IF EXISTS "Master users can view all organizations" ON public.organizations;
CREATE POLICY "Master users can view all organizations"
ON public.organizations
FOR ALL
TO authenticated
USING (public.is_master_user())
WITH CHECK (public.is_master_user());

-- Organization members table  
DROP POLICY IF EXISTS "Master users can manage all members" ON public.organization_members;
CREATE POLICY "Master users can manage all members"
ON public.organization_members
FOR ALL
TO authenticated
USING (public.is_master_user())
WITH CHECK (public.is_master_user());

-- Profiles table
DROP POLICY IF EXISTS "Master users can view all profiles" ON public.profiles;
CREATE POLICY "Master users can view all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (public.is_master_user())
WITH CHECK (public.is_master_user());

-- Services table
DROP POLICY IF EXISTS "Master users can manage all services" ON public.services;
CREATE POLICY "Master users can manage all services"
ON public.services
FOR ALL
TO authenticated
USING (public.is_master_user())
WITH CHECK (public.is_master_user());

-- Clients table
DROP POLICY IF EXISTS "Master users can manage all clients" ON public.clients;
CREATE POLICY "Master users can manage all clients"
ON public.clients
FOR ALL
TO authenticated
USING (public.is_master_user())
WITH CHECK (public.is_master_user());

-- Appointments table
DROP POLICY IF EXISTS "Master users can manage all appointments" ON public.appointments;
CREATE POLICY "Master users can manage all appointments"
ON public.appointments
FOR ALL
TO authenticated
USING (public.is_master_user())
WITH CHECK (public.is_master_user());

-- Working hours table
DROP POLICY IF EXISTS "Master users can manage all working hours" ON public.working_hours;
CREATE POLICY "Master users can manage all working hours"
ON public.working_hours
FOR ALL
TO authenticated
USING (public.is_master_user())
WITH CHECK (public.is_master_user());

-- Member services table
DROP POLICY IF EXISTS "Master users can manage all member services" ON public.member_services;
CREATE POLICY "Master users can manage all member services"
ON public.member_services
FOR ALL
TO authenticated
USING (public.is_master_user())
WITH CHECK (public.is_master_user());

-- Service history table
DROP POLICY IF EXISTS "Master users can manage all service history" ON public.service_history;
CREATE POLICY "Master users can manage all service history"
ON public.service_history
FOR ALL
TO authenticated
USING (public.is_master_user())
WITH CHECK (public.is_master_user());

-- Reviews table
DROP POLICY IF EXISTS "Master users can manage all reviews" ON public.reviews;
CREATE POLICY "Master users can manage all reviews"
ON public.reviews
FOR ALL
TO authenticated
USING (public.is_master_user())
WITH CHECK (public.is_master_user());

-- Loyalty tables
DROP POLICY IF EXISTS "Master users can manage all loyalty settings" ON public.loyalty_settings;
CREATE POLICY "Master users can manage all loyalty settings"
ON public.loyalty_settings
FOR ALL
TO authenticated
USING (public.is_master_user())
WITH CHECK (public.is_master_user());

DROP POLICY IF EXISTS "Master users can manage all loyalty rewards" ON public.loyalty_rewards;
CREATE POLICY "Master users can manage all loyalty rewards"
ON public.loyalty_rewards
FOR ALL
TO authenticated
USING (public.is_master_user())
WITH CHECK (public.is_master_user());

DROP POLICY IF EXISTS "Master users can manage all loyalty points" ON public.client_loyalty_points;
CREATE POLICY "Master users can manage all loyalty points"
ON public.client_loyalty_points
FOR ALL
TO authenticated
USING (public.is_master_user())
WITH CHECK (public.is_master_user());

DROP POLICY IF EXISTS "Master users can manage all loyalty transactions" ON public.loyalty_point_transactions;
CREATE POLICY "Master users can manage all loyalty transactions"
ON public.loyalty_point_transactions
FOR ALL
TO authenticated
USING (public.is_master_user())
WITH CHECK (public.is_master_user());

DROP POLICY IF EXISTS "Master users can manage all loyalty redemptions" ON public.loyalty_redemptions;
CREATE POLICY "Master users can manage all loyalty redemptions"
ON public.loyalty_redemptions
FOR ALL
TO authenticated
USING (public.is_master_user())
WITH CHECK (public.is_master_user());

-- Member permissions table
DROP POLICY IF EXISTS "Master users can manage all member permissions" ON public.member_permissions;
CREATE POLICY "Master users can manage all member permissions"
ON public.member_permissions
FOR ALL
TO authenticated
USING (public.is_master_user())
WITH CHECK (public.is_master_user());

-- Member schedule blocks table
DROP POLICY IF EXISTS "Master users can manage all schedule blocks" ON public.member_schedule_blocks;
CREATE POLICY "Master users can manage all schedule blocks"
ON public.member_schedule_blocks
FOR ALL
TO authenticated
USING (public.is_master_user())
WITH CHECK (public.is_master_user());

-- Invitations table
DROP POLICY IF EXISTS "Master users can manage all invitations" ON public.invitations;
CREATE POLICY "Master users can manage all invitations"
ON public.invitations
FOR ALL
TO authenticated
USING (public.is_master_user())
WITH CHECK (public.is_master_user());

-- User roles table
DROP POLICY IF EXISTS "Master users can manage all user roles" ON public.user_roles;
CREATE POLICY "Master users can manage all user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_master_user())
WITH CHECK (public.is_master_user());