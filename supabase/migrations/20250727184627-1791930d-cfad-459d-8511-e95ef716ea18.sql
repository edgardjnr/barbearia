-- Create policy to allow public access to pending invitations by token
CREATE POLICY "Allow public access to pending invitations by token" 
ON public.invitations 
FOR SELECT 
TO public
USING (status = 'pending' AND expires_at > now());