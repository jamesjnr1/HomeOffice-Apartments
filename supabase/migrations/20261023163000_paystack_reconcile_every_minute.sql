/*
# Reconcile Paystack payments every minute

Tightens the paystack-reconcile job from every 5 minutes
(20261023120000_paystack_reconcile_schedule.sql) to every minute, so a
payment the Paystack webhook misses still confirms within about a
minute. One small Paystack "list transactions" call per run — well
within Paystack's rate limits.

Safe to re-run.
*/

SELECT cron.alter_job(jobid, schedule := '* * * * *')
FROM cron.job
WHERE jobname = 'paystack-reconcile';
