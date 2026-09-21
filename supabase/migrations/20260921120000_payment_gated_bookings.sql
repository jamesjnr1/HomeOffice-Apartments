/*
# Payment-gated bookings: Paystack integration, phase 1 (schema)

Until now "Confirm booking" in AdminEnquiries.jsx immediately created a
`confirmed` booking — no on-site payment, the admin just took the
guest's word (or a direct mobile-money transfer) that it was settled.
Paystack is now approved, so a booking should sit as `awaiting_payment`
until a real, verified payment comes in — see
supabase/functions/paystack-init and supabase/functions/paystack-webhook
for the two new edge functions that create the checkout link and
confirm it, respectively.

Per the agreed design: a full payment upfront (no deposit), and an
awaiting-payment booking does NOT block the calendar or export to
Airbnb — only a `confirmed` (or `completed`/legacy `pending`) booking
does. This means, in the rare case two guests are sent payment links
for the same dates, whoever pays first wins the dates; the loser's
webhook-confirm step never runs since their booking never reaches
`confirmed`. That's an accepted tradeoff of not holding dates during
an unpaid checkout session, not a bug.

Fully self-contained and safe to re-run (guarded drops/recreates
throughout), except for the exclusion-constraint recreation, which is
also safe to re-run.

1. Changes
   - Adds `awaiting_payment` to bookings.status's allowed values.
   - Adds `paystack_reference` (the reference sent to Paystack's
     Initialize Transaction API — regenerated fresh each time a
     payment link is (re)sent, since Paystack rejects reused
     references), `payment_url` (the checkout link), and `paid_at` to
     `bookings`.
   - Re-creates bookings_no_date_overlap so `awaiting_payment` rows no
     longer count toward the overlap check (same apartment-scoped
     shape from 20260921090000_split_two_apartments.sql, just the
     WHERE clause changed).
   - Re-creates is_date_range_available(check_in, check_out, apartment)
     with the same awaiting_payment exclusion, so the public Book form's
     availability heads-up matches what actually blocks a date.
   - Re-defines notify_booking_confirmed() to fire only when a row's
     status IS 'confirmed' — either on INSERT (a directly-confirmed
     booking, e.g. a manual/cash override) or on UPDATE where it
     transitions TO 'confirmed' (the normal Paystack-webhook path, or
     admin's "Mark as paid" manual override) — instead of
     unconditionally on every insert like before.
   - Adds notify_payment_requested(), an AFTER UPDATE trigger that
     fires the moment `payment_url` is set (transitions from NULL to a
     value) — see the new "payment_requested" email type in
     supabase/functions/notify-enquiry/index.ts.

2. Notes
   - Depends on 20260921090000_split_two_apartments.sql (apartment
     column + scoped exclusion constraint) and
     20260921100000_notify_booking_confirmed.sql (the trigger function
     this redefines) already being applied.
   - Requires supabase/functions/paystack-init and
     supabase/functions/paystack-webhook to be deployed, and
     notify-enquiry redeployed with the "payment_requested" type, for
     the full flow to work — see those files.
   - Requires a PAYSTACK_SECRET_KEY secret (Project Settings -> Edge
     Functions -> Secrets) — only settable via the Supabase Dashboard,
     not by anything running here.
*/

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS paystack_reference text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_url text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS paid_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS bookings_paystack_reference_idx
  ON public.bookings(paystack_reference) WHERE paystack_reference IS NOT NULL;

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('pending', 'awaiting_payment', 'confirmed', 'completed', 'cancelled'));

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_no_date_overlap;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_no_date_overlap
  EXCLUDE USING gist (apartment WITH =, daterange(check_in, check_out, '[)') WITH &&)
  WHERE (status NOT IN ('cancelled', 'awaiting_payment'));

CREATE OR REPLACE FUNCTION public.is_date_range_available(check_in date, check_out date, apartment text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.apartment = is_date_range_available.apartment
      AND b.status NOT IN ('cancelled', 'awaiting_payment')
      AND daterange(b.check_in, b.check_out, '[)') && daterange(is_date_range_available.check_in, is_date_range_available.check_out, '[)')
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.external_calendar_blocks x
    WHERE x.source = (CASE is_date_range_available.apartment WHEN 'home-office' THEN 'airbnb' WHEN 'livingspring' THEN 'airbnb-2' END)
      AND daterange(x.start_date, x.end_date, '[)') && daterange(is_date_range_available.check_in, is_date_range_available.check_out, '[)')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_date_range_available(date, date, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.notify_booking_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  secret text;
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'confirmed')
     OR (TG_OP = 'UPDATE' AND NEW.status = 'confirmed' AND OLD.status IS DISTINCT FROM 'confirmed') THEN
    SELECT decrypted_secret INTO secret
    FROM vault.decrypted_secrets
    WHERE name = 'enquiry_webhook_secret';

    PERFORM net.http_post(
      url := 'https://qjgnfzkgvmjjwvhmcply.supabase.co/functions/v1/notify-enquiry',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-webhook-secret', secret
      ),
      body := jsonb_build_object('type', 'confirmed', 'record', to_jsonb(NEW))
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_notify_on_insert ON public.bookings;
CREATE TRIGGER bookings_notify_on_insert
  AFTER INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_booking_confirmed();

DROP TRIGGER IF EXISTS bookings_notify_on_confirm ON public.bookings;
CREATE TRIGGER bookings_notify_on_confirm
  AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_booking_confirmed();

REVOKE EXECUTE ON FUNCTION public.notify_booking_confirmed() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.notify_payment_requested()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  secret text;
BEGIN
  IF NEW.payment_url IS NOT NULL AND OLD.payment_url IS NULL THEN
    SELECT decrypted_secret INTO secret
    FROM vault.decrypted_secrets
    WHERE name = 'enquiry_webhook_secret';

    PERFORM net.http_post(
      url := 'https://qjgnfzkgvmjjwvhmcply.supabase.co/functions/v1/notify-enquiry',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-webhook-secret', secret
      ),
      body := jsonb_build_object('type', 'payment_requested', 'record', to_jsonb(NEW))
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_notify_on_payment_requested ON public.bookings;
CREATE TRIGGER bookings_notify_on_payment_requested
  AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_payment_requested();

REVOKE EXECUTE ON FUNCTION public.notify_payment_requested() FROM PUBLIC, anon, authenticated;
