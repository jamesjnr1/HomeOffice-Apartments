/*
# Airbnb calendar sync — two-way iCal

Adds the pieces needed to keep this site's availability in sync with
an Airbnb listing via the standard iCal export/import mechanism every
host uses to avoid double-bookings across channels:

  Airbnb -> this site: a scheduled job fetches the listing's iCal
  export feed and stores its busy date ranges in
  external_calendar_blocks. is_date_range_available() (already used
  by the Book page's proactive availability check) is extended to
  also treat those as unavailable, alongside this site's own
  `bookings` rows.

  This site -> Airbnb: a public read-only edge function
  (export-calendar) serves this site's confirmed bookings as an .ics
  feed. The host pastes that URL into Airbnb's "Import calendar"
  field so Airbnb blocks dates booked here.

1. New Table
   - `external_calendar_blocks`: one row per busy date range pulled
     from an external calendar (Airbnb today; `source` leaves room for
     more later). Keyed on (source, uid) so re-syncing upserts rather
     than duplicating, and a sync can tell which rows disappeared from
     the feed (e.g. a cancelled Airbnb reservation) and remove them.

2. Security
   - RLS enabled. Only admins (owner/manager) can read it directly —
     matches every other admin-only table here. Nothing INSERTs/
     UPDATEs/DELETEs it directly; the sync edge function uses the
     service-role key, which bypasses RLS.

3. Changes
   - is_date_range_available() now also excludes ranges overlapping an
     external_calendar_blocks row.

4. Notes
   - Run this in the Supabase SQL Editor for this project — migrations
     in this repo aren't auto-applied by CI.
   - Depends on 20260909150000_create_bookings.sql.
*/

CREATE TABLE IF NOT EXISTS public.external_calendar_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT 'airbnb',
  uid text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  summary text,
  synced_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date > start_date),
  UNIQUE (source, uid)
);

CREATE INDEX IF NOT EXISTS external_calendar_blocks_dates_idx
  ON public.external_calendar_blocks USING gist (daterange(start_date, end_date, '[)'));

ALTER TABLE public.external_calendar_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "external_calendar_blocks_admin_select" ON public.external_calendar_blocks;
CREATE POLICY "external_calendar_blocks_admin_select" ON public.external_calendar_blocks
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('owner', 'manager'));

CREATE OR REPLACE FUNCTION public.is_date_range_available(check_in date, check_out date)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.status <> 'cancelled'
      AND daterange(b.check_in, b.check_out, '[)') && daterange(is_date_range_available.check_in, is_date_range_available.check_out, '[)')
  ) AND NOT EXISTS (
    SELECT 1 FROM public.external_calendar_blocks x
    WHERE daterange(x.start_date, x.end_date, '[)') && daterange(is_date_range_available.check_in, is_date_range_available.check_out, '[)')
  );
$function$;
