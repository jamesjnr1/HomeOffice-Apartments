/*
# Schedule the Airbnb calendar sync

Runs sync-airbnb-calendar every 3 hours via pg_cron + pg_net, the same
async-HTTP-from-Postgres pattern already used for the enquiry email
notification (see 20260909220000_notify_enquiry_by_email.sql) — a
shared secret in Vault, checked by the edge function, so the endpoint
can't be triggered by an arbitrary caller.

Every 3 hours is frequent enough to catch a new Airbnb booking well
before a guest could enquire here for the same dates, without hammering
Airbnb's calendar export endpoint.

1. Changes
   - Enables pg_cron if not already enabled.
   - Creates 'airbnb_sync_secret' in Vault, only if one doesn't already
     exist.
   - Schedules a cron job that POSTs to sync-airbnb-calendar with that
     secret every 3 hours.

2. Notes
   - Requires the sync-airbnb-calendar edge function to already be
     deployed, with AIRBNB_ICAL_URL and SYNC_SECRET set as its secrets
     (SYNC_SECRET must match the vault value created here) — see
     supabase/functions/sync-airbnb-calendar/index.ts.
   - Run this in the Supabase SQL Editor for this project — migrations
     in this repo aren't auto-applied by CI.
*/

CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'airbnb_sync_secret') THEN
    PERFORM vault.create_secret(
      encode(gen_random_bytes(24), 'hex'),
      'airbnb_sync_secret',
      'Shared secret so the sync-airbnb-calendar edge function can verify a call actually came from the scheduled cron job, not an arbitrary caller.'
    );
  END IF;
END $$;

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'sync-airbnb-calendar';

SELECT cron.schedule(
  'sync-airbnb-calendar',
  '0 */3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://qjgnfzkgvmjjwvhmcply.supabase.co/functions/v1/sync-airbnb-calendar',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'airbnb_sync_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
