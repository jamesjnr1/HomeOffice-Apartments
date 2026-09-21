// sync-airbnb-calendar — pulls one or two Airbnb listings' iCal export
// feeds and stores their busy date ranges in
// public.external_calendar_blocks, so is_date_range_available() (used
// by the Book page's proactive availability check) also treats
// Airbnb-booked dates as unavailable.
//
// Home-Office Apartment and LivingSpring Gardens & Apartment are two
// SEPARATE, independently-bookable units in the same building, each
// with its own Airbnb listing/feed (see supabase/migrations/
// 20260921090000_split_two_apartments.sql for the full correction —
// an earlier version of this comment wrongly assumed one physical
// apartment double-listed on Airbnb). Each feed's rows are tagged with
// their own `source` and never cross-block the other unit's dates.
//
// Called on a schedule by a pg_cron job (see
// supabase/migrations/<timestamp>_airbnb_sync_schedule.sql), not
// directly by a browser — same shared-secret pattern as
// notify-enquiry, so the endpoint can't be triggered by an arbitrary
// caller and burn through fetches against Airbnb's calendar export.
//
// Required secrets (Project Settings -> Edge Functions -> Secrets):
//   AIRBNB_ICAL_URL    — the first listing's calendar EXPORT url, from
//                        Airbnb host dashboard: Listing -> Availability
//                        -> Availability settings -> Sync calendars ->
//                        Export calendar
//   AIRBNB_ICAL_URL_2  — the second listing's calendar EXPORT url,
//                        same place, for the other listing. Optional —
//                        if unset, only the first feed is synced.
//   SYNC_SECRET        — must exactly match the value stored in
//                        Supabase Vault as 'airbnb_sync_secret' by the
//                        migration
//
// Also uses the default SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
// secrets every edge function gets automatically, to write with a
// client that bypasses RLS (external_calendar_blocks has no INSERT/
// UPDATE/DELETE policy for any role — only this function writes it).
//
// Also reads ARKESEL_API_KEY / ARKESEL_SENDER_ID / NOTIFY_SMS_TO —
// the same secrets already set for notify-enquiry's SMS alert (Edge
// Function secrets are project-wide, not per-function, so nothing
// extra needs setting here). Used to text the admin the moment a
// brand-new Airbnb reservation is first seen in either feed.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Each listing gets its own `source` label ("airbnb" / "airbnb-2") so a
// listing's rows can be cleaned up independently — if one feed fails
// to fetch on a given run, its previously-synced blocks must be left
// alone rather than wrongly treated as stale and deleted, which would
// briefly reopen those dates for double-booking.
const AIRBNB_FEEDS = [
  { source: "airbnb", url: Deno.env.get("AIRBNB_ICAL_URL") },
  { source: "airbnb-2", url: Deno.env.get("AIRBNB_ICAL_URL_2") },
].filter((f): f is { source: string; url: string } => !!f.url);
const SYNC_SECRET = Deno.env.get("SYNC_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const ARKESEL_API_KEY = Deno.env.get("ARKESEL_API_KEY");
const ARKESEL_SENDER_ID = Deno.env.get("ARKESEL_SENDER_ID") || "Home-Office";
const NOTIFY_SMS_TO = Deno.env.get("NOTIFY_SMS_TO") || "0206301032";

// Airbnb's export feed uses all-day events: DTSTART;VALUE=DATE:20261101
// and DTEND;VALUE=DATE:20261103 (end is exclusive, same convention as
// this app's own `bookings.check_out`). Unfold folded lines (a line
// starting with a space/tab continues the previous one) before
// parsing, per the iCalendar spec — Airbnb's SUMMARY lines can fold.
function unfold(ics: string): string[] {
  const rawLines = ics.split(/\r\n|\n|\r/);
  const lines: string[] = [];
  for (const line of rawLines) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && lines.length > 0) {
      lines[lines.length - 1] += line.slice(1);
    } else {
      lines.push(line);
    }
  }
  return lines;
}

