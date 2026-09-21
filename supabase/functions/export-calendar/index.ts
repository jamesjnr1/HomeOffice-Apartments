// export-calendar — serves this site's confirmed bookings as a public
// .ics feed, for the host to paste into Airbnb's "Import calendar"
// field (Listing -> Availability -> Sync calendars -> Import
// calendar), so Airbnb blocks dates already booked directly through
// this site.
//
// Home-Office Apartment and LivingSpring Gardens & Apartment are two
// separate, independently-bookable units in the same building, each
// with its OWN Airbnb listing (see supabase/migrations/
// 20260921090000_split_two_apartments.sql) — so this feed is scoped
// per apartment via a required ?apartment= query param. Importing the
// wrong apartment's feed into a listing would incorrectly block that
// listing's calendar for a booking that's actually for the other unit.
//
//   ?apartment=home-office   -> Home-Office Apartment's bookings only
//   ?apartment=livingspring  -> LivingSpring Gardens & Apartment's only
//
// Public and unauthenticated on purpose (verify_jwt disabled) —
// that's how every calendar-sync integration works: the other side
// (Airbnb) just does a plain GET with no credentials, on its own
// schedule. Only check-in/check-out dates are exposed, deliberately
// never the guest's name/email/phone, since this URL isn't secret.
//
// Uses the default SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY secrets
// every edge function gets automatically, to read with a client that
// bypasses RLS (bookings is normally admin-only-readable).

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const VALID_APARTMENTS = ["home-office", "livingspring"];

function toIcsDate(d: string): string {
  return d.replaceAll("-", "");
}

function foldLine(line: string): string {
  // iCalendar lines should be folded at 75 octets; SUMMARY here is
  // always short ("Reserved"), but fold defensively anyway.
  if (line.length <= 75) return line;
  let out = line.slice(0, 75);
  let rest = line.slice(75);
  while (rest.length > 0) {
    out += "\r\n " + rest.slice(0, 74);
    rest = rest.slice(74);
  }
  return out;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const apartment = new URL(req.url).searchParams.get("apartment");
  if (!apartment || !VALID_APARTMENTS.includes(apartment)) {
    return new Response(
      `Missing or invalid ?apartment= (expected one of: ${VALID_APARTMENTS.join(", ")})`,
      { status: 400 }
    );
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("id, check_in, check_out, status")
    .eq("apartment", apartment)
    .in("status", ["pending", "confirmed", "completed"]);

  if (error) {
    console.error("export-calendar: query error", error.message);
    return new Response("Query failed", { status: 500 });
  }

  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Home-Office Apartments//Booking Sync//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const b of bookings ?? []) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:home-office-${b.id}@home-officegroup.com`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${toIcsDate(b.check_in)}`,
      `DTEND;VALUE=DATE:${toIcsDate(b.check_out)}`,
      foldLine("SUMMARY:Reserved"),
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");

  return new Response(lines.join("\r\n") + "\r\n", {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "public, max-age=1800",
    },
  });
});
