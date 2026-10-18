// paystack-verify — the backup to paystack-webhook. Called from the
// browser (guest dashboard, admin bookings) for an `awaiting_payment`
// booking: asks Paystack directly whether the booking's latest checkout
// (bookings.paystack_reference) was paid, and if so confirms it — the
// same update the webhook makes. So a payment still confirms even if
// Paystack's webhook never arrives (e.g. the webhook URL isn't set in
// the Paystack dashboard).
//
// Auth: verify_jwt is ON. The booking is read with the CALLER's token,
// so RLS decides who may check it (the booking's own guest, or an
// owner/manager) — same pattern as paystack-init. Paystack's Verify API
// is the only source of truth for "paid" and "how much"; nothing the
// browser sends is trusted beyond the booking id.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!PAYSTACK_SECRET_KEY) return json({ error: "Payments aren't configured yet" }, 500);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Bad request" }, 400); }
  const bookingId = body?.booking_id;
  if (!bookingId) return json({ error: "Missing booking_id" }, 400);

  const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
  });
  const { data: booking, error: readError } = await callerClient
    .from("bookings")
    .select("id, status, total, paystack_reference")
    .eq("id", bookingId)
    .maybeSingle();
  if (readError || !booking) return json({ error: "Booking not found, or you don't have access to it" }, 403);

  if (booking.status !== "awaiting_payment" || !booking.paystack_reference) {
    return json({ status: booking.status, paid: booking.status === "confirmed" || booking.status === "completed" });
  }

  const verifyRes = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(booking.paystack_reference)}`,
    { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } },
  );
  const verifyJson = await verifyRes.json().catch(() => null);
  const tx = verifyJson?.data;
  if (!verifyRes.ok || tx?.status !== "success") {
    return json({ status: booking.status, paid: false });
  }

  const paidGhs = Number(tx.amount) / 100;
  if (Math.abs(paidGhs - Number(booking.total)) > 0.01 || (tx.currency && tx.currency !== "GHS")) {
    console.error("paystack-verify: amount/currency mismatch", { bookingId, paidGhs, currency: tx.currency, expected: booking.total });
    return json({ status: booking.status, paid: false, error: "Payment amount doesn't match this booking" }, 409);
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { error: updateError } = await admin
    .from("bookings")
    .update({ status: "confirmed", paid_at: tx.paid_at || new Date().toISOString(), payment_method: "paystack" })
    .eq("id", booking.id)
    .eq("status", "awaiting_payment");
  if (updateError) {
    console.error("paystack-verify: failed to confirm booking", bookingId, updateError);
    return json({ error: "Payment found, but the booking couldn't be confirmed. Please contact us." }, 500);
  }

  return json({ status: "confirmed", paid: true });
});
