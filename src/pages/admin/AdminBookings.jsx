import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, parseISO, differenceInCalendarDays } from 'date-fns';
import { List, CalendarDays, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import Receipt from '../../components/Receipt';
import StatusBadge from '../../components/StatusBadge';
import { supabase } from '../../lib/supabase';
import { APARTMENTS, apartmentName } from '../../lib/apartments';

// external_calendar_blocks doesn't have its own apartment column — the
// mapping is the Airbnb source label itself (see supabase/migrations/
// 20260921090000_split_two_apartments.sql): the first listing synced
// ('airbnb') is Home-Office Apartment, the second ('airbnb-2') is
// LivingSpring Gardens & Apartment.
function sourceApartment(source) {
  return source === 'airbnb-2' ? 'livingspring' : 'home-office';
}

// Status filter tabs, most-actionable first — an admin opening this
// page usually wants "what needs attention" (awaiting payment) before
// "what's already settled" (confirmed) or "what's already happened"
// (past), not one flat list mixing all of that with Airbnb rows and
// cancellations. Unlike the other tabs, "past" isn't a status filter
// at all — it's a DATE filter (check_out/end_date before today) that
// includes Airbnb reservations too, since those never have a
// `bookings.status` of their own. Covers BOTH apartments — the query
// below never filters by apartment, so this isn't scoped to one unit.
const TABS = ['all', 'awaiting_payment', 'confirmed', 'past', 'cancelled'];
const TAB_LABELS = { all: 'All', awaiting_payment: 'Awaiting payment', confirmed: 'Confirmed', past: 'Past', cancelled: 'Cancelled' };

/**
 * AdminBookings — real rows from the `bookings` table, now mostly
 * created automatically by the public book-and-pay flow (see
 * supabase/functions/book-and-pay/index.ts) rather than an admin
 * manually confirming an enquiry — that manual path still exists for
 * the enquiries that need it (see AdminEnquiries.jsx). Kept live via a
 * realtime subscription, same pattern as messages/enquiries.
 *
 * Also pulls in `external_calendar_blocks` — the dates
 * sync-airbnb-calendar has pulled from the Airbnb listing's iCal feed
 * (see supabase/migrations/20260920200000_airbnb_calendar_sync.sql) —
 * so the admin can see every reservation blocking the calendar, not
 * just the ones that came through this site. Airbnb doesn't share
 * guest identity in its calendar export, so those rows never have a
 * name/email/total — only the date range.
 */

export default function AdminBookings() {
  const [view, setView] = useState('list');
  const [tab, setTab] = useState('all');
  const [month, setMonth] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [airbnbBlocks, setAirbnbBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [receiptBooking, setReceiptBooking] = useState(null);

  useEffect(() => {
    loadBookings();
    loadAirbnbBlocks();

    const sub = supabase
      .channel('admin-bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, loadBookings)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'external_calendar_blocks' }, loadAirbnbBlocks)
      .subscribe();

    return () => { supabase.removeChannel(sub); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('check_in', { ascending: false });

      if (!error && data) setBookings(data);
    } catch {
      // A network-level failure would otherwise leave this stuck on
      // "Loading…" forever.
    } finally {
      setLoading(false);
    }
  };

  const loadAirbnbBlocks = async () => {
    try {
      const { data, error } = await supabase
        .from('external_calendar_blocks')
        .select('*')
        .order('start_date', { ascending: false });

      if (!error && data) setAirbnbBlocks(data);
    } catch {
      // Non-critical — the calendar/list just won't show Airbnb rows.
    }
  };

  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const startPad = (getDay(days[0]) + 6) % 7; // Mon-start

  const bookingsOnDay = (day) => bookings.filter(b => {
    const ci = parseISO(b.check_in);
    const co = parseISO(b.check_out);
    return day >= ci && day < co;
  });

  const airbnbBlocksOnDay = (day) => airbnbBlocks.filter(x => {
    const s = parseISO(x.start_date);
    const e = parseISO(x.end_date);
    return day >= s && day < e;
  });

  // Today as a 'YYYY-MM-DD' string — check_in/check_out/start_date/
  // end_date are all stored the same way, so plain string comparison
  // is safe and avoids a timezone-sensitive Date construction here.
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const rowDates = (r) => (r.kind === 'site' ? [r.check_in, r.check_out] : [r.start_date, r.end_date]);
  const isPast = (r) => rowDates(r)[1] < todayStr;

  // A guest currently in-house (check-in has passed, check-out
  // hasn't) is the one thing worth calling out at a glance, on either
  // source — this is date-derived, independent of a site booking's
  // own `status`, so a `confirmed` booking still gets highlighted
  // once the guest has actually arrived.
  const dateState = (r) => {
    const [start, end] = rowDates(r);
    if (end < todayStr) return 'past';
    if (start <= todayStr) return 'current';
    return 'upcoming';
  };

  // Airbnb's calendar export has no real status of its own (always
  // "Reserved") — infer one from today vs. the block's own dates, so
  // an admin can tell a stay that's over from one still upcoming
  // without opening Airbnb itself.
  const airbnbDisplayStatus = (r) => {
    const state = dateState(r);
    if (state === 'past') return 'completed';
    if (state === 'current') return 'checked_in';
    return 'reserved';
  };

  // Every reservation blocking the calendar, from either source, in
  // one list — what the admin actually wants to see when asking
  // "what's booked". Airbnb rows have no real status of their own, so
  // the status tabs (a `bookings.status` filter) never match them —
  // only "all" and "past" (a date filter) include them. Grouped by
  // relevance rather than plain reverse-chronological: who's in the
  // apartment right now, then what's coming up (soonest first), then
  // what's already happened (most recent first) — instead of mixing a
  // booking three months out with one from last week.
  const allReservations = [
    ...bookings.map((b) => ({ kind: 'site', key: b.id, ...b })),
    ...airbnbBlocks.map((x) => ({ kind: 'airbnb', key: x.id, ...x })),
  ]
    .filter((r) => tab === 'all' || (tab === 'past' ? isPast(r) : r.kind === 'site' && r.status === tab))
    .sort((a, b) => {
      const stateOrder = { current: 0, upcoming: 1, past: 2 };
      const sa = stateOrder[dateState(a)];
      const sb = stateOrder[dateState(b)];
      if (sa !== sb) return sa - sb;
      const ad = rowDates(a)[0];
      const bd = rowDates(b)[0];
      // Upcoming/current: soonest check-in first. Past: most recent first.
      return sa === 2 ? bd.localeCompare(ad) : ad.localeCompare(bd);
    });

  const counts = Object.fromEntries(TABS.map((t) => {
    if (t === 'all') return [t, bookings.length + airbnbBlocks.length];
    if (t === 'past') {
      return [t, bookings.filter((b) => b.check_out < todayStr).length + airbnbBlocks.filter((x) => x.end_date < todayStr).length];
    }
    return [t, bookings.filter((b) => b.status === t).length];
  }));

  return (
    <div className="mgmt-page">
      <header className="mgmt-page-head">
        <span className="mgmt-eyebrow">BOOKINGS</span>
        <h1>Bookings</h1>
        <p className="mgmt-lead">All stays at the apartment.</p>
      </header>

      <div className="mgmt-view-toggle">
        <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}><List size={16}/> List</button>
        <button className={view === 'cal' ? 'active' : ''} onClick={() => setView('cal')}><CalendarDays size={16}/> Calendar</button>
      </div>

      {view === 'list' && (
        <div className="mgmt-tabs">
          {TABS.map((t) => (
            <button key={t} className={`mgmt-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {TAB_LABELS[t]}
              <span className="mgmt-tab-count">{counts[t]}</span>
            </button>
          ))}
        </div>
      )}

      {view === 'list' && (
        <div className="mgmt-card mgmt-card-flush">
          {loading ? (
            <div className="mgmt-empty"><p>Loading bookings…</p></div>
          ) : allReservations.length === 0 ? (
            <div className="mgmt-empty"><p>{tab === 'all' ? 'No reservations yet. Guests can book directly from the site, or sync Airbnb.' : `No ${TAB_LABELS[tab].toLowerCase()} bookings.`}</p></div>
          ) : (
            <div className="mgmt-table-wrap">
              <table className="mgmt-table">
                <thead>
                  <tr><th>Source</th><th>Apartment</th><th>Ref</th><th>Guest</th><th>Check-in</th><th>Check-out</th><th>Nights</th><th>Total</th><th>Status</th><th></th></tr>
                </thead>
                <tbody>
                  {allReservations.map((r) => r.kind === 'site' ? (
                    <tr key={r.key} className={`mgmt-row-${dateState(r)}`}>
                      <td><span className="mgmt-source mgmt-source-site">Site</span></td>
                      <td className="mgmt-td-sub">{apartmentName(r.apartment)}</td>
                      <td className="mgmt-td-mono">{r.reference}</td>
                      <td><div className="mgmt-td-primary">{r.guest_name}</div><div className="mgmt-td-sub">{r.guest_email}</div></td>
                      <td className="mgmt-td-nowrap">{format(parseISO(r.check_in), 'd MMM yyyy')}</td>
                      <td className="mgmt-td-nowrap">{format(parseISO(r.check_out), 'd MMM yyyy')}</td>
                      <td>{r.nights}</td>
                      <td>GHS {Number(r.total).toLocaleString()}</td>
                      <td><StatusBadge status={r.status} /></td>
                      <td>
                        <div className="mgmt-row-actions">
                          <button title="Print receipt" onClick={() => setReceiptBooking(r)}>
                            <Download size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={r.key} className={`mgmt-row-${dateState(r)}`}>
                      <td><span className="mgmt-source mgmt-source-airbnb">Airbnb</span></td>
                      <td className="mgmt-td-sub">{apartmentName(sourceApartment(r.source))}</td>
                      <td className="mgmt-td-mono mgmt-td-muted">—</td>
                      <td>
                        <div className="mgmt-td-primary mgmt-td-muted" title="Airbnb's calendar sync only shares blocked dates, never the guest's name, email or phone — that's a limit on their end, not something this site can pull in.">
                          Airbnb guest
                        </div>
                        <div className="mgmt-td-sub">{r.summary}</div>
                      </td>
                      <td className="mgmt-td-nowrap">{format(parseISO(r.start_date), 'd MMM yyyy')}</td>
                      <td className="mgmt-td-nowrap">{format(parseISO(r.end_date), 'd MMM yyyy')}</td>
                      <td>{differenceInCalendarDays(parseISO(r.end_date), parseISO(r.start_date))}</td>
                      <td className="mgmt-td-muted">—</td>
                      <td><StatusBadge status={airbnbDisplayStatus(r)} /></td>
                      <td></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {view === 'cal' && (
        <div className="mgmt-card">
          <div className="mgmt-cal-head">
            <button onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth()-1))}><ChevronLeft size={18}/></button>
            <h2>{format(month, 'MMMM yyyy')}</h2>
            <button onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth()+1))}><ChevronRight size={18}/></button>
          </div>
          <div className="mgmt-cal-legend">
            <span><i className="mgmt-cal-dot" style={{ background: 'var(--accent)' }} /> Site booking</span>
            <span><i className="mgmt-cal-dot" style={{ background: 'var(--airbnb)' }} /> Airbnb reservation</span>
          </div>
          <div className="mgmt-cal-grid">
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
              <div key={d} className="mgmt-cal-dow">{d}</div>
            ))}
            {Array.from({ length: startPad }, (_, i) => <div key={`p${i}`} />)}
            {days.map(day => {
              const bks = bookingsOnDay(day);
              const abs = airbnbBlocksOnDay(day);
              return (
                <div key={day.toISOString()} className={`mgmt-cal-day ${bks.length || abs.length ? 'has-booking' : ''}`}>
                  <span className="mgmt-cal-num">{format(day, 'd')}</span>
                  {bks.map(b => (
                    <span key={b.id} className="mgmt-cal-event" style={{ background: 'var(--accent)' }} title={apartmentName(b.apartment)}>
                      {b.guest_name.split(' ')[0]} · {APARTMENTS[b.apartment]?.shortName}
                    </span>
                  ))}
                  {abs.map(x => (
                    <span key={x.id} className="mgmt-cal-event" style={{ background: 'var(--airbnb)' }} title={apartmentName(sourceApartment(x.source))}>
                      Airbnb · {APARTMENTS[sourceApartment(x.source)]?.shortName}
                    </span>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {receiptBooking && (
        <Receipt
          booking={{
            reference: receiptBooking.reference,
            checkIn: parseISO(receiptBooking.check_in),
            checkOut: parseISO(receiptBooking.check_out),
            nights: receiptBooking.nights,
            guests: receiptBooking.guests,
            total: receiptBooking.total,
            status: receiptBooking.status,
            apartment: receiptBooking.apartment,
          }}
          guestName={receiptBooking.guest_name}
          guestEmail={receiptBooking.guest_email}
          onClose={() => setReceiptBooking(null)}
        />
      )}
    </div>
  );
}
