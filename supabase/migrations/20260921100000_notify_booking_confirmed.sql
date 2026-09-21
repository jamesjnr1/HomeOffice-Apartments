/*
# Email the guest the moment their booking is confirmed

Mirrors 20260910100200_notify_enquiry_declined.sql's pattern exactly,
for the missing third direction: a guest currently hears nothing at
all when an admin turns their enquiry into a real booking
(AdminEnquiries.jsx's "Confirm booking") — only a decline emails them.
Same trigger-fires-an-async-HTTP-call-via-pg_net approach, same shared
Vault secret, same notify-enquiry edge function (now handles three
directions via a `type` field — see
supabase/functions/notify-enquiry/index.ts).

Fully self-contained and safe to re-run.

1. Changes
   - Adds public.notify_booking_confirmed(), an AFTER INSERT trigger
     function on public.bookings. Every row in this table is already a
     confirmed booking by construction (see 20260909150000_create_
     bookings.sql — nothing else ever inserts here), so this fires on
     every insert, not conditionally. POSTs
     { type: 'confirmed', record: {...} } to the notify-enquiry edge
     function.
   - Revokes EXECUTE on it from PUBLIC/anon/authenticated immediately,
     same hardening as the other two notify_* trigger functions — it's
     a trigger function, not something that should be directly
     callable via PostgREST.

2. Notes
   - Requires 20260909220000_notify_enquiry_by_email.sql (pg_net +
     the enquiry_webhook_secret Vault entry) and
     20260909150000_create_bookings.sql to already be applied.
   - Requires the notify-enquiry edge function to already be deployed
     with the "confirmed" type handled (see supabase/functions/
     notify-enquiry/index.ts) — the RESEND_API_KEY/WEBHOOK_SECRET
     secrets are shared with the existing notifications, no new
     secrets needed.
*/

CREATE OR REPLACE FUNCTION public.notify_booking_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  secret text;
BEGIN
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

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_notify_on_insert ON public.bookings;
CREATE TRIGGER bookings_notify_on_insert
  AFTER INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_booking_confirmed();

REVOKE EXECUTE ON FUNCTION public.notify_booking_confirmed() FROM PUBLIC, anon, authenticated;
