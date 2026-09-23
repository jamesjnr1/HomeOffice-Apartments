// paystack-init — creates a Paystack hosted-checkout link for an
// `awaiting_payment` booking. Called from the GUEST's own dashboard
// (Bookings.jsx's "Pay now") when they're ready to pay — see
// supabase/migrations/20260921120000_payment_gated_bookings.sql for
// why a confirmed enquiry now sits as `awaiting_payment` instead of
// going straight to `confirmed`. There is no admin-side "send a
// payment link" action anymore; payment is entirely the guest's own
// dashboard flow.
//
// Auth: verify_jwt is ON (the platform rejects any request without a
// valid Supabase access token before this code even runs) — beyond
// that, the booking read below is done with the CALLER's own token,
// not the service role, so Row Level Security is what actually
// decides who may request payment for a given booking: either an
// owner/manager (bookings_admin_select), or the booking's own guest
// (bookings_guest_select_own, guest_id = auth.uid()) — no separate
// role check needed here, since RLS already only returns a row when
// one of those is true. The write that follows (saving the checkout
// link) uses the service role, since neither an admin nor a guest has
// a plain UPDATE grant on bookings beyond what RLS covers, and we've
// already proven the caller is allowed to act on this booking by the
// read above succeeding.
//
// A booking's `paystack_reference` is deliberately reminted every time
// this runs, never reused — Paystack's Initialize Transaction API
// rejects a reference it's seen before, even if that transaction was
// abandoned, so retrying with the same reference isn't an option (e.g.
// the guest clicking "Pay now" again after abandoning checkout once).
//
// Saving `payment_url` on the booking (below) is what fires the
// "payment_requested" guest email — see public.notify_payment_
// requested() in the migration above and supabase/functions/
// notify-enquiry/index.ts.
//
// Required secrets (Project Settings -> Edge Functions -> Secrets):
//   PAYSTACK_SECRET_KEY — from the Paystack dashboard (Settings ->
//                         API Keys & Webhooks). Use the LIVE secret key
//                         once ready to take real payments, the TEST
//                         key while trying this out.
//   SITE_URL             — optional, same default as notify-enquiry —
//                         where Paystack redirects the guest after
//                         attempting payment.
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

// Unlike every other function in this project, this one is called
// directly from the browser (the guest dashboard's "Pay now", via
// supabase.functions.invoke) rather than server-to-server — which
// means the browser sends a CORS preflight (OPTIONS) request
// first. Without handling it and echoing these headers on every
// response, the browser silently blocks the real POST before it ever
// reaches this function (it shows up in the logs as "OPTIONS | 405",
// never followed by a POST) and supabase-js surfaces that as a bare
// FunctionsFetchError with no useful message.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  if (!PAYSTACK_SECRET_KEY) {
    console.error("paystack-init: PAYSTACK_SECRET_KEY is not set");
    return new Response(JSON.stringify({ error: "Payments aren't configured yet" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Bad request" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const bookingId = body?.booking_id;
  if (!bookingId) {
    return new Response(JSON.stringify({ error: "Missing booking_id" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  // Runs as the caller (their access token is forwarded as-is) — RLS
  // (bookings_admin_select OR bookings_guest_select_own) simply
  // returns nothing for anyone who is neither an owner/manager nor
  // this booking's own guest, which we treat as "forbidden" below
  // without needing to inspect roles ourselves.
  const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
  });

  const { data: booking, error: readError } = await callerClient
    .from("bookings")
    .select("id, reference, guest_email, total, status")
    .eq("id", bookingId)
    .maybeSingle();

  if (readError || !booking) {
    return new Response(JSON.stringify({ error: "Booking not found, or you don't have access to it" }), {
      status: 403,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  if (booking.status !== "awaiting_payment") {
    return new Response(JSON.stringify({ error: `Booking is '${booking.status}', not awaiting payment` }), {
      status: 409,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  if (!booking.guest_email) {
    return new Response(JSON.stringify({ error: "This booking has no guest email to send a payment link to" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const paystackReference = `${booking.reference}-${Date.now().toString(36)}`;

  const initRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: booking.guest_email,
      amount: Math.round(Number(booking.total) * 100), // GHS -> pesewas
      currency: "GHS",
      reference: paystackReference,
      callback_url: SITE_URL,
      metadata: { booking_id: booking.id, booking_reference: booking.reference },
    }),
  });

  const initJson = await initRes.json().catch(() => null);
  if (!initRes.ok || !initJson?.status || !initJson?.data?.authorization_url) {
    console.error("paystack-init: Paystack error", initRes.status, initJson);
    return new Response(JSON.stringify({ error: "Paystack couldn't start this payment. Please try again." }), {
      status: 502,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const authorizationUrl = initJson.data.authorization_url as string;

  // Service role from here — anon/authenticated only has RLS-gated
  // UPDATE for owner/manager, which we've already established the
  // caller is by virtue of the read above succeeding, so this is just
  // avoiding a second round of policy evaluation, not bypassing one.
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { error: updateError } = await admin
    .from("bookings")
    .update({ paystack_reference: paystackReference, payment_url: authorizationUrl })
    .eq("id", booking.id);

  if (updateError) {
    console.error("paystack-init: failed to save payment link", updateError);
    return new Response(JSON.stringify({ error: "Payment link created, but couldn't be saved. Please try again." }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ authorization_url: authorizationUrl, reference: paystackReference }), {
    status: 200,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
});
