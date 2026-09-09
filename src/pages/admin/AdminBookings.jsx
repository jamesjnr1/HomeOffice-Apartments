import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, parseISO } from 'date-fns';
import { List, CalendarDays, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import Receipt from '../../components/Receipt';
import { supabase } from '../../lib/supabase';

/**
 * AdminBookings — real rows from the `bookings` table (see
 * supabase/migrations/20260909150000_create_bookings.sql), created by
 * confirming an enquiry in AdminEnquiries.jsx. Kept live via a
 * realtime subscription, same pattern as messages/enquiries.
 */

export default function AdminBookings() {
  const [view, setView] = useState('list');
  const [month, setMonth] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [receiptBooking, setReceiptBooking] = useState(null);

  useEffect(() => {
    loadBookings();

    const sub = supabase
      .channel('admin-bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, loadBookings)
      .subscribe();

    return () => { supabase.removeChannel(sub); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadBookings = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('check_in', { ascending: false });

    if (!error && data) setBookings(data);
    setLoading(false);
  };

  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const startPad = (getDay(days[0]) + 6) % 7; // Mon-start

  const bookingsOnDay = (day) => bookings.filter(b => {
    const ci = parseISO(b.check_in);
    const co = parseISO(b.check_out);
    return day >= ci && day < co;
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
          ) : bookings.length === 0 ? (
            <div className="mgmt-empty"><p>No bookings yet. Confirm one from the Enquiries inbox.</p></div>
          ) : (
            <div className="mgmt-table-wrap">
              <table className="mgmt-table">
                <thead>
                  <tr><th>Ref</th><th>Guest</th><th>Check-in</th><th>Check-out</th><th>Nights</th><th>Total</th><th>Status</th><th></th></tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id}>
                      <td className="mgmt-td-mono">{b.reference}</td>
                      <td><div className="mgmt-td-primary">{b.guest_name}</div><div className="mgmt-td-sub">{b.guest_email}</div></td>
                      <td>{b.check_in}</td>
                      <td>{b.check_out}</td>
                      <td>{b.nights}</td>
                      <td>GHS {Number(b.total).toLocaleString()}</td>
                      <td><span className={`mgmt-status ${b.status}`}>{b.status}</span></td>
                      <td>
                        <div className="mgmt-row-actions">
                          <button title="Print receipt" onClick={() => setReceiptBooking(b)}>
                            <Download size={14} />
                          </button>
                        </div>
                      </td>
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
          <div className="mgmt-cal-grid">
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
              <div key={d} className="mgmt-cal-dow">{d}</div>
            ))}
            {Array.from({ length: startPad }, (_, i) => <div key={`p${i}`} />)}
            {days.map(day => {
              const bks = bookingsOnDay(day);
              return (
                <div key={day.toISOString()} className={`mgmt-cal-day ${bks.length ? 'has-booking' : ''}`}>
                  <span className="mgmt-cal-num">{format(day, 'd')}</span>
                  {bks.map(b => (
                    <span key={b.id} className="mgmt-cal-event" style={{ background: 'var(--accent)' }}>
                      {b.guest_name.split(' ')[0]}
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
