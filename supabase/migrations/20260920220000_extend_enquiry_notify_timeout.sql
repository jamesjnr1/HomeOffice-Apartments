/*
# Extend the notify-enquiry trigger's pg_net timeout

notify-enquiry now also sends an SMS via Arkesel (see
supabase/functions/notify-enquiry/index.ts) alongside the admin email,
and Arkesel's own response time has been observed sitting right at
~5 seconds — pg_net's default net.http_post timeout. A manual test
call at that default timed out ("Timeout of 5000 ms reached...") even
though Arkesel had, in fact, accepted and queued the message — the
edge function keeps running to completion regardless of whether
pg_net's own request gave up waiting, so no notification was actually
lost, but every future new-enquiry insert was at real risk of logging
a spurious timeout in net._http_response instead of the true 200 OK,
making that table useless for actually diagnosing a future problem.

This raises the timeout on the enquiries insert trigger's call only
(15s — comfortably above the observed ~5s) so its own record of the
call reflects what actually happened. The declined-enquiry trigger
doesn't send an SMS and responds quickly, so it's left on the default.

Safe to re-run — CREATE OR REPLACE.

1. Changes
   - public.notify_new_enquiry() calls net.http_post with
     timeout_milliseconds := 15000 instead of the 5000ms default.

2. Notes
   - Depends on 20260909220000_notify_enquiry_by_email.sql.
   - Run this in the Supabase SQL Editor for this project — migrations
     in this repo aren't auto-applied by CI.
*/

CREATE OR REPLACE FUNCTION public.notify_new_enquiry()
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
    body := jsonb_build_object('record', to_jsonb(NEW)),
    timeout_milliseconds := 15000
  );

  RETURN NEW;
END;
$$;
