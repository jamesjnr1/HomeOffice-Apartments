/*
# Create enquiries table

Phase 1 of turning the direct-booking flow real: the public enquiry
form (Book.jsx) currently only emails the owner via Formspree — nothing
is persisted, so the admin "Enquiries" inbox has always shown fake mock
data. This migration adds a real table so submissions are stored and
the admin panel can show, reply to, and track them for real.

This migration is fully self-contained, like the other migrations in
this repo — it does not assume any earlier migration ran, and every
statement is guarded so it's safe to re-run.

1. New Table
   - `enquiries`: one row per booking enquiry submitted through the
     site. No `guest_id` — enquiries are submitted by anonymous site
     visitors before they've necessarily signed up, so there's nothing
     to tie them to a user account.

2. Security
   - Row Level Security is enabled.
   - Anyone (including anonymous visitors) can INSERT an enquiry —
     that's the public booking form.
   - Only admins/managers (the same `user_metadata.role` check used
     for `profiles` and the admin panel elsewhere) can read, update
     (mark replied/archived), or delete enquiries. Guests can't read
     back enquiries, including their own — there's no guest-facing
     "my enquiries" view, only the guest dashboard's bookings page
     once an enquiry becomes a confirmed booking.

3. Notes
   - Run this in the Supabase SQL Editor for this project — migrations
     in this repo aren't auto-applied by CI.
*/

CREATE TABLE IF NOT EXISTS public.enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  check_in date NOT NULL,
  check_out date NOT NULL,
  guests integer NOT NULL DEFAULT 1 CHECK (guests > 0),
  message text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'replied', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (check_out > check_in)
);

CREATE INDEX IF NOT EXISTS enquiries_status_idx ON public.enquiries(status);
CREATE INDEX IF NOT EXISTS enquiries_created_at_idx ON public.enquiries(created_at);

ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "enquiries_public_insert" ON public.enquiries;
CREATE POLICY "enquiries_public_insert" ON public.enquiries
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "enquiries_admin_select" ON public.enquiries;
CREATE POLICY "enquiries_admin_select" ON public.enquiries
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('owner', 'manager'));

DROP POLICY IF EXISTS "enquiries_admin_update" ON public.enquiries;
CREATE POLICY "enquiries_admin_update" ON public.enquiries
  FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('owner', 'manager'))
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('owner', 'manager'));

DROP POLICY IF EXISTS "enquiries_admin_delete" ON public.enquiries;
CREATE POLICY "enquiries_admin_delete" ON public.enquiries
  FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('owner', 'manager'));

-- Enable realtime so the admin inbox updates live when a new enquiry
-- comes in, the same way admin Messages already does. Guarded so this
-- migration can be re-run even if the table is already in the
-- publication.
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.enquiries;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
