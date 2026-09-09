/*
# Decline an enquiry (e.g. dates already reserved) + let guests see it

Until now there was no way to formally decline an enquiry — an admin
could only mark it replied, archive it, or delete it — and no
availability check existed anywhere, so nothing stopped two enquiries
for overlapping dates both looking equally open in the inbox. Worse,
because the duplicate-enquiry guard only released on booking_id being
set (see 20260909210000), a guest whose enquiry turned out to conflict
with an existing reservation had no way to be told "no" and had no
way to try different dates for up to 3 days.

This migration:
1. Adds 'declined' as a real enquiry status, plus a decline_reason
   the admin can leave for the guest.
2. Updates the duplicate-enquiry guard (trigger + RPC from
   20260909210000/200000) so a declined enquiry releases the block
   immediately, same as a confirmed booking already does — otherwise
   declining someone would perversely trap them from enquiring again
   with different dates.
3. Lets a signed-in guest read their OWN enquiries (matched by email,
   the same way has_open_enquiry() already works) so a decline — or a
   still-pending enquiry — can show up on their dashboard, not just
   arrive by email.

Fully self-contained and safe to re-run, like the others in this repo.

1. Changes
   - enquiries_status_check now allows 'declined' alongside the
     existing new/replied/archived.
   - Adds enquiries.decline_reason (nullable text).
   - check_duplicate_open_enquiry() and has_open_enquiry() both add
     `AND status <> 'declined'` to their existing booking_id IS NULL /
     3-day-window condition.
   - New RLS policy enquiries_guest_select_own: authenticated users
     can SELECT rows where lower(trim(email)) matches their own JWT
     email claim.

2. Notes
   - Depends on 20260909140000_create_enquiries.sql and
     20260909210000_block_until_booked_not_just_replied.sql.
   - Run in the Supabase SQL Editor for this project — migrations here
     aren't auto-applied by CI.
*/

ALTER TABLE public.enquiries DROP CONSTRAINT IF EXISTS enquiries_status_check;
ALTER TABLE public.enquiries ADD CONSTRAINT enquiries_status_check
  CHECK (status IN ('new', 'replied', 'archived', 'declined'));

ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS decline_reason text;

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
      AND status <> 'declined'
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
      AND status <> 'declined'
      AND created_at > now() - interval '3 days'
  );
$$;

DROP POLICY IF EXISTS "enquiries_guest_select_own" ON public.enquiries;
CREATE POLICY "enquiries_guest_select_own" ON public.enquiries
  FOR SELECT TO authenticated
  USING (lower(trim(email)) = lower(trim(auth.jwt() ->> 'email')));
