-- Create enum for module names
CREATE TYPE public.module_name AS ENUM (
  'dashboard',
  'agenda', 
  'clients',
  'services',
  'reports',
  'loyalty',
  'reviews',
  'users',
  'settings'
);

-- Create enum for CRUD operations
CREATE TYPE public.crud_operation AS ENUM (
  'create',
  'read', 
  'update',
  'delete'
);