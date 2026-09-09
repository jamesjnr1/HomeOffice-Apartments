/*
# Guarantee no two bookings can ever overlap + a public availability check

Nothing in the schema stopped two confirmed bookings from covering the
same dates — an admin could "Confirm booking" on an enquiry that
overlapped an existing reservation with no warning at all beyond
whatever they happened to notice by eye in the inbox. This adds a real
database guarantee, not just a UI hint (the UI hint is added
separately in AdminEnquiries.jsx, but that's advisory only — this is
the actual backstop).

Also adds public.is_date_range_available(check_in, check_out) — a
narrow, privacy-safe RPC (same shape as has_open_enquiry: returns only
a boolean, never booking details) so the public Book form can warn a
guest their requested dates might already be taken before they even
submit, without exposing who's staying when.

Fully self-contained and safe to re-run.

1. Changes
   - Adds an EXCLUDE constraint on public.bookings: no two rows with
     status <> 'cancelled' may have overlapping [check_in, check_out)
     date ranges. A 'confirmed' and a 'cancelled' booking (or two
     cancelled ones) CAN overlap — a cancellation should never block
     someone else from being confirmed into those same dates.
   - Adds public.is_date_range_available(check_in date, check_out
     date) RETURNS boolean, SECURITY DEFINER, granted to anon and
     authenticated.

2. Notes
   - Depends on 20260909150000_create_bookings.sql.
   - If this fails to apply because existing rows already overlap,
     those rows need to be resolved (e.g. cancel the incorrect one)
     before the constraint can be added — safe to re-run once they are.
*/

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_no_date_overlap;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_no_date_overlap
  EXCLUDE USING gist (daterange(check_in, check_out, '[)') WITH &&)
  WHERE (status <> 'cancelled');

CREATE OR REPLACE FUNCTION public.is_date_range_available(check_in date, check_out date)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.status <> 'cancelled'
      AND daterange(b.check_in, b.check_out, '[)') && daterange(is_date_range_available.check_in, is_date_range_available.check_out, '[)')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_date_range_available(date, date) TO anon, authenticated;
