/*
# Email the admin the moment a new enquiry arrives (replaces Formspree)

Formspree was a client-side POST from the guest's own browser, sent in
parallel with (well, actually before/independent of) the Supabase
insert. That meant its reliability depended entirely on the guest's
connection and browser completing a second network request — if it
was blocked, rate-limited, or just dropped, the enquiry still saved to
Supabase but you'd never hear about it unless you happened to check
the admin dashboard.

This migration replaces that with a database trigger: the instant a
row lands in public.enquiries, it fires an async HTTP call (via
pg_net, so it doesn't block or slow down the guest's insert) to the
notify-enquiry edge function, which emails you via Resend. This is
server-side and triggered by the actual database write, so it's no
longer dependent on the guest's browser at all — the same reliability
guarantee the rest of this app is already built on.

The edge function requires a shared secret to reject calls that didn't
come from this trigger (see supabase/functions/notify-enquiry/index.ts
for the full rationale). Rather than hardcode that secret in this file
— which would put it in git — it's generated here and stored in
Supabase Vault, and the actual value needs to be copied into the
notify-enquiry function's WEBHOOK_SECRET secret once, by hand, in the
Supabase dashboard (Project Settings -> Edge Functions -> notify-enquiry
-> Secrets). See the deploy notes wherever this migration was applied
from for the generated value.

This migration is fully self-contained like the others in this repo —
safe to re-run (the vault secret is only created if it doesn't already
exist, and the trigger function/trigger are both CREATE OR REPLACE /
DROP IF EXISTS + CREATE).

1. Changes
   - Enables the pg_net extension (async HTTP from Postgres) if not
     already enabled.
   - Creates a random secret in Supabase Vault named
     'enquiry_webhook_secret', only if one doesn't already exist.
   - Adds public.notify_new_enquiry(), an AFTER INSERT trigger function
     on public.enquiries that POSTs the new row (as { record: {...} })
     to the notify-enquiry edge function, with the vault secret as the
     x-webhook-secret header.

2. Notes
   - Requires the notify-enquiry edge function to already be deployed,
     with RESEND_API_KEY and WEBHOOK_SECRET set as its secrets — see
     supabase/functions/notify-enquiry/index.ts.
   - Run this in the Supabase SQL Editor for this project — migrations
     in this repo aren't auto-applied by CI.
   - Depends on 20260909140000_create_enquiries.sql.
*/

CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'enquiry_webhook_secret') THEN
    PERFORM vault.create_secret(
      encode(gen_random_bytes(24), 'hex'),
      'enquiry_webhook_secret',
      'Shared secret so the notify-enquiry edge function can verify a call actually came from the enquiries insert trigger, not an arbitrary caller.'
    );
  END IF;
END $$;

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
    body := jsonb_build_object('record', to_jsonb(NEW))
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enquiries_notify_on_insert ON public.enquiries;
CREATE TRIGGER enquiries_notify_on_insert
  AFTER INSERT ON public.enquiries
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_enquiry();
