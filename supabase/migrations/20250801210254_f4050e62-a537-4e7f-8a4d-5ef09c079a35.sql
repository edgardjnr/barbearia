-- Criar tabela para gerenciar chats
CREATE TABLE public.chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  client_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE,
  closed_by UUID,
  UNIQUE(organization_id, client_phone)
);

-- Enable RLS
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- Create policies for chats
CREATE POLICY "Master users can manage all chats" 
ON public.chats 
FOR ALL 
USING (is_master_user())
WITH CHECK (is_master_user());

CREATE POLICY "Organization members can manage chats" 
ON public.chats 
FOR ALL 
USING (organization_id = get_user_organization_id());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_chats_updated_at
BEFORE UPDATE ON public.chats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get or create chat
CREATE OR REPLACE FUNCTION public.get_or_create_chat(
  _organization_id UUID,
  _client_phone TEXT
) RETURNS UUID AS $$
DECLARE
  chat_id UUID;
BEGIN
  -- Try to get existing chat
  SELECT id INTO chat_id 
  FROM public.chats 
  WHERE organization_id = _organization_id 
    AND client_phone = _client_phone;
  
  -- If not found, create new chat
  IF chat_id IS NULL THEN
    INSERT INTO public.chats (organization_id, client_phone, status)
    VALUES (_organization_id, _client_phone, 'open')
    RETURNING id INTO chat_id;
  END IF;
  
  RETURN chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;