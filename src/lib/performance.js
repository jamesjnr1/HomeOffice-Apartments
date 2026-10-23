// performance.js — monthly performance metrics for the admin Performance
// page (src/pages/admin/AdminRevenue.jsx), computed from the raw rows so
// every number can be traced back to bookings / calendar blocks.
//
// Occupancy is worked out night by night, per apartment, so a night is
// only ever counted once even when it appears in more than one place
// (our own calendar is exported to Airbnb, so a site booking comes back
// in Airbnb's feed as "Not available"). Each night goes to the first
// match in this order:
//   1. a paid site booking (confirmed / completed)
//   2. an Airbnb reservation ("Reserved")
//   3. a Booking.com reservation (its feed marks them "CLOSED - Not available")
//   4. an Airbnb "Not available" block — nights blocked without a guest
//      (set by hand, or imported from another calendar). Shown separately
//      as "blocked" and NOT counted as occupied, since there may be no guest.
//
// Money only comes from site bookings: Airbnb and Booking.com calendar
// feeds carry dates, not prices. A stay's total is spread evenly over its
// nights, so a stay crossing two months counts in each month for the
// nights it spends there ("earned"). "Received" is cash by payment date.

import { CALENDAR_SOURCES } from './apartments.js';

export const UNITS = ['home-office', 'livingspring'];
const PAID = new Set(['confirmed', 'completed']);

const pad = (n) => String(n).padStart(2, '0');
export const monthKey = (y, m) => `${y}-${pad(m + 1)}`; // m is 0-based
export const daysInMonth = (y, m) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

function addDays(iso, n) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  return Math.round((new Date(`${b}T00:00:00Z`) - new Date(`${a}T00:00:00Z`)) / 86400000);
}

// Every night of a stay, as YYYY-MM-DD (check-out day excluded).
function nightsOf(start, end) {
  const out = [];
  for (let d = start; d < end; d = addDays(d, 1)) out.push(d);
  return out;
}

function blockKind(block) {
  const channel = CALENDAR_SOURCES[block.source]?.channel || 'Airbnb';
  if (channel === 'Booking.com') return 'bookingcom';
  return /not available/i.test(block.summary || '') ? 'blocked' : 'airbnb';
}

const RANK = { site: 0, airbnb: 1, bookingcom: 2, blocked: 3 };

// Map "apartment|YYYY-MM-DD" -> { kind, bookingId? } for every night.
export function buildNightMap(bookings, blocks) {
  const map = new Map();
  const claim = (apartment, night, entry) => {
    const key = `${apartment}|${night}`;
    const cur = map.get(key);
    if (!cur || RANK[entry.kind] < RANK[cur.kind]) map.set(key, entry);
  };
  for (const b of bookings) {
    if (!PAID.has(b.status) || !b.check_in || !b.check_out) continue;
    for (const n of nightsOf(b.check_in, b.check_out)) claim(b.apartment, n, { kind: 'site', bookingId: b.id });
  }
  for (const bl of blocks) {
    const apartment = CALENDAR_SOURCES[bl.source]?.apartment;
    if (!apartment || !bl.start_date || !bl.end_date) continue;
    const kind = blockKind(bl);
    for (const n of nightsOf(bl.start_date, bl.end_date)) claim(apartment, n, { kind });
  }
  return map;
}

const inMonth = (iso, key) => typeof iso === 'string' && iso.slice(0, 7) === key;

