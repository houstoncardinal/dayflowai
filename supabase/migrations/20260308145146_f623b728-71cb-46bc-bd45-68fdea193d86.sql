
-- Replace overly permissive booking insert policies with more specific ones
DROP POLICY "Anyone can create bookings" ON public.bookings;
DROP POLICY "Authenticated can create bookings" ON public.bookings;

-- Allow anon bookings but only for active scheduling links
CREATE POLICY "Anyone can book active links" ON public.bookings FOR INSERT TO anon
  WITH CHECK (scheduling_link_id IN (SELECT id FROM public.scheduling_links WHERE is_active = true));
CREATE POLICY "Authenticated can book active links" ON public.bookings FOR INSERT TO authenticated
  WITH CHECK (scheduling_link_id IN (SELECT id FROM public.scheduling_links WHERE is_active = true));
