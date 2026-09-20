// sync-airbnb-calendar — pulls the Airbnb listing's iCal export feed
// and stores its busy date ranges in public.external_calendar_blocks,
// so is_date_range_available() (used by the Book page's proactive
// availability check) also treats Airbnb-booked dates as unavailable.
//
// Called on a schedule by a pg_cron job (see
// supabase/migrations/<timestamp>_airbnb_sync_schedule.sql), not
// directly by a browser — same shared-secret pattern as
// notify-enquiry, so the endpoint can't be triggered by an arbitrary
// caller and burn through fetches against Airbnb's calendar export.
//
// Required secrets (Project Settings -> Edge Functions -> Secrets):
//   AIRBNB_ICAL_URL   — the listing's calendar EXPORT url, from Airbnb
//                       host dashboard: Listing -> Availability ->
//                       Availability settings -> Sync calendars ->
//                       Export calendar
//   SYNC_SECRET       — must exactly match the value stored in
//                       Supabase Vault as 'airbnb_sync_secret' by the
//                       migration
//
// Also uses the default SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
// secrets every edge function gets automatically, to write with a
// client that bypasses RLS (external_calendar_blocks has no INSERT/
// UPDATE/DELETE policy for any role — only this function writes it).

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const AIRBNB_ICAL_URL = Deno.env.get("AIRBNB_ICAL_URL");
const SYNC_SECRET = Deno.env.get("SYNC_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!SYNC_SECRET || req.headers.get("x-webhook-secret") !== SYNC_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!AIRBNB_ICAL_URL) {
    console.error("sync-airbnb-calendar: AIRBNB_ICAL_URL is not set");
    return new Response("Not configured", { status: 500 });
  }

  const icsRes = await fetch(AIRBNB_ICAL_URL);
  if (!icsRes.ok) {
    console.error("sync-airbnb-calendar: fetch failed", icsRes.status);
    return new Response("Fetch failed", { status: 502 });
  }
  const ics = await icsRes.text();
  const events = parseEvents(ics).filter((e) => e.end > e.start);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  if (events.length > 0) {
    const { error: upsertError } = await supabase
      .from("external_calendar_blocks")
      .upsert(
        events.map((e) => ({
          source: "airbnb",
          uid: e.uid,
          start_date: e.start,
          end_date: e.end,
          summary: e.summary,
          synced_at: new Date().toISOString(),
        })),
        { onConflict: "source,uid" }
      );
    if (upsertError) {
      console.error("sync-airbnb-calendar: upsert error", upsertError.message);
      return new Response("Upsert failed", { status: 500 });
    }
  }

  // Drop rows for events that disappeared from the feed (e.g. a
  // cancelled Airbnb reservation) so they stop blocking dates here.
  // Diffed in JS and deleted by an explicit uid list (rather than a
  // hand-built NOT IN string) so a UID containing a comma or quote
  // can't produce a malformed or unintended filter.
  const currentUids = new Set(events.map((e) => e.uid));
  const { data: existingRows, error: existingError } = await supabase
    .from("external_calendar_blocks")
    .select("uid")
    .eq("source", "airbnb");
  if (existingError) {
    console.error("sync-airbnb-calendar: fetch existing uids error", existingError.message);
  } else {
    const staleUids = (existingRows ?? [])
      .map((r) => r.uid)
      .filter((uid) => !currentUids.has(uid));
    if (staleUids.length > 0) {
      const { error: deleteError } = await supabase
        .from("external_calendar_blocks")
        .delete()
        .eq("source", "airbnb")
        .in("uid", staleUids);
      if (deleteError) {
        console.error("sync-airbnb-calendar: cleanup delete error", deleteError.message);
      }
    }
  }

  return new Response(JSON.stringify({ synced: events.length }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
