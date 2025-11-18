-- Enable realtime for all tables
-- First set REPLICA IDENTITY FULL to capture complete row data during updates

ALTER TABLE public.appointments REPLICA IDENTITY FULL;
ALTER TABLE public.clients REPLICA IDENTITY FULL;
ALTER TABLE public.invitations REPLICA IDENTITY FULL;
ALTER TABLE public.loyalty_redemptions REPLICA IDENTITY FULL;
ALTER TABLE public.loyalty_rewards REPLICA IDENTITY FULL;
ALTER TABLE public.loyalty_settings REPLICA IDENTITY FULL;
ALTER TABLE public.member_services REPLICA IDENTITY FULL;
ALTER TABLE public.organization_members REPLICA IDENTITY FULL;
ALTER TABLE public.organizations REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.reviews REPLICA IDENTITY FULL;
ALTER TABLE public.service_history REPLICA IDENTITY FULL;
ALTER TABLE public.services REPLICA IDENTITY FULL;
ALTER TABLE public.user_roles REPLICA IDENTITY FULL;
ALTER TABLE public.working_hours REPLICA IDENTITY FULL;

-- Add all tables to supabase_realtime publication to activate real-time functionality

ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invitations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.loyalty_redemptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.loyalty_rewards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.loyalty_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.member_services;
ALTER PUBLICATION supabase_realtime ADD TABLE public.organization_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.organizations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.working_hours;