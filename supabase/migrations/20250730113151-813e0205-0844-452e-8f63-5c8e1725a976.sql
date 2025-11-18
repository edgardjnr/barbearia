-- Add WhatsApp integration fields to organizations table
ALTER TABLE public.organizations 
ADD COLUMN whatsapp_instance_name TEXT,
ADD COLUMN whatsapp_apikey TEXT;