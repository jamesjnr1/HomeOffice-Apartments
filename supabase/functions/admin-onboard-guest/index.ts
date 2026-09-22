// admin-onboard-guest — manual "give this guest a dashboard account"
// action, for a booking that predates automatic account creation.
// book-and-pay's ensureGuestAccount only runs on the instant book &
// pay path — a booking confirmed the old way (AdminEnquiries' manual
// "Confirm booking" flow, before that automation existed) only got a
// guest_id if the guest happened to already have an account under the
// same email at that moment. This fills that gap on demand from
// AdminEnquiries/AdminBookings: creates a real account for the
// guest's email (or reuses one if it already exists), links it to
// this booking, and emails the same "you're set up" link book-and-pay
// sends — see notify-enquiry's "welcome_account" type.
//
// Auth: verify_jwt is ON — same reasoning as paystack-init: the
// booking is read with the CALLER's own token, so Row Level Security
// itself proves the caller is an owner/manager before any account
// gets created or linked — no separate role check needed here. The
// account creation + booking update that follows uses the service
// role, since anon/authenticated has no auth-admin access and no
// UPDATE grant on bookings beyond what RLS already covers for admins.
//
// Required secrets (shared with book-and-pay/notify-enquiry):
//   WEBHOOK_SECRET — same shared secret notify-enquiry already
//                    requires (Project Settings -> Edge Functions ->
//                    Secrets are project-wide, so this is already set
//                    if notify-enquiry works).
//   SITE_URL       — optional, same default as elsewhere.
//
// SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY are
// always available to edge functions automatically — nothing to set.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET");
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

// Identical to book-and-pay's ensureGuestAccount — kept as its own
// copy here rather than shared, matching how every edge function in
// this project already duplicates the bits it needs (e.g. the pricing
// constants mirrored from src/lib/pricing.js) instead of importing
// across function boundaries.
async function ensureGuestAccount(
  admin: ReturnType<typeof createClient>,
  email: string,
  name: string,
): Promise<string | null> {
  const { data: profile } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
  if (profile?.id) return profile.id;

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: crypto.randomUUID(),
    email_confirm: true,
    user_metadata: { full_name: name },
  });
  if (createError || !created?.user) {
    console.error("admin-onboard-guest: account creation failed", createError);
    return null;
  }

  const { error: profileError } = await admin
    .from("profiles")
    .upsert({ id: created.user.id, email, full_name: name }, { onConflict: "id" });
  if (profileError) {
    console.error("admin-onboard-guest: profiles upsert failed", profileError);
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: `${SITE_URL}/dashboard/profile` },
  });
  if (linkError || !linkData?.properties?.action_link) {
    console.error("admin-onboard-guest: recovery link generation failed", linkError);
    return created.user.id;
  }

  if (!WEBHOOK_SECRET) {
    console.error("admin-onboard-guest: WEBHOOK_SECRET is not set, skipping welcome email");
    return created.user.id;
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/notify-enquiry`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-webhook-secret": WEBHOOK_SECRET },
      body: JSON.stringify({
        type: "welcome_account",
        record: { guest_name: name, guest_email: email, action_link: linkData.properties.action_link },
      }),
    });
    if (!res.ok) console.error("admin-onboard-guest: welcome_account email failed", res.status, await res.text());
  } catch (err) {
    console.error("admin-onboard-guest: welcome_account email fetch error", err);
  }

  return created.user.id;
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

  const bookingId = body?.booking_id;
  if (!bookingId) {
    return json({ error: "Missing booking_id" }, 400);
  }

  // Reads with the CALLER's own token — RLS (bookings_admin_select)
  // only lets an owner/manager JWT see any row here, which is what
  // proves this request is allowed at all.
  const caller = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: booking, error: readError } = await caller
    .from("bookings")
    .select("id, guest_id, guest_name, guest_email")
    .eq("id", bookingId)
    .single();

  if (readError || !booking) {
    return json({ error: "Booking not found, or you don't have access to it." }, 404);
  }
  if (booking.guest_id) {
    return json({ ok: true, guest_id: booking.guest_id, already: true });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const guestId = await ensureGuestAccount(admin, booking.guest_email, booking.guest_name);
  if (!guestId) {
    return json({ error: "Couldn't create an account for this guest. Please try again." }, 500);
  }

  const { error: updateError } = await admin.from("bookings").update({ guest_id: guestId }).eq("id", bookingId);
  if (updateError) {
    console.error("admin-onboard-guest: booking update failed", updateError);
    return json({ error: "Account created, but couldn't link it to this booking." }, 500);
  }

  return json({ ok: true, guest_id: guestId });
});
