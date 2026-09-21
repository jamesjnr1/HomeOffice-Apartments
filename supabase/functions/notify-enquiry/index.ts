// notify-enquiry — sends the enquiry/booking notifications for three
// directions:
//   type "new_enquiry" (default, back-compat with the original single
//   purpose of this function) — emails the admin, and texts the admin's
//   phone via Arkesel, the moment a new row lands in `enquiries`,
//   replacing the old client-side Formspree POST.
//   type "declined" — emails the GUEST when an admin declines their
//   enquiry (e.g. the dates they asked for are already reserved), so
//   they hear back even if they don't have an account to see it on
//   their dashboard.
//   type "confirmed" — emails the GUEST the moment an admin turns their
//   enquiry into a real booking (AdminEnquiries.jsx's "Confirm
//   booking"), with the reference/dates/total for their records. Never
//   texts — the SMS alert is for the admin only, on the enquiry side.
//
// Called by Postgres triggers (public.notify_new_enquiry for enquiry
// inserts, public.notify_enquiry_declined for the decline case,
// public.notify_booking_confirmed for booking inserts — see
// supabase/migrations/20260909220000_notify_enquiry_by_email.sql,
// 20260910100200_notify_enquiry_declined.sql, and
// 20260921100000_notify_booking_confirmed.sql), not directly by the
// browser — the guest's/admin's request never touches this function,
// so a flaky connection can no longer be the reason a notification
// goes unnoticed. The trigger fires from the database write itself,
// which is strictly more reliable than a second request from a
// browser succeeding.
//
// Auth: this function has verify_jwt disabled (it's invoked by pg_net,
// not a logged-in user) and instead checks a shared secret header that
// only the database triggers know — see WEBHOOK_SECRET below. Without
// this, anyone who found this function's URL could trigger emails/SMS
// (and spend your Resend/Arkesel quota) at will.
//
// Required secrets (Project Settings -> Edge Functions -> Secrets, or
// `supabase secrets set --project-ref <ref> KEY=value`):
//   RESEND_API_KEY    — from resend.com (Dashboard -> API Keys)
//   WEBHOOK_SECRET     — must exactly match the value stored in Supabase
//                        Vault as 'enquiry_webhook_secret' by the migration
//   NOTIFY_TO          — optional, defaults to jamesd@home-officegroup.com
//                        below (admin email, used for type "new_enquiry" only)
//   RESEND_FROM        — optional, defaults to Resend's shared onboarding
//                        address (fine to start with, verify your own
//                        domain in Resend later for better deliverability)
//   ARKESEL_API_KEY    — from Arkesel (SMS Gateway -> API Keys). If unset,
//                        the SMS step is skipped (email still sends).
//   ARKESEL_SENDER_ID  — optional, defaults to "Home-Office" below (the
//                        registered Arkesel Sender ID). Must be 11
//                        characters or fewer; Arkesel may require it to
//                        be pre-registered.
//   NOTIFY_SMS_TO      — optional, defaults to 0206301032 below (admin's
//                        phone, used for type "new_enquiry" only)
//   SITE_URL           — optional, defaults to
//                        https://apartments.home-officegroup.com below —
//                        used to link back to the admin dashboard

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET");
const NOTIFY_TO = Deno.env.get("NOTIFY_TO") || "jamesd@home-officegroup.com";
const FROM_ADDRESS = Deno.env.get("RESEND_FROM") || "Home-Office Apartments <onboarding@resend.dev>";
const SITE_URL = Deno.env.get("SITE_URL") || "https://apartments.home-officegroup.com";

const ARKESEL_API_KEY = Deno.env.get("ARKESEL_API_KEY");
const ARKESEL_SENDER_ID = Deno.env.get("ARKESEL_SENDER_ID") || "Home-Office";
const NOTIFY_SMS_TO = Deno.env.get("NOTIFY_SMS_TO") || "0206301032";

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c] as string));
}

