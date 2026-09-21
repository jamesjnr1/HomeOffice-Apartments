// paystack-webhook — Paystack calls this the moment a payment succeeds
// (event "charge.success"), which is what actually flips a booking
// from `awaiting_payment` to `confirmed` — see supabase/functions/
// paystack-init for how the checkout link this pays off was created,
// and supabase/migrations/20260921120000_payment_gated_bookings.sql
// for why confirmation is gated on payment at all.
//
// Auth: verify_jwt is OFF — Paystack has no Supabase login, it POSTs
// directly. Instead this verifies Paystack's own HMAC-SHA512 signature
// (the `x-paystack-signature` header, computed over the raw request
// body with PAYSTACK_SECRET_KEY — see Paystack's webhook docs), the
// same "shared secret only the real sender knows" shape as notify-
// enquiry's WEBHOOK_SECRET header, just Paystack's own scheme instead
// of one we invented.
//
// Belt and suspenders: the webhook body is never trusted on its own
// for the two things that matter (that payment actually succeeded, and
// for how much) — this always re-verifies the transaction directly
// against Paystack's Verify Transaction API before touching the
// database, and cross-checks the verified amount against the
// booking's own total. A forged or replayed webhook with a
// suspiciously large stated amount still can't confirm a booking it
// didn't actually pay for.
//
// Idempotent: Paystack retries webhooks that don't get a prompt 200,
// and a guest's dashboard/email flow could also race a retry — a
// booking already `confirmed` is treated as a no-op success rather
// than erroring or double-sending the confirmation email (the
// confirmed email trigger itself is also guarded, but this avoids the
// wasted API calls that would lead to nothing anyway).
//
// Setup: after deploying this function, add its URL as a webhook in
// the Paystack dashboard (Settings -> API Keys & Webhooks -> Webhook
// URL): https://qjgnfzkgvmjjwvhmcply.supabase.co/functions/v1/
// paystack-webhook — Paystack signs with the SAME secret key used to
// initialize transactions, so no separate webhook secret to configure.
//
// Required secrets (shared with paystack-init):
//   PAYSTACK_SECRET_KEY — from the Paystack dashboard.
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are always available to
// edge functions automatically — nothing to set.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");

async function hmacSha512Hex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!PAYSTACK_SECRET_KEY) {
    console.error("paystack-webhook: PAYSTACK_SECRET_KEY is not set");
    return new Response("Not configured", { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature") || "";
  const expected = await hmacSha512Hex(PAYSTACK_SECRET_KEY, rawBody);
  if (signature !== expected) {
    console.error("paystack-webhook: signature mismatch");
    return new Response("Unauthorized", { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  // Acknowledge anything that isn't a successful charge so Paystack
  // doesn't keep retrying it — there's nothing else here for this
  // function to act on (declines, transfers, disputes, etc).
  if (event?.event !== "charge.success") {
    return new Response("OK", { status: 200 });
  }

  const reference = event?.data?.reference;
  if (!reference) {
    return new Response("Missing reference", { status: 400 });
  }

  const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
  });
  const verifyJson = await verifyRes.json().catch(() => null);
  if (!verifyRes.ok || verifyJson?.data?.status !== "success") {
    console.error("paystack-webhook: verify did not confirm success", reference, verifyRes.status, verifyJson);
    // Acknowledged (200) rather than erroring — the webhook was valid,
    // the payment genuinely just isn't a confirmed success, so there's
    // nothing to retry into a different outcome.
    return new Response("Not a verified success", { status: 200 });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: booking, error: findError } = await admin
    .from("bookings")
    .select("id, status, total")
    .eq("paystack_reference", reference)
    .maybeSingle();

  if (findError || !booking) {
    console.error("paystack-webhook: no booking for reference", reference, findError);
    return new Response("Unknown reference", { status: 200 });
  }

  const paidGhs = Number(verifyJson.data.amount) / 100;
  if (Math.abs(paidGhs - Number(booking.total)) > 0.01) {
    console.error("paystack-webhook: amount mismatch", { reference, paidGhs, expected: booking.total });
    return new Response("Amount mismatch", { status: 200 });
  }

  if (booking.status === "confirmed") {
    return new Response("Already confirmed", { status: 200 });
  }

  const { error: updateError } = await admin
    .from("bookings")
    .update({ status: "confirmed", paid_at: new Date().toISOString() })
    .eq("id", booking.id);

  if (updateError) {
    console.error("paystack-webhook: failed to confirm booking", reference, updateError);
    return new Response("Update failed", { status: 500 });
  }

  return new Response("OK", { status: 200 });
});
