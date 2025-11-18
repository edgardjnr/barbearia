-- Criar a foreign key correta para appointments.member_id -> organization_members.id
ALTER TABLE public.appointments 
ADD CONSTRAINT appointments_member_id_fkey 
FOREIGN KEY (member_id) 
REFERENCES public.organization_members(id) 
ON DELETE SET NULL;