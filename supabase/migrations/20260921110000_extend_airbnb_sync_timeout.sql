/*
# Extend the Airbnb sync cron job's pg_net timeout

Same bug as 20260920220000_extend_enquiry_notify_timeout.sql, on the
other cron job: sync-airbnb-calendar now sends an SMS via Arkesel for
every newly-seen reservation (see supabase/functions/sync-airbnb-
calendar/index.ts), sequentially, and Arkesel's own response time
sits right at pg_net's default 5-second net.http_post timeout. A
scheduled run today (09:00 UTC) hit exactly that: "Timeout of 5000 ms
reached... Total time: 5000.106000 ms" — the edge function itself
kept running to completion regardless (no sync was actually lost),
but pg_net's own record of the call was a false timeout instead of
the true result, which would make cron.job_run_details/net._http_
response useless for diagnosing an actual future failure.

Raises the timeout to 30s — comfortably above even two sequential
Arkesel calls (one new reservation per feed) at ~5s each.

Safe to re-run.

1. Changes
   - Re-schedules sync-airbnb-calendar with
     timeout_milliseconds := 30000 on its net.http_post call, replacing
     the 5000ms default.

2. Notes
   - Depends on 20260920200100_airbnb_sync_schedule.sql.
   - Run this in the Supabase SQL Editor for this project — migrations
     in this repo aren't auto-applied by CI.
*/

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
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);
