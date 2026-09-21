// book-and-pay — the new self-service path from the public Book page:
// a guest with known, available dates goes straight from "Book & pay
// now" to a real Paystack checkout, with no admin step in between.
// Replaces, for the common case, the old enquiry -> admin "Confirm &
// request payment" -> "Send payment link" chain (still built and
// still used as the fallback below, and still available for guests
// who send a plain question via the separate "Send an enquiry" path
// on the same page).
//
// Flow:
//   1. Validate input.
//   2. Check is_date_range_available() — the same apartment-scoped
//      RPC the Book page already calls for its live heads-up (see
//      supabase/migrations/20260921120000_payment_gated_bookings.sql),
//      which itself checks both this site's own bookings AND the
//      Airbnb-synced external_calendar_blocks table (refreshed every
//      3 hours by sync-airbnb-calendar — NOT a live Airbnb API call;
//      Airbnb doesn't offer one for this kind of iCal-based sync, so
//      a reservation made on Airbnb in the last few hours could in
//      rare cases still slip through here. The database's own
//      bookings_no_date_overlap exclusion constraint is the real,
//      unconditional backstop against double-booking on THIS site).
//   3. If unavailable (or a race loses to it at insert time): fall
//      back to creating a plain `enquiries` row, exactly like the old
//      "Send an enquiry" flow — the admin sees it and can resolve
//      manually, same conflict-handling this project already had.
//   4. If available: computes the GHS total itself from nights (never
//      trusts a client-sent amount for anything payment-related),
//      inserts the booking as `awaiting_payment`, initializes a
//      Paystack transaction, saves the checkout link (which fires the
//      existing "payment_requested" guest email as a bonus, in case
//      the redirect below doesn't land), and returns the checkout URL
//      for the browser to redirect to immediately.
//
// Pricing: GHS 388/night, mirrored from src/lib/pricing.js — see that
// file's header for where this number comes from (real booking
// history) and keep both in sync if the real rate ever changes.
//
// Auth: verify_jwt is OFF — anyone can submit the public Book form
// without an account, same as the existing enquiries insert already
// allows. This does mean an anonymous caller can make this function
// create a `bookings` row and call Paystack's Initialize Transaction
// API, which every other privileged action in this project gates
// behind an admin login — that's deliberate here (the whole point is
// removing the human from the happy path), and the blast radius is
// limited: input is validated, availability is checked first, an
// abandoned awaiting_payment booking blocks nothing (see the
// migration above) and costs nothing beyond one harmless Paystack API
// call, and nothing is ever charged without the guest completing
// checkout themselves on Paystack's own page.
//
// Required secrets (shared with paystack-init/paystack-webhook):
//   PAYSTACK_SECRET_KEY — from the Paystack dashboard.
//   SITE_URL             — optional, same default as elsewhere.
//
// SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY are
// always available to edge functions automatically — nothing to set.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
const SITE_URL = Deno.env.get("SITE_URL") || "https://apartments.home-officegroup.com";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

// Keep in sync with src/lib/pricing.js — this is the real source of
// truth for what gets charged; the client-side copy is only for the
// live estimate shown before submitting.
const NIGHTLY_RATE_GHS = 388;
const MULTI_NIGHT_DISCOUNT_GHS = 95;
const LONG_STAY_DISCOUNT_PCT = 0.20;

function calculateTotal(nights: number): number {
  let total = nights * NIGHTLY_RATE_GHS;
  if (nights >= 28 && nights <= 30) {
    total *= 1 - LONG_STAY_DISCOUNT_PCT;
  } else if (nights >= 5) {
    total -= MULTI_NIGHT_DISCOUNT_GHS;
  }
  return Math.round(total * 100) / 100;
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const ms = new Date(`${checkOut}T00:00:00`).getTime() - new Date(`${checkIn}T00:00:00`).getTime();
  return Math.round(ms / 86400000);
}

function makeReference(): string {
  const code = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `HO-${code}`;
}

const VALID_APARTMENTS: Record<string, number> = { "home-office": 4, livingspring: 4 };

