// notify-enquiry — sends an email to the admin the moment a new row lands
// in the `enquiries` table, replacing the old client-side Formspree POST.
//
// Called by a Postgres trigger (public.notify_new_enquiry, see
// supabase/migrations/20260909220000_notify_enquiry_by_email.sql), not
// directly by the browser — the guest's request never touches this
// function, so a flaky guest connection can no longer be the reason an
// enquiry goes unnoticed. The trigger fires from the database write
// itself, which is strictly more reliable than a second POST from the
// guest's browser succeeding.
//
// Auth: this function has verify_jwt disabled (it's invoked by pg_net,
// not a logged-in user) and instead checks a shared secret header that
// only the database trigger knows — see WEBHOOK_SECRET below. Without
// this, anyone who found this function's URL could trigger emails (and
// spend your Resend quota) at will.
//
// Required secrets (Project Settings -> Edge Functions -> Secrets, or
// `supabase secrets set --project-ref <ref> KEY=value`):
//   RESEND_API_KEY   — from resend.com (Dashboard -> API Keys)
//   WEBHOOK_SECRET    — must exactly match the value stored in Supabase
//                       Vault as 'enquiry_webhook_secret' by the migration
//   NOTIFY_TO         — optional, defaults to jamesduah@gmail.com below
//   RESEND_FROM       — optional, defaults to Resend's shared onboarding
//                       address (fine to start with, verify your own
//                       domain in Resend later for better deliverability)

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET");
const NOTIFY_TO = Deno.env.get("NOTIFY_TO") || "jamesduah@gmail.com";
const FROM_ADDRESS = Deno.env.get("RESEND_FROM") || "Home-Office Apartments <onboarding@resend.dev>";

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c] as string));
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!WEBHOOK_SECRET || req.headers.get("x-webhook-secret") !== WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  // The trigger sends { record: {...the new enquiries row...} }
  const e = payload?.record ?? payload ?? {};

  if (!RESEND_API_KEY) {
    console.error("notify-enquiry: RESEND_API_KEY is not set");
    return new Response("Email not configured", { status: 500 });
  }

  const subject = `New enquiry — ${e.name ?? "Guest"} (${e.check_in ?? "?"} → ${e.check_out ?? "?"})`;
  const html = `
    <h2 style="margin:0 0 12px">New enquiry from ${escapeHtml(e.name)}</h2>
    <p><strong>Email:</strong> ${escapeHtml(e.email)}</p>
    ${e.phone ? `<p><strong>Phone:</strong> ${escapeHtml(e.phone)}</p>` : ""}
    <p><strong>Dates:</strong> ${escapeHtml(e.check_in)} → ${escapeHtml(e.check_out)}</p>
    <p><strong>Guests:</strong> ${escapeHtml(e.guests)}</p>
    ${e.message ? `<p><strong>Message:</strong><br>${escapeHtml(e.message)}</p>` : ""}
    <p style="color:#666;font-size:13px;margin-top:20px">Reply to this email to reach the guest directly, or open the admin dashboard's Enquiries tab to confirm a booking.</p>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [NOTIFY_TO],
      reply_to: e.email || undefined,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("notify-enquiry: Resend error", res.status, text);
    return new Response("Email failed", { status: 502 });
  }

  return new Response("OK", { status: 200 });
});
