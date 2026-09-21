/*
# Guest reviews + automatic booking completion

Two things, both in service of "keep every guest's records, and let
them review their stay like Airbnb":

1. A public.reviews table, one row per booking, guest-authored,
   publicly readable (unless an admin hides one), so the site can show
   real social proof — see ReviewsSection.jsx.

2. Since nothing previously ever marked a booking `completed` (it sat
   at `confirmed` forever), there was no clean moment to ask for a
   review. A daily cron job now flips `confirmed` -> `completed` once
   check_out has passed, and a trigger on that transition emails the
   guest asking for a review — same trigger-fires-an-async-HTTP-call
   pattern as every other notification in this project (see
   supabase/functions/notify-enquiry/index.ts, which gets a new
   "review_request" type alongside this).

Fully self-contained and safe to re-run.

1. Changes
   - Creates public.reviews: booking_id (unique — one review per
     stay), guest_id, guest_name, apartment, rating (1-5), comment,
     is_public (default true, an admin can hide a review without
     deleting it), created_at.
   - RLS: anyone can read public reviews; a guest can read/insert/
     update their OWN review (insert only for a booking that's really
     theirs, already confirmed/completed, and already checked out —
     enforced in the INSERT policy itself, not just trusted from the
     client); owner/manager admins can read all and update
     (moderate) any.
   - Adds a daily cron job (06:00 UTC) that marks `confirmed` bookings
     `completed` once their check_out date has passed.
   - Adds public.notify_review_request(), an AFTER UPDATE trigger on
     bookings mirroring notify_enquiry_declined.sql's pattern: fires
     only when status transitions TO 'completed'.

2. Notes
   - Requires notify-enquiry to be redeployed with the "review_request"
     type handled (see supabase/functions/notify-enquiry/index.ts) —
     shares the existing RESEND_API_KEY/WEBHOOK_SECRET, no new secrets.
   - A guest can still leave a review the moment they've checked out
     even if the daily cron hasn't run yet — the INSERT policy checks
     check_out <= CURRENT_DATE directly, not the cron-maintained
     status, so there's no up-to-24h dead window.
*/

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  guest_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_name text NOT NULL,
  apartment text NOT NULL CHECK (apartment IN ('home-office', 'livingspring')),
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reviews_apartment_idx ON public.reviews(apartment);
CREATE INDEX IF NOT EXISTS reviews_public_idx ON public.reviews(is_public);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_select_public" ON public.reviews;
CREATE POLICY "reviews_select_public" ON public.reviews
  FOR SELECT TO anon, authenticated
  USING (is_public = true);

DROP POLICY IF EXISTS "reviews_select_own" ON public.reviews;
CREATE POLICY "reviews_select_own" ON public.reviews
  FOR SELECT TO authenticated
  USING (guest_id = auth.uid());

DROP POLICY IF EXISTS "reviews_admin_select_all" ON public.reviews;
CREATE POLICY "reviews_admin_select_all" ON public.reviews
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('owner', 'manager'));

-- A guest may only review a booking that is really theirs, already
-- past check-out, and not cancelled — checked against the live
-- bookings row, not trusted from whatever the client sends.
DROP POLICY IF EXISTS "reviews_insert_own" ON public.reviews;
CREATE POLICY "reviews_insert_own" ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    guest_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = reviews.booking_id
        AND b.guest_id = auth.uid()
        AND b.status IN ('confirmed', 'completed')
        AND b.check_out <= CURRENT_DATE
    )
  );

DROP POLICY IF EXISTS "reviews_update_own" ON public.reviews;
CREATE POLICY "reviews_update_own" ON public.reviews
  FOR UPDATE TO authenticated
  USING (guest_id = auth.uid())
  WITH CHECK (guest_id = auth.uid());

DROP POLICY IF EXISTS "reviews_admin_update" ON public.reviews;
CREATE POLICY "reviews_admin_update" ON public.reviews
  FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('owner', 'manager'))
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('owner', 'manager'));

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Nothing previously ever set a booking to 'completed' — it sat at
-- 'confirmed' forever. This is also what creates the moment to ask
-- for a review (see the trigger below).
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'complete-past-bookings';
SELECT cron.schedule(
  'complete-past-bookings',
  '0 6 * * *',
  $$
  UPDATE public.bookings
  SET status = 'completed'
  WHERE status = 'confirmed' AND check_out <= CURRENT_DATE;
  $$
);

CREATE OR REPLACE FUNCTION public.notify_review_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  secret text;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    SELECT decrypted_secret INTO secret
    FROM vault.decrypted_secrets
    WHERE name = 'enquiry_webhook_secret';

    PERFORM net.http_post(
      url := 'https://qjgnfzkgvmjjwvhmcply.supabase.co/functions/v1/notify-enquiry',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-webhook-secret', secret
      ),
      body := jsonb_build_object('type', 'review_request', 'record', to_jsonb(NEW))
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_notify_on_complete ON public.bookings;
CREATE TRIGGER bookings_notify_on_complete
  AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_review_request();

REVOKE EXECUTE ON FUNCTION public.notify_review_request() FROM PUBLIC, anon, authenticated;
