-- Enable real-time updates for the Mensagens table
ALTER TABLE public."Mensagens" REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public."Mensagens";