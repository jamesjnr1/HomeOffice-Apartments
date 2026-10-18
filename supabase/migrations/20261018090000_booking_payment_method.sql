/*
# Record HOW a booking was paid

Until now a paid booking only had `paid_at` — no way to tell a Paystack
payment from a guest who paid on site (cash / in person) or by a
direct mobile-money transfer that an admin confirmed with "Mark as
paid". Receipts, the admin bookings list and revenue all need to say
which, so it's stored on the booking itself.

1. Changes
   - bookings.payment_method: 'paystack' | 'on_site' | 'mobile_money',
     NULL while unpaid (and for older paid rows we can't classify).
   - Backfills 'paystack' for already-paid bookings that went through
     Paystack (they have a paystack_reference).

2. Notes
   - paystack-webhook sets 'paystack'; the admin "Mark as paid"
     actions (AdminEnquiries / AdminBookings) set 'on_site' or
     'mobile_money'.
   - Safe to re-run.
*/

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_method text;

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_payment_method_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_payment_method_check
  CHECK (payment_method IS NULL OR payment_method IN ('paystack', 'on_site', 'mobile_money'));

UPDATE public.bookings
SET payment_method = 'paystack'
WHERE payment_method IS NULL
  AND paid_at IS NOT NULL
  AND paystack_reference IS NOT NULL
  AND status IN ('confirmed', 'completed');
