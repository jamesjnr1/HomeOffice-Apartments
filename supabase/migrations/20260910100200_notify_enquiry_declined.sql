/*
# Email the guest when their enquiry is declined

Mirrors 20260909220000_notify_enquiry_by_email.sql's pattern exactly,
but for the opposite direction: instead of the admin hearing about a
new enquiry, the guest hears back when theirs is declined (most
commonly because the dates they asked for are already reserved — see
20260910100100_prevent_overlapping_bookings.sql for the guarantee
that made that possible to detect). Same trigger-fires-an-async-HTTP-
call-via-pg_net approach, same shared Vault secret, same
notify-enquiry edge function (now handles both directions via a
`type` field — see supabase/functions/notify-enquiry/index.ts).

Fully self-contained and safe to re-run.

1. Changes
   - Adds public.notify_enquiry_declined(), an AFTER UPDATE trigger
     function on public.enquiries that fires only when status
     transitions TO 'declined' (not on every update — replying,
     archiving, etc. don't trigger this). POSTs
     { type: 'declined', record: {...} } to the notify-enquiry edge
     function.
   - Revokes EXECUTE on it from PUBLIC/anon/authenticated immediately,
     same hardening as notify_new_enquiry() — it's a trigger function,
     not something that should be directly callable via PostgREST.

2. Notes
   - Requires 20260909220000_notify_enquiry_by_email.sql (pg_net +
     the enquiry_webhook_secret Vault entry) and
     20260910100000_decline_enquiries_and_guest_visibility.sql (the
     'declined' status itself) to already be applied.
   - Requires the notify-enquiry edge function to already be deployed
     with the type-aware version (see supabase/functions/notify-
     enquiry/index.ts) — the RESEND_API_KEY/WEBHOOK_SECRET secrets are
     shared with the existing new-enquiry notification, no new secrets
     needed.
*/

CREATE OR REPLACE FUNCTION public.notify_enquiry_declined()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  secret text;
BEGIN
  IF NEW.status = 'declined' AND (OLD.status IS DISTINCT FROM 'declined') THEN
    SELECT decrypted_secret INTO secret
    FROM vault.decrypted_secrets
    WHERE name = 'enquiry_webhook_secret';

    PERFORM net.http_post(
      url := 'https://qjgnfzkgvmjjwvhmcply.supabase.co/functions/v1/notify-enquiry',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-webhook-secret', secret
      ),
      body := jsonb_build_object('type', 'declined', 'record', to_jsonb(NEW))
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enquiries_notify_on_decline ON public.enquiries;
CREATE TRIGGER enquiries_notify_on_decline
  AFTER UPDATE ON public.enquiries
  FOR EACH ROW EXECUTE FUNCTION public.notify_enquiry_declined();

REVOKE EXECUTE ON FUNCTION public.notify_enquiry_declined() FROM PUBLIC, anon, authenticated;