// All metrics for one calendar month. `data` = { bookings, blocks,
// enquiries, visits } as loaded by the page; `nightMap` from buildNightMap.
export function monthMetrics(y, m, data, nightMap) {
  const key = monthKey(y, m);
  const days = daysInMonth(y, m);
  const first = `${key}-01`;
  const nights = nightsOf(first, addDays(first, days));

  const perUnit = {};
  for (const unit of UNITS) {
    const u = { available: days, site: 0, airbnb: 0, bookingcom: 0, blocked: 0, revenue: 0 };
    for (const n of nights) {
      const e = nightMap.get(`${unit}|${n}`);
      if (e) u[e.kind] += 1;
    }
    u.occupied = u.site + u.airbnb + u.bookingcom;
    u.occupancy = u.available ? u.occupied / u.available : 0;
    perUnit[unit] = u;
  }

  // Revenue earned in the month: each paid site stay's total spread over
  // its nights, counting only nights inside this month.
  const paidStays = data.bookings.filter((b) => PAID.has(b.status) && b.check_in && b.check_out);
  let earned = 0;
  for (const b of paidStays) {
    const total = Number(b.total) || 0;
    const stayNights = daysBetween(b.check_in, b.check_out);
    if (stayNights <= 0) continue;
    const here = nightsOf(b.check_in, b.check_out).filter((n) => inMonth(n, key)).length;
    const share = (total / stayNights) * here;
    earned += share;
    if (perUnit[b.apartment]) perUnit[b.apartment].revenue += share;
  }

  // Cash received in the month, by payment date, split by method.
  const paidThisMonth = paidStays.filter((b) => inMonth(b.paid_at, key));
  const received = paidThisMonth.reduce((s, b) => s + (Number(b.total) || 0), 0);
  const byMethod = { paystack: 0, on_site: 0, mobile_money: 0, other: 0 };
  for (const b of paidThisMonth) {
    const k = byMethod[b.payment_method] !== undefined ? b.payment_method : 'other';
    byMethod[k] += Number(b.total) || 0;
  }

  const totals = UNITS.reduce((t, unit) => {
    for (const k of ['available', 'site', 'airbnb', 'bookingcom', 'blocked', 'occupied']) t[k] = (t[k] || 0) + perUnit[unit][k];
    return t;
  }, {});

  // Arrivals: stays that start this month, by channel. Airbnb "Not
  // available" blocks aren't stays, and blocks that mirror one of our
  // own site bookings are skipped (their first night belongs to it).
  const arrivals = { site: 0, airbnb: 0, bookingcom: 0 };
  const stayLengths = [];
  for (const b of paidStays) {
    if (!inMonth(b.check_in, key)) continue;
    arrivals.site += 1;
    stayLengths.push(daysBetween(b.check_in, b.check_out));
  }
  for (const bl of data.blocks) {
    if (!inMonth(bl.start_date, key)) continue;
    const kind = blockKind(bl);
    if (kind === 'blocked') continue;
    const apartment = CALENDAR_SOURCES[bl.source]?.apartment;
    if (nightMap.get(`${apartment}|${bl.start_date}`)?.kind !== kind) continue;
    arrivals[kind] += 1;
    stayLengths.push(daysBetween(bl.start_date, bl.end_date));
  }
  const arrivalsTotal = arrivals.site + arrivals.airbnb + arrivals.bookingcom;

  // Lead time: days between booking on the site and arriving, for paid
  // site bookings arriving this month.
  const leads = paidStays
    .filter((b) => inMonth(b.check_in, key) && b.created_at)
    .map((b) => Math.max(0, daysBetween(b.created_at.slice(0, 10), b.check_in)));

  const createdThisMonth = data.bookings.filter((b) => inMonth(b.created_at, key));
  const sessions = new Set();
  let pageViews = 0;
  for (const v of data.visits) {
    if (!inMonth(v.created_at, key)) continue;
    pageViews += 1;
    if (v.session_id) sessions.add(v.session_id);
  }

  const avg = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);

  return {
    key,
    days,
    perUnit,
    nights: totals,
    occupancy: totals.available ? totals.occupied / totals.available : 0,
    earned,
    received,
    byMethod,
    adr: totals.site ? earned / totals.site : null,
    revpar: totals.available ? earned / totals.available : 0,
    arrivals,
    arrivalsTotal,
    avgStay: avg(stayLengths),
    avgLead: avg(leads),
    newPaidBookings: createdThisMonth.filter((b) => PAID.has(b.status)).length,
    unpaidCheckouts: createdThisMonth.filter((b) => b.status === 'awaiting_payment').length,
    cancellations: createdThisMonth.filter((b) => b.status === 'cancelled').length,
    enquiries: data.enquiries.filter((e) => inMonth(e.created_at, key)).length,
    visitors: sessions.size,
    pageViews,
  };
}

// Percentage change from `prev` to `cur`, or null when there's no base.
export function change(cur, prev) {
  if (cur == null || prev == null || prev === 0) return null;
  return (cur - prev) / prev;
}
