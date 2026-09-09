/*
# Create bookings table

Phase 2 of the direct-booking rollout: turns a confirmed enquiry into
a real booking. This is what the guest dashboard's Bookings/Overview
pages and the admin Bookings page read from — they've been showing
mock data until now because there was nothing real to show.

Booking creation only ever happens from the admin panel (an admin
turns an enquiry into a booking after agreeing dates/price with the
guest by phone/message/mobile-money, per the "enquiry + manual
confirm" model — no on-site payment). Guests never write bookings
directly; they only read their own.

This migration is fully self-contained, like the others in this repo
— it does not assume any earlier migration ran, and every statement
is guarded so it's safe to re-run.

1. New Table
   - `bookings`: one row per confirmed stay. `guest_id` is nullable —
     it's set only when the enquirer's email matches an existing
     signed-up account at confirm time, so the booking shows up in
     their guest dashboard. A guest who booked without an account
     simply won't see it there (they still get emailed/handed a
     receipt) — there's no retroactive linking yet.
   - `nights` is a generated column (check_out - check_in) so it's
     never out of sync with the dates.
   - `enquiries.booking_id` is added so an enquiry can be marked as
     "turned into a booking" without touching its own status enum.

2. Security
   - Row Level Security is enabled.
   - Guests can read only their own bookings (guest_id = auth.uid()).
   - Only owner/manager admins can read all bookings, insert, update,
     or delete — same role check used everywhere else in the admin
     panel.

3. Notes
   - Run this in the Supabase SQL Editor for this project — migrations
     in this repo aren't auto-applied by CI.
   - Unlike the other migrations in this repo, this one is NOT
     order-independent: it references public.enquiries (both via
     bookings.enquiry_id and by adding enquiries.booking_id), so
     20260909140000_create_enquiries.sql must already have been run
     first.
*/

CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  enquiry_id uuid REFERENCES public.enquiries(id) ON DELETE SET NULL,
  guest_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_name text NOT NULL,
  guest_email text NOT NULL,
  guest_phone text,
  check_in date NOT NULL,
  check_out date NOT NULL,
  nights integer GENERATED ALWAYS AS (check_out - check_in) STORED,
  guests integer NOT NULL DEFAULT 1 CHECK (guests > 0),
  total numeric(10,2) NOT NULL CHECK (total >= 0),
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (check_out > check_in)
);

CREATE INDEX IF NOT EXISTS bookings_guest_id_idx ON public.bookings(guest_id);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON public.bookings(status);
CREATE INDEX IF NOT EXISTS bookings_check_in_idx ON public.bookings(check_in);

ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL;

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bookings_guest_select_own" ON public.bookings;
CREATE POLICY "bookings_guest_select_own" ON public.bookings
  FOR SELECT TO authenticated
  USING (guest_id = auth.uid());

DROP POLICY IF EXISTS "bookings_admin_select" ON public.bookings;
CREATE POLICY "bookings_admin_select" ON public.bookings
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('owner', 'manager'));

DROP POLICY IF EXISTS "bookings_admin_insert" ON public.bookings;
CREATE POLICY "bookings_admin_insert" ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('owner', 'manager'));

DROP POLICY IF EXISTS "bookings_admin_update" ON public.bookings;
CREATE POLICY "bookings_admin_update" ON public.bookings
  FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('owner', 'manager'))
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('owner', 'manager'));

DROP POLICY IF EXISTS "bookings_admin_delete" ON public.bookings;
CREATE POLICY "bookings_admin_delete" ON public.bookings
  FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('owner', 'manager'));

-- Enable realtime so both the guest and admin dashboards update live,
-- same as messages and enquiries already do. Guarded so this
-- migration can be re-run even if the table is already in the
-- publication.
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
