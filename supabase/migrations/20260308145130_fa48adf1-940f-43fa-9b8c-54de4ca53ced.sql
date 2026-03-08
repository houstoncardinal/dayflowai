
-- Teams table
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  owner_id uuid NOT NULL,
  plan text NOT NULL DEFAULT 'free',
  max_seats integer DEFAULT 1,
  logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Team members
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  invited_email text,
  invite_status text DEFAULT 'accepted',
  created_at timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Team shared calendars
CREATE TABLE public.shared_calendars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text DEFAULT 'teal',
  visibility text DEFAULT 'team',
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Scheduling links
CREATE TABLE public.scheduling_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  slug text UNIQUE NOT NULL,
  title text NOT NULL DEFAULT 'Book a Meeting',
  description text,
  duration_minutes integer NOT NULL DEFAULT 30,
  color text DEFAULT 'teal',
  availability jsonb DEFAULT '{"monday":{"start":"09:00","end":"17:00"},"tuesday":{"start":"09:00","end":"17:00"},"wednesday":{"start":"09:00","end":"17:00"},"thursday":{"start":"09:00","end":"17:00"},"friday":{"start":"09:00","end":"17:00"}}'::jsonb,
  buffer_minutes integer DEFAULT 15,
  max_bookings_per_day integer DEFAULT 8,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Bookings from scheduling links
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduling_link_id uuid REFERENCES public.scheduling_links(id) ON DELETE CASCADE NOT NULL,
  host_user_id uuid NOT NULL,
  guest_name text NOT NULL,
  guest_email text NOT NULL,
  booking_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  notes text,
  status text DEFAULT 'confirmed',
  created_at timestamptz DEFAULT now()
);

-- Meeting intelligence
CREATE TABLE public.meeting_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  ai_summary text,
  ai_action_items jsonb DEFAULT '[]'::jsonb,
  ai_agenda jsonb DEFAULT '[]'::jsonb,
  ai_follow_up_draft text,
  manual_notes text,
  generated_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- API keys for developer tier
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_hash text NOT NULL,
  key_prefix text NOT NULL,
  scopes text[] DEFAULT ARRAY['read:events'],
  last_used_at timestamptz,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Webhooks
CREATE TABLE public.webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  url text NOT NULL,
  events text[] DEFAULT ARRAY['event.created', 'event.updated', 'event.deleted'],
  secret text NOT NULL,
  is_active boolean DEFAULT true,
  last_triggered_at timestamptz,
  failure_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- User subscription/plan tracking
CREATE TABLE public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  plan text NOT NULL DEFAULT 'free',
  status text DEFAULT 'active',
  current_period_start timestamptz DEFAULT now(),
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS policies
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduling_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their teams" ON public.teams FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can create teams" ON public.teams FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners can update teams" ON public.teams FOR UPDATE TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Owners can delete teams" ON public.teams FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE POLICY "Team members can view members" ON public.team_members FOR SELECT TO authenticated
  USING (team_id IN (SELECT id FROM public.teams WHERE owner_id = auth.uid()) OR team_id IN (SELECT team_id FROM public.team_members AS tm WHERE tm.user_id = auth.uid()));
CREATE POLICY "Admins can manage members" ON public.team_members FOR INSERT TO authenticated
  WITH CHECK (team_id IN (SELECT id FROM public.teams WHERE owner_id = auth.uid()) OR team_id IN (SELECT team_id FROM public.team_members AS tm WHERE tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin')));
CREATE POLICY "Admins can update members" ON public.team_members FOR UPDATE TO authenticated
  USING (team_id IN (SELECT id FROM public.teams WHERE owner_id = auth.uid()) OR team_id IN (SELECT team_id FROM public.team_members AS tm WHERE tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin')));
CREATE POLICY "Admins can remove members" ON public.team_members FOR DELETE TO authenticated
  USING (team_id IN (SELECT id FROM public.teams WHERE owner_id = auth.uid()) OR user_id = auth.uid());

CREATE POLICY "Team members can view shared calendars" ON public.shared_calendars FOR SELECT TO authenticated
  USING (team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()));
CREATE POLICY "Admins can create shared calendars" ON public.shared_calendars FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "Admins can update shared calendars" ON public.shared_calendars FOR UPDATE TO authenticated
  USING (created_by = auth.uid());
CREATE POLICY "Admins can delete shared calendars" ON public.shared_calendars FOR DELETE TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can manage their scheduling links" ON public.scheduling_links FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Anyone can view active scheduling links" ON public.scheduling_links FOR SELECT TO anon
  USING (is_active = true);

CREATE POLICY "Hosts can view bookings" ON public.bookings FOR SELECT TO authenticated
  USING (host_user_id = auth.uid());
CREATE POLICY "Anyone can create bookings" ON public.bookings FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Authenticated can create bookings" ON public.bookings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Hosts can update bookings" ON public.bookings FOR UPDATE TO authenticated
  USING (host_user_id = auth.uid());

CREATE POLICY "Users can manage their meeting notes" ON public.meeting_notes FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage their API keys" ON public.api_keys FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage their webhooks" ON public.webhooks FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their subscription" ON public.user_subscriptions FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users can create their subscription" ON public.user_subscriptions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their subscription" ON public.user_subscriptions FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
