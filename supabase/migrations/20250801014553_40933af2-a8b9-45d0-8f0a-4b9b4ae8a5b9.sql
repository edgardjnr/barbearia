-- Add remaining RLS policies for master users

-- Working hours table
CREATE POLICY "Master users can manage all working hours"
ON public.working_hours
FOR ALL
TO authenticated
USING (public.is_master_user())
WITH CHECK (public.is_master_user());

-- Member services table
CREATE POLICY "Master users can manage all member services"
ON public.member_services
FOR ALL
TO authenticated
USING (public.is_master_user())
WITH CHECK (public.is_master_user());

-- Service history table
CREATE POLICY "Master users can manage all service history"
ON public.service_history
FOR ALL
TO authenticated
USING (public.is_master_user())
WITH CHECK (public.is_master_user());

-- Reviews table
CREATE POLICY "Master users can manage all reviews"
ON public.reviews
FOR ALL
TO authenticated
USING (public.is_master_user())
WITH CHECK (public.is_master_user());

-- Loyalty settings table
CREATE POLICY "Master users can manage all loyalty settings"
ON public.loyalty_settings
FOR ALL
TO authenticated
USING (public.is_master_user())
WITH CHECK (public.is_master_user());

-- Loyalty rewards table
CREATE POLICY "Master users can manage all loyalty rewards"
ON public.loyalty_rewards
FOR ALL
TO authenticated
USING (public.is_master_user())
WITH CHECK (public.is_master_user());

-- Client loyalty points table
CREATE POLICY "Master users can manage all loyalty points"
ON public.client_loyalty_points
FOR ALL
TO authenticated
USING (public.is_master_user())
WITH CHECK (public.is_master_user());

-- Loyalty point transactions table
CREATE POLICY "Master users can manage all loyalty transactions"
ON public.loyalty_point_transactions
FOR ALL
TO authenticated
USING (public.is_master_user())
WITH CHECK (public.is_master_user());

-- Loyalty redemptions table
CREATE POLICY "Master users can manage all loyalty redemptions"
ON public.loyalty_redemptions
FOR ALL
TO authenticated
USING (public.is_master_user())
WITH CHECK (public.is_master_user());

-- Member permissions table
CREATE POLICY "Master users can manage all member permissions"
ON public.member_permissions
FOR ALL
TO authenticated
USING (public.is_master_user())
WITH CHECK (public.is_master_user());

-- Member schedule blocks table
CREATE POLICY "Master users can manage all schedule blocks"
ON public.member_schedule_blocks
FOR ALL
TO authenticated
USING (public.is_master_user())
WITH CHECK (public.is_master_user());

-- Invitations table
CREATE POLICY "Master users can manage all invitations"
ON public.invitations
FOR ALL
TO authenticated
USING (public.is_master_user())
WITH CHECK (public.is_master_user());

-- User roles table
CREATE POLICY "Master users can manage all user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_master_user())
WITH CHECK (public.is_master_user());