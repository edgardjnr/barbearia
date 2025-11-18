-- Remove all user-related data from the database
-- Note: This will not delete auth.users (managed by Supabase Auth)
-- but will clean all related user data in public schema

-- Delete all organization members
DELETE FROM public.organization_members;

-- Delete all user profiles
DELETE FROM public.profiles;

-- Delete all user roles
DELETE FROM public.user_roles;

-- Delete all member services
DELETE FROM public.member_services;

-- Delete all working hours
DELETE FROM public.working_hours;

-- Delete all invitations
DELETE FROM public.invitations;

-- Delete all appointments
DELETE FROM public.appointments;

-- Delete all clients
DELETE FROM public.clients;

-- Delete all service history
DELETE FROM public.service_history;

-- Delete all reviews
DELETE FROM public.reviews;

-- Delete all loyalty-related data
DELETE FROM public.loyalty_point_transactions;
DELETE FROM public.loyalty_redemptions;
DELETE FROM public.client_loyalty_points;

-- Delete all organizations (this will cascade delete related data)
DELETE FROM public.organizations;