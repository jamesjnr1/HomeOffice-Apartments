/*
# Prevent duplicate open enquiries per email

A guest could previously submit the Book form any number of times in
a row — each one landed as a separate 'new' row with nothing to stop
it. Now: while someone has an enquiry sitting at status = 'new'
(i.e. nobody has replied, archived it, or turned it into a booking
yet), a second submission from the same email is rejected at the
database level rather than silently creating a duplicate.

Enforced with a partial unique index rather than application code, so
it holds no matter how the row gets inserted (the public Book form
today, anything else later) — see src/pages/Book.jsx for how the
client turns the resulting unique-violation into a friendly message
instead of the generic error.

This migration is fully self-contained like the others in this repo
— safe to re-run (CREATE UNIQUE INDEX IF NOT EXISTS).

1. Changes
   - A unique index on lower(trim(email)) WHERE status = 'new'. Once
     an enquiry leaves 'new' (replied, archived, or converted to a
     booking), that email is free to submit again.

2. Notes
   - Run this in the Supabase SQL Editor for this project — migrations
     in this repo aren't auto-applied by CI.
   - Depends on 20260909140000_create_enquiries.sql having run first
     (the enquiries table must already exist).
*/

CREATE UNIQUE INDEX IF NOT EXISTS enquiries_one_open_per_email
  ON public.enquiries (lower(trim(email)))
  WHERE status = 'new';
