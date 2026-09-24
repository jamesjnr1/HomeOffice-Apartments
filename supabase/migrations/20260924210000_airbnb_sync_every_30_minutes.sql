/*
# Sync the Airbnb calendar every 30 minutes instead of every 3 hours

Was on '0 */3 * * *' (every 3 hours). A guest reported a real Airbnb
reservation not yet reflecting on the site's own availability check —
diagnosed as simply a timing gap: the booking landed shortly after the
last scheduled run, and the next one was still ~25 minutes away. The
underlying sync itself was working correctly; the cadence was just too
coarse. Tightened to every 30 minutes so a fresh Airbnb reservation
(or cancellation) shows up on the site, and triggers its admin SMS
alert, within half an hour worst case instead of up to three.

Safe to re-run.

1. Changes
   - Re-schedules sync-airbnb-calendar at '*/30 * * * *', keeping the
     same job body (30s pg_net timeout, same shared secret lookup)
     from 20260921110000_extend_airbnb_sync_timeout.sql — only the
     cron expression changes.

2. Notes
   - Depends on 20260920200100_airbnb_sync_schedule.sql and
     20260921110000_extend_airbnb_sync_timeout.sql.
   - Run this in the Supabase SQL Editor for this project — migrations
     in this repo aren't auto-applied by CI.
   - Doubles the sync's call volume against Airbnb's iCal export and
     Arkesel's SMS API (a new reservation still only ever texts once,
     the first time its UID is seen — this just shortens how long a
     reservation can go undetected, not how often it's texted about
     once known).
*/

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'sync-airbnb-calendar';

SELECT cron.schedule(
  'sync-airbnb-calendar',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://qjgnfzkgvmjjwvhmcply.supabase.co/functions/v1/sync-airbnb-calendar',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'airbnb_sync_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);
