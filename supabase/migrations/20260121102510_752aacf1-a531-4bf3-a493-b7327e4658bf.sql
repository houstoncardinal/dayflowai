-- Add recurrence fields to events table
ALTER TABLE public.events 
ADD COLUMN recurrence_rule text,
ADD COLUMN recurrence_end_date date,
ADD COLUMN parent_event_id uuid REFERENCES public.events(id) ON DELETE CASCADE;

-- Add index for parent event lookups
CREATE INDEX idx_events_parent_id ON public.events(parent_event_id);

-- Create table to track analytics
CREATE TABLE public.analytics_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on analytics_tracking
ALTER TABLE public.analytics_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies for analytics_tracking
CREATE POLICY "Users can insert their own analytics" 
ON public.analytics_tracking 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own analytics" 
ON public.analytics_tracking 
FOR SELECT 
USING (auth.uid() = user_id);

-- Add notification preferences to profiles
ALTER TABLE public.profiles 
ADD COLUMN notification_enabled boolean DEFAULT true,
ADD COLUMN notification_minutes_before integer DEFAULT 15;