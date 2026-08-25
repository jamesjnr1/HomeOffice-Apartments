import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, parseISO } from 'date-fns';
import { List, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

const BOOKINGS = [
  { id:1, ref:'HO-8FQ2P', guest:'Jonathan Duah', email:'james@example.com', apt:'Verandah', checkIn:'2026-08-31', checkOut:'2026-09-04', nights:4, guests:2, total:2480, status:'confirmed' },
  { id:2, ref:'HO-2XR7T', guest:'Esi Boateng', email:'esi@example.com', apt:'Garden', checkIn:'2026-09-06', checkOut:'2026-09-08', nights:2, guests:1, total:960, status:'confirmed' },
  { id:3, ref:'HO-K3P9M', guest:'Nana Adjei', email:'nana@example.com', apt:'Verandah', checkIn:'2026-09-15', checkOut:'2026-09-19', nights:4, guests:3, total:2480, status:'pending' },
  { id:4, ref:'HO-YB4LN', guest:'Abena Mensah', email:'abena@example.com', apt:'Garden', checkIn:'2026-07-10', checkOut:'2026-07-17', nights:7, guests:2, total:3360, status:'completed' },
];

const APT_COLOR = { Verandah: 'var(--accent)', Garden: '#7c6b9e' };

export default function AdminBookings() {
  const [view, setView] = useState('list');
  const [month, setMonth] = useState(new Date(2026, 7)); // Aug 2026

  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const startPad = (getDay(days[0]) + 6) % 7; // Mon-start

  const bookingsOnDay = (day) => BOOKINGS.filter(b => {
    const ci = parseISO(b.checkIn);
    const co = parseISO(b.checkOut);
    return day >= ci && day < co;
  });

  return (
    <div className="ad-page">
      <header className="ad-page-head">
        <span className="ad-eyebrow">BOOKINGS</span>
        <h1>Bookings</h1>
        <p className="ad-lead">All stays across both apartments.</p>
      </header>

      <div className="ad-view-toggle">
        <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}><List size={16}/> List</button>
        <button className={view === 'cal' ? 'active' : ''} onClick={() => setView('cal')}><CalendarDays size={16}/> Calendar</button>
      </div>

      {view === 'list' && (
        <div className="ad-card ad-card-flush">
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr><th>Ref</th><th>Guest</th><th>Apartment</th><th>Check-in</th><th>Check-out</th><th>Nights</th><th>Total</th><th>Status</th></tr>
              </thead>
              <tbody>
                {BOOKINGS.map(b => (
                  <tr key={b.id}>
                    <td className="ad-td-mono">{b.ref}</td>
                    <td><div className="ad-td-primary">{b.guest}</div><div className="ad-td-sub">{b.email}</div></td>
                    <td><span className="ad-apt-dot" style={{ background: APT_COLOR[b.apt] }}/>{b.apt}</td>
                    <td>{b.checkIn}</td>
                    <td>{b.checkOut}</td>
                    <td>{b.nights}</td>
                    <td>GHS {b.total.toLocaleString()}</td>
                    <td><span className={`ad-status ${b.status}`}>{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'cal' && (
        <div className="ad-card">
          <div className="ad-cal-head">
            <button onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth()-1))}><ChevronLeft size={18}/></button>
            <h2>{format(month, 'MMMM yyyy')}</h2>
            <button onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth()+1))}><ChevronRight size={18}/></button>
          </div>
          <div className="ad-cal-legend">
            {Object.entries(APT_COLOR).map(([apt, color]) => (
              <span key={apt}><span className="ad-apt-dot" style={{ background: color }}/>{apt}</span>
            ))}
          </div>
          <div className="ad-cal-grid">
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
              <div key={d} className="ad-cal-dow">{d}</div>
            ))}
            {Array.from({ length: startPad }, (_, i) => <div key={`p${i}`} />)}
            {days.map(day => {
              const bks = bookingsOnDay(day);
              return (
                <div key={day.toISOString()} className={`ad-cal-day ${bks.length ? 'has-booking' : ''}`}>
                  <span className="ad-cal-num">{format(day, 'd')}</span>
                  {bks.map(b => (
                    <span key={b.id} className="ad-cal-event" style={{ background: APT_COLOR[b.apt] }}>
                      {b.apt[0]} · {b.guest.split(' ')[0]}
                    </span>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
