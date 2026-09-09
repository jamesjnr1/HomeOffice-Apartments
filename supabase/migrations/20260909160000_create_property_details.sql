/*
# Create property_details table

Phase 3 of the direct-booking rollout: once a guest has a confirmed
stay, the dashboard should show them the practical stuff — WiFi
password, check-in/out times, how to get in, house rules — instead of
none of that existing anywhere. Filled in once by the admin in
Settings, read by any guest with a qualifying booking.

This migration is fully self-contained like the others in this repo
— every statement is guarded so it's safe to re-run. Unlike bookings,
it doesn't depend on any other migration having run (its guest-facing
RLS policy references public.bookings, which is checked at query time,
not at migration time, so table creation order between this and
bookings.sql doesn't matter).

1. New Table
   - `property_details`: a singleton table — exactly one row, fixed id
     'home-office', matching the single-property scope of this whole
     site. Seeded with one placeholder row so the admin form always
     has something to load and update, never insert.

2. Security
   - Row Level Security is enabled.
   - Only owner/manager admins can update it.
   - A guest can read it only if they have at least one booking that
     is 'confirmed' or 'completed' (not 'pending', not 'cancelled') —
     so check-in details aren't visible to someone who merely signed
     up without ever booking.
   - Admins can also read it (needed to populate the edit form).

3. Notes
   - Run this in the Supabase SQL Editor for this project — migrations
     in this repo aren't auto-applied by CI.
*/

CREATE TABLE IF NOT EXISTS public.property_details (
  id text PRIMARY KEY DEFAULT 'home-office',
  wifi_network text NOT NULL DEFAULT '',
  wifi_password text NOT NULL DEFAULT '',
  check_in_time text NOT NULL DEFAULT 'After 2:00 PM',
  check_out_time text NOT NULL DEFAULT 'Before 11:00 AM',
  access_instructions text NOT NULL DEFAULT '',
  house_rules text NOT NULL DEFAULT '',
  host_notes text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.property_details (id)
VALUES ('home-office')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.property_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "property_details_admin_select" ON public.property_details;
CREATE POLICY "property_details_admin_select" ON public.property_details
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('owner', 'manager'));

DROP POLICY IF EXISTS "property_details_admin_update" ON public.property_details;
CREATE POLICY "property_details_admin_update" ON public.property_details
  FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('owner', 'manager'))
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('owner', 'manager'));

DROP POLICY IF EXISTS "property_details_guest_select" ON public.property_details;
CREATE POLICY "property_details_guest_select" ON public.property_details
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.guest_id = auth.uid()
        AND bookings.status IN ('confirmed', 'completed')
    )
  );

-- Enable realtime so an admin edit (e.g. a changed WiFi password)
-- reaches an already-open guest dashboard without a refresh, same as
-- messages/enquiries/bookings.
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.property_details;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
