// paystack-reconcile — makes sure a payment that reached Paystack always
// confirms its booking, even when paystack-webhook never fires (webhook
// URL not set in the Paystack dashboard, a Paystack outage, etc.) and
// the guest never opens their dashboard (paystack-verify's trigger).
//
// Two ways in:
//   1. Scheduled (pg_cron, every minute — see
//      supabase/migrations/20261023163000_paystack_reconcile_every_minute.sql),
//      authenticated with the x-webhook-secret header = SYNC_SECRET (the
//      same shared secret sync-airbnb-calendar's job already uses). Lists
//      Paystack's successful transactions from the last 14 days and
//      confirms every matching booking that is still awaiting_payment.
//      Listing (not just verifying bookings.paystack_reference) also
//      catches a guest who paid an OLDER checkout link for the booking.
//   2. From the browser, { reference } — the /payment/complete page
//      Paystack redirects the guest to after checkout. No login needed:
//      the reference is checked against Paystack's Verify API, so the
//      only thing a caller can ever do is confirm a booking that really
//      was paid in full.
//
// Either way Paystack's own API is the only source of truth for "paid",
// "how much" and "which booking" (metadata.booking_id, which book-and-pay
// and paystack-init set), and the update only touches awaiting_payment
// rows — the same rules as paystack-webhook. A cancelled booking that
// gets paid is never revived; it's logged for a person to sort out.
//
// verify_jwt is OFF (Paystack's redirect lands a guest who may not be
// signed in; pg_cron has no user token).
//
// Required secrets: PAYSTACK_SECRET_KEY, SYNC_SECRET (both already set).

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
const SYNC_SECRET = Deno.env.get("SYNC_SECRET");
const LOOKBACK_DAYS = 14;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function paystack(path: string) {
  const res = await fetch(`https://api.paystack.co${path}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
  });
  const body = await res.json().catch(() => null);
  return { ok: res.ok && body?.status === true, body };
}

function bookingIdFrom(tx: any): string | null {
  let metadata = tx?.metadata;
  if (typeof metadata === "string") {
    try { metadata = JSON.parse(metadata); } catch { metadata = null; }
  }
  return metadata?.booking_id || null;
}

type Outcome = { reference: string; booking?: string; result: string };

// Confirms the booking a successful Paystack transaction belongs to.
async function applyTransaction(tx: any): Promise<Outcome> {
  const reference = String(tx.reference);
  if (tx.status !== "success") return { reference, result: "not_paid" };

  let { data: booking } = await admin
    .from("bookings")
    .select("id, reference, status, total")
    .eq("paystack_reference", reference)
    .maybeSingle();
  const metaId = bookingIdFrom(tx);
  if (!booking && metaId) {
    ({ data: booking } = await admin
      .from("bookings")
      .select("id, reference, status, total")
      .eq("id", metaId)
      .maybeSingle());
  }
  if (!booking) return { reference, result: "no_booking" };

  if (booking.status === "confirmed" || booking.status === "completed") {
    return { reference, booking: booking.reference, result: "already_confirmed" };
  }
  if (booking.status !== "awaiting_payment") {
    console.error("paystack-reconcile: paid booking is not awaiting payment", { reference, booking: booking.reference, status: booking.status });
    return { reference, booking: booking.reference, result: `booking_${booking.status}` };
  }
  const paidGhs = Number(tx.amount) / 100;
  if (Math.abs(paidGhs - Number(booking.total)) > 0.01 || (tx.currency && tx.currency !== "GHS")) {
    console.error("paystack-reconcile: amount/currency mismatch", { reference, paidGhs, currency: tx.currency, expected: booking.total });
    return { reference, booking: booking.reference, result: "amount_mismatch" };
  }

  const { error } = await admin
    .from("bookings")
    .update({
      status: "confirmed",
      paid_at: tx.paid_at || tx.paidAt || new Date().toISOString(),
      paystack_reference: reference,
      payment_method: "paystack",
    })
    .eq("id", booking.id)
    .eq("status", "awaiting_payment");
  if (error) {
    console.error("paystack-reconcile: failed to confirm booking", booking.reference, error);
    return { reference, booking: booking.reference, result: "update_failed" };
  }
  console.log("paystack-reconcile: confirmed", booking.reference, reference);
  return { reference, booking: booking.reference, result: "confirmed" };
}

async function reconcileRecent(): Promise<Outcome[]> {
  const from = new Date(Date.now() - LOOKBACK_DAYS * 86400000).toISOString();
  const outcomes: Outcome[] = [];
  for (let page = 1; page <= 20; page++) {
    const { ok, body } = await paystack(`/transaction?status=success&perPage=100&page=${page}&from=${encodeURIComponent(from)}`);
    if (!ok) {
      console.error("paystack-reconcile: listing transactions failed", body);
      break;
    }
    for (const tx of body.data || []) outcomes.push(await applyTransaction(tx));
    const pageCount = Number(body.meta?.pageCount || 1);
    if (page >= pageCount) break;
  }
  return outcomes;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!PAYSTACK_SECRET_KEY) return json({ error: "Payments aren't configured yet" }, 500);

  let body: any = {};
  try { body = await req.json(); } catch { /* empty body is fine for the scheduled run */ }

  // One checkout, from the guest's redirect back to the site.
  if (body?.reference) {
    const reference = String(body.reference).slice(0, 100);
    const { ok, body: verified } = await paystack(`/transaction/verify/${encodeURIComponent(reference)}`);
    if (!ok || !verified?.data) return json({ paid: false, status: "unknown" });
    const outcome = await applyTransaction(verified.data);
    const paid = outcome.result === "confirmed" || outcome.result === "already_confirmed";
    return json({ paid, status: outcome.result, booking: outcome.booking || null });
  }

  // Scheduled sweep.
  if (!SYNC_SECRET || req.headers.get("x-webhook-secret") !== SYNC_SECRET) {
    return json({ error: "Unauthorized" }, 401);
  }
  const outcomes = await reconcileRecent();
  const confirmed = outcomes.filter((o) => o.result === "confirmed");
  const problems = outcomes.filter((o) => !["confirmed", "already_confirmed", "no_booking"].includes(o.result));
  return json({ checked: outcomes.length, confirmed, problems });
});
