-- Add missing constraints to member_permissions table
-- Add primary key if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'member_permissions' 
        AND constraint_type = 'PRIMARY KEY'
    ) THEN
        ALTER TABLE public.member_permissions ADD PRIMARY KEY (id);
    END IF;
END$$;

-- Add unique constraint for the combination that prevents duplicates
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'member_permissions' 
        AND constraint_name = 'member_permissions_unique_permission'
    ) THEN
        ALTER TABLE public.member_permissions 
        ADD CONSTRAINT member_permissions_unique_permission 
        UNIQUE (organization_id, member_id, module, operation);
    END IF;
END$$;

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'member_permissions' 
        AND constraint_name = 'member_permissions_member_id_fkey'
    ) THEN
        ALTER TABLE public.member_permissions 
        ADD CONSTRAINT member_permissions_member_id_fkey 
        FOREIGN KEY (member_id) REFERENCES public.organization_members(id) ON DELETE CASCADE;
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'member_permissions' 
        AND constraint_name = 'member_permissions_organization_id_fkey'
    ) THEN
        ALTER TABLE public.member_permissions 
        ADD CONSTRAINT member_permissions_organization_id_fkey 
        FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
    END IF;
END$$;