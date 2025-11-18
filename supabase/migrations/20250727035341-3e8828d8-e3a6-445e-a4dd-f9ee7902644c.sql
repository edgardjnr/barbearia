-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'employee', 'viewer');

-- Create user_profiles table
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    bio TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE (user_id, role)
);

-- Create organizations table (salons)
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    settings JSONB DEFAULT '{}',
    owner_id UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create organization_members table
CREATE TABLE public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    invited_by UUID REFERENCES auth.users(id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
    UNIQUE (organization_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles within organization
CREATE OR REPLACE FUNCTION public.has_organization_role(_user_id UUID, _org_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _org_id
      AND role = _role
      AND status = 'active'
  )
$$;

-- Create security definer function to check if user has role or higher
CREATE OR REPLACE FUNCTION public.has_organization_role_or_higher(_user_id UUID, _org_id UUID, _min_role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _org_id
      AND status = 'active'
      AND (
        (_min_role = 'viewer' AND role IN ('viewer', 'employee', 'admin', 'owner')) OR
        (_min_role = 'employee' AND role IN ('employee', 'admin', 'owner')) OR
        (_min_role = 'admin' AND role IN ('admin', 'owner')) OR
        (_min_role = 'owner' AND role = 'owner')
      )
  )
$$;

-- Create function to get user's organization
CREATE OR REPLACE FUNCTION public.get_user_organization(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT organization_id
  FROM public.organization_members
  WHERE user_id = _user_id
    AND status = 'active'
  LIMIT 1
$$;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.user_profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.user_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for organizations
CREATE POLICY "Organization owners can view their organization"
ON public.organizations
FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Organization owners can update their organization"
ON public.organizations
FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "Users can create organizations"
ON public.organizations
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- RLS Policies for organization_members
CREATE POLICY "Organization members can view members of their organization"
ON public.organization_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.user_id = auth.uid()
      AND om.organization_id = organization_members.organization_id
      AND om.status = 'active'
  )
);

CREATE POLICY "Organization admins can manage members"
ON public.organization_members
FOR ALL
USING (
  public.has_organization_role_or_higher(auth.uid(), organization_id, 'admin')
);

-- Update existing tables to include organization_id
ALTER TABLE public.clients ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.services ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.appointments ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.service_history ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- Update RLS policies for existing tables to use organization-based access
DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can create their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON public.clients;

CREATE POLICY "Organization members can view organization clients"
ON public.clients
FOR SELECT
USING (
  public.has_organization_role_or_higher(auth.uid(), organization_id, 'viewer')
);

CREATE POLICY "Organization employees can manage clients"
ON public.clients
FOR ALL
USING (
  public.has_organization_role_or_higher(auth.uid(), organization_id, 'employee')
);

-- Update services policies
DROP POLICY IF EXISTS "Users can view their own services" ON public.services;
DROP POLICY IF EXISTS "Users can create their own services" ON public.services;
DROP POLICY IF EXISTS "Users can update their own services" ON public.services;
DROP POLICY IF EXISTS "Users can delete their own services" ON public.services;

CREATE POLICY "Organization members can view organization services"
ON public.services
FOR SELECT
USING (
  public.has_organization_role_or_higher(auth.uid(), organization_id, 'viewer')
);

CREATE POLICY "Organization employees can manage services"
ON public.services
FOR ALL
USING (
  public.has_organization_role_or_higher(auth.uid(), organization_id, 'employee')
);

-- Update appointments policies
DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can create their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can delete their own appointments" ON public.appointments;

CREATE POLICY "Organization members can view organization appointments"
ON public.appointments
FOR SELECT
USING (
  public.has_organization_role_or_higher(auth.uid(), organization_id, 'viewer')
);

CREATE POLICY "Organization employees can manage appointments"
ON public.appointments
FOR ALL
USING (
  public.has_organization_role_or_higher(auth.uid(), organization_id, 'employee')
);

-- Update service_history policies
DROP POLICY IF EXISTS "Users can view their own service history" ON public.service_history;
DROP POLICY IF EXISTS "Users can create their own service history" ON public.service_history;
DROP POLICY IF EXISTS "Users can update their own service history" ON public.service_history;
DROP POLICY IF EXISTS "Users can delete their own service history" ON public.service_history;

CREATE POLICY "Organization members can view organization service history"
ON public.service_history
FOR SELECT
USING (
  public.has_organization_role_or_higher(auth.uid(), organization_id, 'viewer')
);

CREATE POLICY "Organization employees can manage service history"
ON public.service_history
FOR ALL
USING (
  public.has_organization_role_or_higher(auth.uid(), organization_id, 'employee')
);

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default organization for existing users (if any)
-- This will need to be handled in the application logic