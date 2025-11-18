-- Create enum for CRUD operations (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'crud_operation') THEN
        CREATE TYPE public.crud_operation AS ENUM (
          'create',
          'read', 
          'update',
          'delete'
        );
    END IF;
END$$;