import { supabase } from './supabase';

// Starts Paystack checkout for an `awaiting_payment` booking and sends
// the browser there. paystack-init reads the booking with the caller's
// own session (RLS: the booking's guest, or an admin) and charges the
// booking's stored total — the amount the admin confirmed.
// Resolves with an error message only if checkout couldn't start.
export async function startPayment(bookingId) {
  const { data, error } = await supabase.functions.invoke('paystack-init', {
    body: { booking_id: bookingId },
  });
  if (error || !data?.authorization_url) {
    let message = data?.error;
    // supabase-js puts a non-2xx body on error.context, not data.
    if (!message && error?.context?.json) {
      try { message = (await error.context.json())?.error; } catch { /* ignore */ }
    }
    return message || "Couldn't start payment. Please try again.";
  }
  window.location.href = data.authorization_url;
  return null;
}