// Creates the plain enquiry row the old "Send an enquiry" path already
// makes — used both for a genuine question-only submission and as the
// automatic fallback when dates aren't actually available.
async function createFallbackEnquiry(anon: ReturnType<typeof createClient>, fields: Record<string, unknown>) {
  const { error } = await anon.from("enquiries").insert(fields);
  if (error?.message?.includes("DUPLICATE_OPEN_ENQUIRY")) {
    return { ok: false as const, error: "You already have an enquiry with us that we're still working on — we'll be in touch soon." };
  }
  if (error) {
    console.error("book-and-pay: fallback enquiry insert failed", error);
    return { ok: false as const, error: "Couldn't send that. Please try again or contact us directly." };
  }
  return { ok: true as const };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Bad request" }, 400);
  }

  const name = String(body?.name || "").trim();
  const email = String(body?.email || "").trim();
  const phone = body?.phone ? String(body.phone).trim() : null;
  const checkIn = String(body?.checkIn || "");
  const checkOut = String(body?.checkOut || "");
  const apartment = String(body?.apartment || "");
  const guests = Number(body?.guests);
  const message = body?.message ? String(body.message).trim() : null;

  if (!name || !email || !checkIn || !checkOut) {
    return json({ error: "Please fill in your name, email, and dates." }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Please enter a valid email address." }, 400);
  }
  if (!VALID_APARTMENTS[apartment]) {
    return json({ error: "Please choose a valid apartment." }, 400);
  }
  const nights = nightsBetween(checkIn, checkOut);
  if (nights <= 0) {
    return json({ error: "Check-out must be after check-in." }, 400);
  }
  if (new Date(`${checkIn}T00:00:00`).getTime() < Date.now() - 86400000) {
    return json({ error: "Check-in can't be in the past." }, 400);
  }
  if (!guests || guests < 1 || guests > VALID_APARTMENTS[apartment]) {
    return json({ error: `Guests must be between 1 and ${VALID_APARTMENTS[apartment]} for this apartment.` }, 400);
  }

  const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const enquiryFields = {
    name, email, phone, check_in: checkIn, check_out: checkOut,
    guests, message, apartment,
  };

  // A plain question (no dates yet, or guest explicitly chose "Send an
  // enquiry" instead) never reaches this function with intent to pay —
  // Book.jsx calls this only for the "Book & pay now" action. Still,
  // handle it the same safe way if ever called without payment intent.
  if (body?.enquiryOnly) {
    const result = await createFallbackEnquiry(anon, enquiryFields);
    return result.ok ? json({ ok: true, mode: "enquiry" }) : json({ error: result.error }, 400);
  }

  if (!PAYSTACK_SECRET_KEY) {
    console.error("book-and-pay: PAYSTACK_SECRET_KEY is not set");
    return json({ error: "Payments aren't set up yet — please send an enquiry instead." }, 500);
  }

  const { data: available } = await anon.rpc("is_date_range_available", {
    check_in: checkIn, check_out: checkOut, apartment,
  });

  if (available !== true) {
    const result = await createFallbackEnquiry(anon, enquiryFields);
    return result.ok
      ? json({ ok: true, mode: "enquiry", reason: "unavailable" })
      : json({ error: result.error }, 409);
  }

  const total = calculateTotal(nights);
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: profile } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();

  const bookingRow = {
    guest_id: profile?.id || null,
    guest_name: name,
    guest_email: email,
    guest_phone: phone,
    apartment,
    check_in: checkIn,
    check_out: checkOut,
    guests,
    total,
    status: "awaiting_payment",
  };

  let inserted: any = null;
  for (let attempt = 0; attempt < 2 && !inserted; attempt++) {
    const { data, error } = await admin
      .from("bookings")
      .insert({ ...bookingRow, reference: makeReference() })
      .select()
      .single();
    if (!error) {
      inserted = data;
    } else if (error.code === "23P01") {
      // Someone else's booking (or Airbnb sync) landed on these exact
      // dates between our availability check and this insert — treat
      // it the same as "unavailable" rather than surfacing a raw
      // database error to a guest mid-checkout.
      const result = await createFallbackEnquiry(anon, enquiryFields);
      return result.ok
        ? json({ ok: true, mode: "enquiry", reason: "unavailable" })
        : json({ error: result.error }, 409);
    } else if (!String(error.message).includes("reference")) {
      console.error("book-and-pay: booking insert failed", error);
      return json({ error: "Couldn't create your booking. Please try again." }, 500);
    }
  }
  if (!inserted) {
    return json({ error: "Couldn't create your booking. Please try again." }, 500);
  }

  const paystackReference = `${inserted.reference}-${Date.now().toString(36)}`;
  const initRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      amount: Math.round(total * 100),
      currency: "GHS",
      reference: paystackReference,
      callback_url: SITE_URL,
      metadata: { booking_id: inserted.id, booking_reference: inserted.reference },
    }),
  });
  const initJson = await initRes.json().catch(() => null);

  if (!initRes.ok || !initJson?.status || !initJson?.data?.authorization_url) {
    console.error("book-and-pay: Paystack error", initRes.status, initJson);
    // The booking already exists as awaiting_payment (harmless, blocks
    // nothing) — an admin can still send a payment link manually from
    // AdminEnquiries if this keeps happening.
    return json({ error: "Paystack couldn't start this payment. Please try again in a moment." }, 502);
  }

  const authorizationUrl = initJson.data.authorization_url as string;

  await admin
    .from("bookings")
    .update({ paystack_reference: paystackReference, payment_url: authorizationUrl })
    .eq("id", inserted.id);

  return json({ ok: true, mode: "paid", authorization_url: authorizationUrl, reference: inserted.reference });
});
