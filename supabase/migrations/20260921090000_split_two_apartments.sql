/*
# Split availability, bookings, and enquiries by apartment

Home-Office Apartments and LivingSpring Gardens & Apartment turn out to
be two SEPARATE, independently-bookable units in the same building —
not one apartment double-listed on Airbnb, as an earlier migration
(20260920200000_airbnb_calendar_sync.sql) assumed. That assumption
meant a reservation on either Airbnb listing, or a booking for either
unit, incorrectly blocked the OTHER unit's dates too.

This migration adds an `apartment` column ('home-office' or
'livingspring') to both `enquiries` and `bookings`, and re-scopes every
overlap/availability check by it:
  - The no-double-booking EXCLUDE constraint on `bookings` now only
    rejects an overlap within the SAME apartment.
  - is_date_range_available() takes a third `apartment` argument and
    only checks that apartment's own bookings and its own Airbnb feed
    (source 'airbnb' = home-office, 'airbnb-2' = livingspring — the
    mapping already established when the second listing's sync was
    added).

Backfill: the one existing confirmed booking (HO-2JLBY) and both
existing enquiries predate this distinction, so there's no reliable
way to know which unit they were actually for. Defaulted to
'home-office' per the property owner's explicit call — genuinely
"doesn't matter" for a historical record, correctable by hand in the
admin dashboard if it turns out to matter later.

Fully self-contained and safe to re-run.

1. Changes
   - Enables btree_gist (needed for an equality term inside a GiST
     EXCLUDE constraint).
   - Adds enquiries.apartment (nullable — historical rows may not have
     one; every new Book.jsx submission always sets it).
   - Adds bookings.apartment (NOT NULL, default 'home-office' — so an
     admin confirming an old, apartment-less enquiry never hits a
     constraint violation; every new confirm explicitly passes the
     enquiry's own choice, so the default is a backfill/fallback only,
     not the intended long-term behavior).
   - Replaces the EXCLUDE constraint on bookings to also require a
     matching apartment before two ranges count as overlapping.
   - Drops the old 2-arg is_date_range_available(date, date) and
     replaces it with a 3-arg version taking apartment.

2. Notes
   - Depends on 20260909150000_create_bookings.sql,
     20260910100100_prevent_overlapping_bookings.sql, and
     20260920200000_airbnb_calendar_sync.sql.
   - Run this in the Supabase SQL Editor for this project — migrations
     in this repo aren't auto-applied by CI.
*/

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE public.enquiries
  ADD COLUMN IF NOT EXISTS apartment text
  CHECK (apartment IS NULL OR apartment IN ('home-office', 'livingspring'));

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS apartment text
  CHECK (apartment IN ('home-office', 'livingspring'));

UPDATE public.bookings SET apartment = 'home-office' WHERE apartment IS NULL;

ALTER TABLE public.bookings ALTER COLUMN apartment SET NOT NULL;
ALTER TABLE public.bookings ALTER COLUMN apartment SET DEFAULT 'home-office';

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_no_date_overlap;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_no_date_overlap
  EXCLUDE USING gist (apartment WITH =, daterange(check_in, check_out, '[)') WITH &&)
  WHERE (status <> 'cancelled');

DROP FUNCTION IF EXISTS public.is_date_range_available(date, date);

CREATE FUNCTION public.is_date_range_available(check_in date, check_out date, apartment text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.status <> 'cancelled'
      AND b.apartment = is_date_range_available.apartment
      AND daterange(b.check_in, b.check_out, '[)') && daterange(is_date_range_available.check_in, is_date_range_available.check_out, '[)')
  ) AND NOT EXISTS (
    SELECT 1 FROM public.external_calendar_blocks x
    WHERE x.source = (CASE is_date_range_available.apartment
                         WHEN 'home-office' THEN 'airbnb'
                         WHEN 'livingspring' THEN 'airbnb-2'
                       END)
      AND daterange(x.start_date, x.end_date, '[)') && daterange(is_date_range_available.check_in, is_date_range_available.check_out, '[)')
  );
$function$;

GRANT EXECUTE ON FUNCTION public.is_date_range_available(date, date, text) TO anon, authenticated;
