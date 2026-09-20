import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, parseISO, differenceInCalendarDays } from 'date-fns';
import { List, CalendarDays, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import Receipt from '../../components/Receipt';
import { supabase } from '../../lib/supabase';

/**
 * AdminBookings — real rows from the `bookings` table (see
 * supabase/migrations/20260909150000_create_bookings.sql), created by
 * confirming an enquiry in AdminEnquiries.jsx. Kept live via a
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

  // Every reservation blocking the calendar, from either source, in
  // one list sorted by check-in — what the admin actually wants to
  // see when asking "what's booked".
  const allReservations = [
    ...bookings.map((b) => ({ kind: 'site', key: b.id, ...b })),
    ...airbnbBlocks.map((x) => ({ kind: 'airbnb', key: x.id, ...x })),
  ].sort((a, b) => {
    const ad = a.kind === 'site' ? a.check_in : a.start_date;
    const bd = b.kind === 'site' ? b.check_in : b.start_date;
    return bd.localeCompare(ad);
  });

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
        <div className="mgmt-card mgmt-card-flush">
          {loading ? (
            <div className="mgmt-empty"><p>Loading bookings…</p></div>
          ) : allReservations.length === 0 ? (
            <div className="mgmt-empty"><p>No reservations yet. Confirm one from the Enquiries inbox, or sync Airbnb.</p></div>
          ) : (
            <div className="mgmt-table-wrap">
              <table className="mgmt-table">
                <thead>
                  <tr><th>Source</th><th>Ref</th><th>Guest</th><th>Check-in</th><th>Check-out</th><th>Nights</th><th>Total</th><th>Status</th><th></th></tr>
                </thead>
                <tbody>
                  {allReservations.map((r) => r.kind === 'site' ? (
                    <tr key={r.key}>
                      <td><span className="mgmt-source mgmt-source-site">Site</span></td>
                      <td className="mgmt-td-mono">{r.reference}</td>
                      <td><div className="mgmt-td-primary">{r.guest_name}</div><div className="mgmt-td-sub">{r.guest_email}</div></td>
                      <td>{r.check_in}</td>
                      <td>{r.check_out}</td>
                      <td>{r.nights}</td>
                      <td>GHS {Number(r.total).toLocaleString()}</td>
                      <td><span className={`mgmt-status ${r.status}`}>{r.status}</span></td>
                      <td>
                        <div className="mgmt-row-actions">
                          <button title="Print receipt" onClick={() => setReceiptBooking(r)}>
                            <Download size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={r.key}>
                      <td><span className="mgmt-source mgmt-source-airbnb">Airbnb</span></td>
                      <td className="mgmt-td-mono mgmt-td-muted">—</td>
                      <td><div className="mgmt-td-primary mgmt-td-muted">Airbnb guest</div><div className="mgmt-td-sub">{r.summary}</div></td>
                      <td>{r.start_date}</td>
                      <td>{r.end_date}</td>
                      <td>{differenceInCalendarDays(parseISO(r.end_date), parseISO(r.start_date))}</td>
                      <td className="mgmt-td-muted">—</td>
                      <td><span className="mgmt-status mgmt-status-airbnb">reserved</span></td>
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
                    <span key={b.id} className="mgmt-cal-event" style={{ background: 'var(--accent)' }}>
                      {b.guest_name.split(' ')[0]}
                    </span>
                  ))}
                  {abs.map(x => (
                    <span key={x.id} className="mgmt-cal-event" style={{ background: 'var(--airbnb)' }}>
                      Airbnb
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
          }}
          guestName={receiptBooking.guest_name}
          guestEmail={receiptBooking.guest_email}
          onClose={() => setReceiptBooking(null)}
        />
      )}
    </div>
  );
}
