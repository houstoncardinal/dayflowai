
-- Event messages: AI chat thread per event
CREATE TABLE public.event_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.event_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their event messages"
  ON public.event_messages FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Event deliverables: AI-generated assets stored per event
CREATE TABLE public.event_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'document',
  content TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  agent_type TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('generating', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.event_deliverables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their event deliverables"
  ON public.event_deliverables FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER handle_event_deliverables_updated_at
  BEFORE UPDATE ON public.event_deliverables
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_messages;
