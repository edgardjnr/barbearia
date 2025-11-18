-- Add foreign key relationship between organization_members and profiles
-- This will allow us to join the tables to get profile information

-- First check if we need to add a foreign key constraint
ALTER TABLE public.organization_members 
ADD CONSTRAINT fk_organization_members_profiles 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;