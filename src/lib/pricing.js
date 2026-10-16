// Real GHS pricing, derived from actual booking history (HO-2JLBY:
// GHS 1164 / 3 nights = GHS 388/night) — the number the site's
// "$41/night" marketing copy has always stood for. This is the single
// client-side source of truth for the live estimate shown on the Book
// page; supabase/functions/book-and-pay/index.ts keeps its own copy
// of this exact logic as the REAL source of truth for what actually
// gets charged — a client-sent total is never trusted for payment.
// If the real Airbnb nightly rate ever changes, update NIGHTLY_RATE_GHS
// here AND in that edge function together.

export const NIGHTLY_RATE_GHS = 388;
export const MULTI_NIGHT_DISCOUNT_GHS = 95; // ~$10 equivalent, 5+ nights
export const LONG_STAY_DISCOUNT_PCT = 0.20; // 20% off, 28-30 nights

export function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const ms = new Date(checkOut) - new Date(checkIn);
  if (isNaN(ms) || ms <= 0) return 0;
  return Math.round(ms / 86400000);
}

export function calculateTotal(nights) {
  if (!nights || nights <= 0) return 0;
  let total = nights * NIGHTLY_RATE_GHS;
  if (nights >= 28 && nights <= 30) {
    total *= 1 - LONG_STAY_DISCOUNT_PCT;
  } else if (nights >= 5) {
    total -= MULTI_NIGHT_DISCOUNT_GHS;
  }
  return Math.round(total * 100) / 100;
}
