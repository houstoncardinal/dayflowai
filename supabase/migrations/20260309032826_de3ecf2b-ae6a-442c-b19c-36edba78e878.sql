
-- Fix scheduling_links: make public SELECT permissive instead of restrictive
DROP POLICY IF EXISTS "Anyone can view active scheduling links" ON public.scheduling_links;
CREATE POLICY "Anyone can view active scheduling links"
ON public.scheduling_links
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Fix bookings: make anonymous INSERT permissive
DROP POLICY IF EXISTS "Anyone can book active links" ON public.bookings;
DROP POLICY IF EXISTS "Authenticated can book active links" ON public.bookings;
CREATE POLICY "Anyone can book active links"
ON public.bookings
FOR INSERT
TO anon, authenticated
WITH CHECK (scheduling_link_id IN (
  SELECT id FROM public.scheduling_links WHERE is_active = true
));
