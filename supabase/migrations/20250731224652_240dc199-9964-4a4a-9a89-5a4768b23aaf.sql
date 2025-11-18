-- Check if trigger exists and create it if needed
DO $$
BEGIN
    -- Check if trigger exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_initialize_member_permissions'
        AND event_object_table = 'organization_members'
    ) THEN
        -- Create the trigger
        CREATE TRIGGER trigger_initialize_member_permissions
        AFTER INSERT OR UPDATE ON public.organization_members
        FOR EACH ROW
        EXECUTE FUNCTION public.initialize_member_permissions();
        
        RAISE NOTICE 'Trigger trigger_initialize_member_permissions created successfully';
    ELSE
        RAISE NOTICE 'Trigger trigger_initialize_member_permissions already exists';
    END IF;
END$$;