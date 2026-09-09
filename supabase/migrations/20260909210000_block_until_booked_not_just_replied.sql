/*
# Tighten the duplicate-enquiry block: released by a booking, not a status click

The previous version (20260909200000) released the block as soon as
an enquiry's status left 'new' — including a quick "Mark replied"
click in the admin inbox that doesn't actually require having
replied. In practice that meant the guard was too easy to release by
accident: mark one enquiry replied while triaging the inbox, and that
guest could immediately submit another.

This version changes the release condition from "status != 'new'" to
"this enquiry hasn't become a real booking yet" — i.e. it blocks a
resubmission for as long as enquiries.booking_id IS NULL, regardless
of whether the status is 'new', 'replied', or 'archived'. Only
confirming it into a booking (see AdminEnquiries.jsx's "Confirm
booking" action) releases it early. The 3-day self-expiry from the
last migration is kept as-is — it's the safety net for a genuinely
missed enquiry, and this change doesn't touch it.

This migration is fully self-contained like the others in this repo
— safe to re-run (CREATE OR REPLACE FUNCTION).

1. Changes
   - public.check_duplicate_open_enquiry() (the BEFORE INSERT trigger
     function) and public.has_open_enquiry() (the client-facing RPC)
     both switch their condition from `status = 'new'` to
     `booking_id IS NULL`, keeping the same `created_at > now() -
     interval '3 days'` window.
   - No change to the trigger/RPC definitions themselves — same names,
     same signatures — so nothing else needs to change.

2. Notes
   - Run this in the Supabase SQL Editor for this project — migrations
     in this repo aren't auto-applied by CI.
   - Depends on 20260909200000_self_expiring_enquiry_block.sql having
     run first (creates the functions this one replaces).
*/

CREATE OR REPLACE FUNCTION public.check_duplicate_open_enquiry()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.enquiries
    WHERE lower(trim(email)) = lower(trim(NEW.email))
      AND booking_id IS NULL
      AND created_at > now() - interval '3 days'
  ) THEN
    RAISE EXCEPTION 'DUPLICATE_OPEN_ENQUIRY';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_open_enquiry(check_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.enquiries
    WHERE lower(trim(email)) = lower(trim(check_email))
      AND booking_id IS NULL
      AND created_at > now() - interval '3 days'
  );
$$;