function parseIcsDate(value: string): string | null {
  // VALUE=DATE form: 20261101 -> 2026-11-01
  const m = value.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

type BusyRange = { uid: string; start: string; end: string; summary: string | null };

function parseEvents(ics: string): BusyRange[] {
  const lines = unfold(ics);
  const events: BusyRange[] = [];
  let cur: Partial<BusyRange> & { start?: string; end?: string } | null = null;

  for (const line of lines) {
    if (line.startsWith("BEGIN:VEVENT")) {
      cur = {};
    } else if (line.startsWith("END:VEVENT")) {
      if (cur?.uid && cur.start && cur.end) {
        events.push({ uid: cur.uid, start: cur.start, end: cur.end, summary: cur.summary ?? null });
      }
      cur = null;
    } else if (cur) {
      const [rawKey, ...rest] = line.split(":");
      const value = rest.join(":");
      const key = rawKey.split(";")[0];
      if (key === "UID") cur.uid = value.trim();
      else if (key === "SUMMARY") cur.summary = value.trim();
      else if (key === "DTSTART") { const d = parseIcsDate(value.trim()); if (d) cur.start = d; }
      else if (key === "DTEND") { const d = parseIcsDate(value.trim()); if (d) cur.end = d; }
    }
  }
  return events;
}

// "26 Sep" — compact, for the SMS where every character counts.
function formatDateShort(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// A local Ghana number (0XXXXXXXXX) becomes 233XXXXXXXXX — the
// international format Arkesel expects, without a leading '+'.
function toArkeselRecipient(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return `233${digits.slice(1)}`;
  if (digits.startsWith("233")) return digits;
  return digits;
}

// Home-Office Apartment and LivingSpring Gardens & Apartment are two
// separate, independently-bookable units in the same building, each
// with its own Airbnb listing/feed (see supabase/migrations/
// 20260921090000_split_two_apartments.sql) — name the actual unit in
// the text instead of a generic "Airbnb", so the admin knows which
// one without needing to open the dashboard.
const APARTMENT_NAMES: Record<string, string> = {
  airbnb: "Home-Office Apartment",
  "airbnb-2": "LivingSpring Gardens & Apartment",
};

// Best-effort, same as notify-enquiry's own SMS step — a sync run
// should never fail or roll back over a text message not going out.
async function sendNewBookingSms(range: BusyRange, source: string): Promise<void> {
  if (!ARKESEL_API_KEY) return;
  const apartmentLabel = APARTMENT_NAMES[source] || "Airbnb";
  const message =
    `New booking (${apartmentLabel}): ${formatDateShort(range.start)}-${formatDateShort(range.end)}` +
    (range.summary ? ` (${range.summary})` : "");
  try {
    const res = await fetch("https://sms.arkesel.com/api/v2/sms/send", {
      method: "POST",
      headers: {
        "api-key": ARKESEL_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: ARKESEL_SENDER_ID,
        message,
        recipients: [toArkeselRecipient(NOTIFY_SMS_TO)],
      }),
    });
    if (!res.ok) {
      console.error("sync-airbnb-calendar: Arkesel SMS error", res.status, await res.text());
    }
  } catch (err) {
    console.error("sync-airbnb-calendar: Arkesel SMS fetch error", err);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!SYNC_SECRET || req.headers.get("x-webhook-secret") !== SYNC_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (AIRBNB_FEEDS.length === 0) {
    console.error("sync-airbnb-calendar: AIRBNB_ICAL_URL is not set");
    return new Response("Not configured", { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  let totalSynced = 0;
  let failures = 0;

  for (const feed of AIRBNB_FEEDS) {
    let ics: string;
    try {
      const icsRes = await fetch(feed.url);
      if (!icsRes.ok) {
        console.error("sync-airbnb-calendar: fetch failed", feed.source, icsRes.status);
        failures++;
        continue; // leave this listing's existing rows untouched
      }
      ics = await icsRes.text();
    } catch (err) {
      console.error("sync-airbnb-calendar: fetch error", feed.source, err);
      failures++;
      continue;
    }

    const events = parseEvents(ics).filter((e) => e.end > e.start);
    totalSynced += events.length;

    // Fetched once, before upserting, so the same snapshot answers two
    // questions: which of today's events are genuinely new (not in this
    // set — worth a text) and which previously-synced rows disappeared
    // from the feed entirely (also not in today's events — stale,
    // cleaned up below). Upserting doesn't remove anything in between,
    // so one query correctly serves both.
    const { data: existingRows, error: existingError } = await supabase
      .from("external_calendar_blocks")
      .select("uid")
      .eq("source", feed.source);
    if (existingError) {
      console.error("sync-airbnb-calendar: fetch existing uids error", feed.source, existingError.message);
      failures++;
      continue;
    }
    const existingUids = new Set((existingRows ?? []).map((r) => r.uid));
    const newEvents = events.filter((e) => !existingUids.has(e.uid));

    if (events.length > 0) {
      const { error: upsertError } = await supabase
        .from("external_calendar_blocks")
        .upsert(
          events.map((e) => ({
            source: feed.source,
            uid: e.uid,
            start_date: e.start,
            end_date: e.end,
            summary: e.summary,
            synced_at: new Date().toISOString(),
          })),
          { onConflict: "source,uid" }
        );
      if (upsertError) {
        console.error("sync-airbnb-calendar: upsert error", feed.source, upsertError.message);
        failures++;
        continue; // don't run cleanup/SMS below on a failed upsert
      }
    }

    // Text the admin about each newly-seen reservation — not on every
    // 3-hourly resync of ones already known, only the first time a UID
    // shows up in this feed.
    for (const e of newEvents) {
      await sendNewBookingSms(e, feed.source);
    }

    // Drop rows for events that disappeared from this feed (e.g. a
    // cancelled Airbnb reservation) so they stop blocking dates here.
    // Scoped to this feed's own `source` label, and to feeds that
    // fetched successfully — cleanup never runs against a listing
    // whose fetch/upsert just failed above. Diffed in JS and deleted
    // by an explicit uid list (rather than a hand-built NOT IN string)
    // so a UID containing a comma or quote can't produce a malformed
    // or unintended filter.
    const currentUids = new Set(events.map((e) => e.uid));
    const staleUids = [...existingUids].filter((uid) => !currentUids.has(uid));
    if (staleUids.length > 0) {
      const { error: deleteError } = await supabase
        .from("external_calendar_blocks")
        .delete()
        .eq("source", feed.source)
        .in("uid", staleUids);
      if (deleteError) {
        console.error("sync-airbnb-calendar: cleanup delete error", feed.source, deleteError.message);
      }
    }
  }

  if (failures === AIRBNB_FEEDS.length) {
    return new Response("Fetch failed", { status: 502 });
  }

  // `feeds` names which listings were actually attempted this run —
  // never the URLs themselves — so a missing second listing shows up
  // immediately as ["airbnb"] instead of silently looking identical to
  // a listing with zero current reservations.
  return new Response(JSON.stringify({ synced: totalSynced, failures, feeds: AIRBNB_FEEDS.map((f) => f.source) }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