// Airbnb-style "Fri, 26 Sep 2026" — friendlier than a raw ISO date in
// an email a person is actually going to read.
function formatDateLong(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return escapeHtml(iso);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

// "26 Sep" — compact, for the SMS where every character counts.
function formatDateShort(iso: string | undefined): string {
  if (!iso) return "?";
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function nightsBetween(checkIn: string | undefined, checkOut: string | undefined): number | null {
  if (!checkIn || !checkOut) return null;
  const ms = new Date(`${checkOut}T00:00:00`).getTime() - new Date(`${checkIn}T00:00:00`).getTime();
  if (isNaN(ms)) return null;
  return Math.round(ms / 86400000);
}

function newEnquiryEmail(e: any) {
  const subject = `New enquiry — ${e.name ?? "Guest"} (${e.check_in ?? "?"} → ${e.check_out ?? "?"})`;
  const nights = nightsBetween(e.check_in, e.check_out);
  const nightsLabel = nights !== null ? ` (${nights} night${nights === 1 ? "" : "s"})` : "";

  const html = `
    <!doctype html>
    <html>
      <body style="margin:0;padding:0;background:#f4f5f3;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;color:#1f2b26;">
        <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
          <div style="background:#2d6a4f;border-radius:12px 12px 0 0;padding:22px 28px;">
            <div style="color:#fff;font-size:17px;font-weight:700;letter-spacing:-.01em;">Home-Office Apartments</div>
            <div style="color:#cfe3d7;font-size:12.5px;margin-top:2px;">New enquiry received</div>
          </div>
          <div style="background:#fff;border:1px solid #e8ebe8;border-top:0;border-radius:0 0 12px 12px;padding:28px;">
            <h1 style="margin:0 0 20px;font-size:19px;font-weight:600;">${escapeHtml(e.name) || "A guest"} wants to stay with you</h1>

            <table style="width:100%;border-collapse:collapse;font-size:14px;background:#f4f5f3;border-radius:10px;">
              <tr>
                <td style="padding:14px 16px 4px;color:#6a706d;width:90px;">Dates</td>
                <td style="padding:14px 16px 4px;font-weight:600;">${formatDateLong(e.check_in)} → ${formatDateLong(e.check_out)}${nightsLabel}</td>
              </tr>
              <tr>
                <td style="padding:4px 16px;color:#6a706d;">Guests</td>
                <td style="padding:4px 16px;font-weight:600;">${escapeHtml(e.guests) || "—"}</td>
              </tr>
              <tr>
                <td style="padding:4px 16px 14px;color:#6a706d;">Email</td>
                <td style="padding:4px 16px 14px;"><a href="mailto:${escapeHtml(e.email)}" style="color:#2d6a4f;text-decoration:none;">${escapeHtml(e.email)}</a></td>
              </tr>
              ${e.phone ? `
              <tr>
                <td style="padding:0 16px 14px;color:#6a706d;">Phone</td>
                <td style="padding:0 16px 14px;">${escapeHtml(e.phone)}</td>
              </tr>` : ""}
            </table>

            ${e.message ? `
            <div style="margin-top:20px;">
              <div style="color:#9aa19d;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px;">Message</div>
              <p style="margin:0;font-size:14px;line-height:1.5;white-space:pre-wrap;">${escapeHtml(e.message)}</p>
            </div>` : ""}

            <a href="${SITE_URL}/admin/enquiries" style="display:inline-block;margin-top:24px;background:#2d6a4f;color:#fff;text-decoration:none;padding:11px 22px;border-radius:8px;font-weight:600;font-size:14px;">Open in dashboard →</a>

            <p style="margin:22px 0 0;color:#9aa19d;font-size:12px;">Reply directly to this email to reach ${escapeHtml(e.name) || "the guest"} at ${escapeHtml(e.email)}.</p>
          </div>
        </div>
      </body>
    </html>
  `;
  return { to: NOTIFY_TO, subject, html, replyTo: e.email || undefined };
}

// Home-Office Apartment and LivingSpring Gardens & Apartment are two
// separate, independently-bookable units — bookings.apartment stores
// one of these two values directly (see supabase/migrations/
// 20260921090000_split_two_apartments.sql).
const APARTMENT_NAMES: Record<string, string> = {
  "home-office": "Home-Office Apartment",
  livingspring: "LivingSpring Gardens & Apartment",
};

function confirmedEmail(b: any) {
  const subject = `Booking confirmed — ${b.check_in ?? "?"} → ${b.check_out ?? "?"}`;
  const nights = nightsBetween(b.check_in, b.check_out);
  const nightsLabel = nights !== null ? ` (${nights} night${nights === 1 ? "" : "s"})` : "";
  const apartmentLabel = APARTMENT_NAMES[b.apartment] || "Home-Office Apartments";

  const html = `
    <!doctype html>
    <html>
      <body style="margin:0;padding:0;background:#f4f5f3;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;color:#1f2b26;">
        <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
          <div style="background:#2d6a4f;border-radius:12px 12px 0 0;padding:22px 28px;">
            <div style="color:#fff;font-size:17px;font-weight:700;letter-spacing:-.01em;">Home-Office Apartments</div>
            <div style="color:#cfe3d7;font-size:12.5px;margin-top:2px;">Booking confirmed</div>
          </div>
          <div style="background:#fff;border:1px solid #e8ebe8;border-top:0;border-radius:0 0 12px 12px;padding:28px;">
            <h1 style="margin:0 0 12px;font-size:19px;font-weight:600;">You're all set, ${escapeHtml(b.guest_name) || "there"}</h1>
            <p style="margin:0 0 20px;font-size:14px;line-height:1.5;color:#4a5450;">
              Your stay at ${escapeHtml(apartmentLabel)} is confirmed. Here are the details for your records.
            </p>

            <table style="width:100%;border-collapse:collapse;font-size:14px;background:#f4f5f3;border-radius:10px;">
              <tr>
                <td style="padding:14px 16px 4px;color:#6a706d;width:100px;">Reference</td>
                <td style="padding:14px 16px 4px;font-weight:600;">${escapeHtml(b.reference)}</td>
              </tr>
              <tr>
                <td style="padding:4px 16px;color:#6a706d;">Apartment</td>
                <td style="padding:4px 16px;font-weight:600;">${escapeHtml(apartmentLabel)}</td>
              </tr>
              <tr>
                <td style="padding:4px 16px;color:#6a706d;">Dates</td>
                <td style="padding:4px 16px;font-weight:600;">${formatDateLong(b.check_in)} → ${formatDateLong(b.check_out)}${nightsLabel}</td>
              </tr>
              <tr>
                <td style="padding:4px 16px;color:#6a706d;">Guests</td>
                <td style="padding:4px 16px;font-weight:600;">${escapeHtml(b.guests) || "—"}</td>
              </tr>
              <tr>
                <td style="padding:4px 16px 14px;color:#6a706d;">Total</td>
                <td style="padding:4px 16px 14px;font-weight:600;">GHS ${Number(b.total).toLocaleString()}</td>
              </tr>
            </table>

            <p style="margin:22px 0 0;color:#9aa19d;font-size:12px;">Questions before you arrive? Just reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
  // Reply-to is the admin's own notify address — this email goes TO
  // the guest, so a reply from them should land back with the admin,
  // same as declinedEmail below.
  return { to: b.guest_email, subject, html, replyTo: NOTIFY_TO };
}

function declinedEmail(e: any) {
  const subject = `About your enquiry — ${e.check_in ?? "?"} → ${e.check_out ?? "?"}`;
  const html = `
    <h2 style="margin:0 0 12px">Hi ${escapeHtml(e.name) || "there"},</h2>
    <p>Unfortunately we can't host you for <strong>${escapeHtml(e.check_in)} → ${escapeHtml(e.check_out)}</strong> — those dates are no longer available.</p>
    ${e.decline_reason ? `<p>${escapeHtml(e.decline_reason)}</p>` : ""}
    <p>We'd love to have you another time — feel free to send a new enquiry with different dates whenever you're ready.</p>
    <p style="color:#666;font-size:13px;margin-top:20px">— Home-Office Apartments</p>
  `;
  // Reply-to is the admin's own notify address here, not the guest's —
  // this email goes TO the guest, so a reply from them should land
  // back with the admin, same as it would if they'd emailed directly.
  return { to: e.email, subject, html, replyTo: NOTIFY_TO };
}

// A local Ghana number (0XXXXXXXXX) becomes 233XXXXXXXXX — the
// international format Arkesel expects, without a leading '+'.
function toArkeselRecipient(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return `233${digits.slice(1)}`;
  if (digits.startsWith("233")) return digits;
  return digits;
}

// Shared low-level sender — posts one SMS via Arkesel and reports back
// what actually happened (status + raw body), rather than swallowing
// it, so a caller that needs to know (the test endpoint below) can.
async function sendSms(to: string, message: string): Promise<{ ok: boolean; status: number; body: string }> {
  const res = await fetch("https://sms.arkesel.com/api/v2/sms/send", {
    method: "POST",
    headers: {
      "api-key": ARKESEL_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: ARKESEL_SENDER_ID,
      message,
      recipients: [toArkeselRecipient(to)],
    }),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text };
}

// Best-effort — a guest's enquiry should never be lost or delayed
// because the SMS side had a problem. Every failure is logged and
// swallowed here rather than surfaced to the caller.
async function sendEnquirySms(e: any): Promise<void> {
  if (!ARKESEL_API_KEY) {
    console.error("notify-enquiry: ARKESEL_API_KEY is not set, skipping SMS");
    return;
  }
  const dateRange = `${formatDateShort(e.check_in)}-${formatDateShort(e.check_out)}`;
  const message =
    `New booking request (Site): ${e.name || "Guest"}, ${dateRange}, ${e.guests || "?"} guest(s). ` +
    `Confirm: ${SITE_URL}/admin/enquiries`;

  try {
    const result = await sendSms(NOTIFY_SMS_TO, message);
    if (!result.ok) {
      console.error("notify-enquiry: Arkesel SMS error", result.status, result.body);
    }
  } catch (err) {
    console.error("notify-enquiry: Arkesel SMS fetch error", err);
  }
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

  // A manual, ops-only check: sends one real SMS to an arbitrary number
  // and reports back exactly what Arkesel said, so a delivery problem
  // can be diagnosed directly from the response instead of digging
  // through logs. Never triggered by application code — only ever
  // called by hand (e.g. via SQL's net.http_post, same auth as above).
  if (payload?.type === "sms_test") {
    if (!ARKESEL_API_KEY) {
      return new Response(JSON.stringify({ error: "ARKESEL_API_KEY is not set" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!payload?.to) {
      return new Response(JSON.stringify({ error: "Missing 'to' phone number" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const message = payload?.message || "Home-Office Apartments: this is a test SMS.";
    const result = await sendSms(payload.to, message);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const type =
    payload?.type === "declined" ? "declined" :
    payload?.type === "confirmed" ? "confirmed" :
    "new_enquiry";
  const e = payload?.record ?? payload ?? {};

  if (!RESEND_API_KEY) {
    console.error("notify-enquiry: RESEND_API_KEY is not set");
    return new Response("Email not configured", { status: 500 });
  }

  // "declined" reads the guest's address off enquiries.email;
  // "confirmed" off bookings.guest_email — different column names,
  // same guest-facing purpose.
  if (type === "declined" && !e.email) {
    console.error("notify-enquiry: declined event with no guest email, nothing to send to");
    return new Response("No recipient", { status: 400 });
  }
  if (type === "confirmed" && !e.guest_email) {
    console.error("notify-enquiry: confirmed event with no guest email, nothing to send to");
    return new Response("No recipient", { status: 400 });
  }

  const { to, subject, html, replyTo } =
    type === "declined" ? declinedEmail(e) :
    type === "confirmed" ? confirmedEmail(e) :
    newEnquiryEmail(e);

  const emailPromise = fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [to],
      reply_to: replyTo,
      subject,
      html,
    }),
  });

  // The SMS is a supplementary channel only for the admin-facing "new
  // enquiry" alert — a declined-enquiry email goes to the guest, who
  // never gets a text either way.
  const smsPromise = type === "new_enquiry" ? sendEnquirySms(e) : Promise.resolve();

  const [res] = await Promise.all([emailPromise, smsPromise]);

  if (!res.ok) {
    const text = await res.text();
    console.error("notify-enquiry: Resend error", res.status, text);
    return new Response("Email failed", { status: 502 });
  }

  return new Response("OK", { status: 200 });
});
