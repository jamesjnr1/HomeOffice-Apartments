/*
# Self-expiring duplicate-enquiry block + a way to check it up front

The previous migration (20260909190000) blocked a second enquiry from
the same email for as long as the first stayed at status = 'new' —
with no time limit. That has a real failure mode: if an enquiry is
ever missed entirely (owner on a trip, notification lost), that guest
is locked out of ever enquiring again until someone notices and
manually marks the old one replied or archived. Worse, they wouldn't
know why — they'd just see a rejected form with no obvious fix.

This migration replaces the flat unique index with a trigger that only
blocks a resubmission while the earlier enquiry is BOTH unattended
(status = 'new') AND recent (created within the last 3 days). After
that window, the same email can submit again even if nobody ever
touched the old one — the old one is still sitting right there in the
admin inbox, now visibly overdue (see AdminEnquiries.jsx's "pending"
age indicator), so nothing is lost, the guest just isn't held hostage
to it.

Also adds a narrow RPC, has_open_enquiry(check_email), so the Book
form can tell a guest about their pending enquiry as soon as they
type their email — before they fill out and submit the whole form
only to be rejected at the end. It deliberately returns only a
boolean, never the enquiry's actual content, and is safe to expose to
anonymous visitors for that reason.

This migration is fully self-contained like the others in this repo
— safe to re-run.

1. Changes
   - Drops enquiries_one_open_per_email (the old, non-expiring index).
   - Adds a BEFORE INSERT trigger enforcing the 3-day-window version
     of the same rule, raising a distinguishable message
     ('DUPLICATE_OPEN_ENQUIRY') that the client matches on instead of
     relying on a specific SQLSTATE.
   - Adds public.has_open_enquiry(check_email text) — SECURITY DEFINER,
     callable by anon and authenticated, returns boolean only.

2. Notes
   - Run this in the Supabase SQL Editor for this project — migrations
     in this repo aren't auto-applied by CI.
   - Depends on 20260909140000_create_enquiries.sql (and supersedes
     the enforcement mechanism from 20260909190000, though that file
     is left as-is since it's already-applied history).
*/

DROP INDEX IF EXISTS public.enquiries_one_open_per_email;

CREATE OR REPLACE FUNCTION public.check_duplicate_open_enquiry()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.enquiries
    WHERE lower(trim(email)) = lower(trim(NEW.email))
      AND status = 'new'
      AND created_at > now() - interval '3 days'
  ) THEN
    RAISE EXCEPTION 'DUPLICATE_OPEN_ENQUIRY';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enquiries_check_duplicate ON public.enquiries;
CREATE TRIGGER enquiries_check_duplicate
  BEFORE INSERT ON public.enquiries
  FOR EACH ROW EXECUTE FUNCTION public.check_duplicate_open_enquiry();

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
      AND status = 'new'
      AND created_at > now() - interval '3 days'
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_open_enquiry(text) TO anon, authenticated;
