/*
# Reconcile Paystack payments every 5 minutes

A guest (HO-6CKNO) paid on Paystack but the booking stayed
`awaiting_payment`: Paystack's webhook never reached paystack-webhook
(the webhook URL isn't set in the Paystack dashboard), and the
dashboard-side backup (paystack-verify) only runs when the guest opens
their dashboard signed in — which a guest whose account book-and-pay
created automatically usually never does.

paystack-reconcile asks Paystack directly for recent successful
transactions and confirms any matching booking still awaiting payment
(same checks as paystack-webhook: Paystack-verified status, amount and
currency, awaiting_payment only). Scheduling it every 5 minutes means a
payment confirms within minutes whatever happens to the webhook or the
guest's browser.

1. Changes
   - pg_cron job 'paystack-reconcile' at '*/5 * * * *', authenticated
     with the same Vault secret ('airbnb_sync_secret' = SYNC_SECRET)
     the sync-airbnb-calendar job already uses.

2. Notes
   - Safe to re-run.
*/

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'paystack-reconcile';

SELECT cron.schedule(
  'paystack-reconcile',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://qjgnfzkgvmjjwvhmcply.supabase.co/functions/v1/paystack-reconcile',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'airbnb_sync_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);
