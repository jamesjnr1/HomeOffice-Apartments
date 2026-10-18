/*
# Booking.com calendars block availability too

The calendar sync now also pulls Booking.com's iCal export feeds into
external_calendar_blocks, tagged source 'booking' (Home-Office
Apartment) and 'booking-2' (LivingSpring Gardens & Apartment) — same
pattern as Airbnb's 'airbnb' / 'airbnb-2'.

1. Changes
   - is_date_range_available(): an apartment is unavailable if ANY of
     its channels' feeds has a block overlapping the dates (Airbnb or
     Booking.com), not just its Airbnb feed. Same signature, same
     grants, so callers (Book page, book-and-pay, paystack-init) are
     unchanged.

2. Notes
   - Safe to re-run.
*/

CREATE OR REPLACE FUNCTION public.is_date_range_available(check_in date, check_out date, apartment text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.apartment = is_date_range_available.apartment
      AND b.status NOT IN ('cancelled', 'awaiting_payment')
      AND daterange(b.check_in, b.check_out, '[)') && daterange(is_date_range_available.check_in, is_date_range_available.check_out, '[)')
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.external_calendar_blocks x
    WHERE x.source = ANY (CASE is_date_range_available.apartment
            WHEN 'home-office' THEN ARRAY['airbnb', 'booking']
            WHEN 'livingspring' THEN ARRAY['airbnb-2', 'booking-2']
          END)
      AND daterange(x.start_date, x.end_date, '[)') && daterange(is_date_range_available.check_in, is_date_range_available.check_out, '[)')
  );
$function$;

GRANT EXECUTE ON FUNCTION public.is_date_range_available(date, date, text) TO anon, authenticated;
