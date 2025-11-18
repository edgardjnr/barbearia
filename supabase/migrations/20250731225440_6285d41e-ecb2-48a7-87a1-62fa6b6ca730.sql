-- Test the trigger and function setup by creating a test scenario
-- Let's create a test to make sure everything works

-- First check if the function exists and is properly configured
SELECT 
    p.proname as function_name,
    p.prosecdef as is_security_definer,
    array_to_string(p.proconfig, ', ') as config
FROM pg_proc p 
WHERE p.proname = 'initialize_member_permissions';