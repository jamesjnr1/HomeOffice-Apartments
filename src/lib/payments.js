import { supabase } from './supabase';

// How a booking was paid (bookings.payment_method — see supabase/
// migrations/20261018090000_booking_payment_method.sql).
export const PAYMENT_METHOD_LABELS = {
  paystack: 'Paystack (card / MoMo)',
  on_site: 'Paid on site',
  mobile_money: 'Mobile money transfer',
};

export function paymentMethodLabel(method) {
  return PAYMENT_METHOD_LABELS[method] || null;
}

// Admin attests the guest paid outside Paystack (on site, or a direct
// MoMo transfer) and confirms the booking. Same status change the
// Paystack webhook makes, so it sends the same receipt email/SMS and
// makes the stay count as paid everywhere.
export async function markBookingPaid(bookingId, method) {
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'confirmed', paid_at: new Date().toISOString(), payment_method: method })
    .eq('id', bookingId)
    .eq('status', 'awaiting_payment');
  return error;
}
