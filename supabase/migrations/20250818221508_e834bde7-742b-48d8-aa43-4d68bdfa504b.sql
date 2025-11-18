-- Allow public access to basic organization info for booking and review pages
CREATE POLICY "Public can view basic organization info" 
ON public.organizations 
FOR SELECT 
USING (true);

-- Also need to allow public access to services for booking pages
CREATE POLICY "Public can view organization services" 
ON public.services 
FOR SELECT 
USING (true);

-- Allow public access to member info for booking (professionals selection)
CREATE POLICY "Public can view organization members for booking" 
ON public.organization_members 
FOR SELECT 
USING (true);

-- Allow public access to working hours for booking availability
CREATE POLICY "Public can view working hours for booking" 
ON public.working_hours 
FOR SELECT 
USING (true);