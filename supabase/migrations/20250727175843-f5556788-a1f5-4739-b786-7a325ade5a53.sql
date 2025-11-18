-- Create table for working hours
CREATE TABLE public.working_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  member_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, member_id, day_of_week)
);

-- Enable Row Level Security
ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;

-- Create policies for working hours
CREATE POLICY "Organization members can manage working hours" 
ON public.working_hours 
FOR ALL 
USING (organization_id = get_user_organization_id());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_working_hours_updated_at
BEFORE UPDATE ON public.working_hours
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();