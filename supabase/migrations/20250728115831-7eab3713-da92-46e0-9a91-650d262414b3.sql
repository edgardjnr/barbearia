-- Create a policy to allow anonymous users to insert reviews
-- This is needed for the public review form to work without authentication
CREATE POLICY "Allow anonymous review creation" 
ON public.reviews 
FOR INSERT 
WITH CHECK (true);

-- Also allow anonymous users to read reviews (for displaying on public pages)
CREATE POLICY "Allow public read access to reviews" 
ON public.reviews 
FOR SELECT 
USING (true);