import { useState, useMemo, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Download, MessageSquare, ArrowRight, MapPin } from 'lucide-react';
import Receipt from '../../components/Receipt';
import { supabase } from '../../lib/supabase';

/**
 * Bookings — real rows from the `bookings` table, scoped to this
 * guest (guest_id = auth.uid(), enforced by RLS too). Only shows up
 * here if the enquiry's email matched an existing account at the
 * moment an admin confirmed it — see AdminEnquiries.jsx.
 *
 * The site represents ONLY Home-Office Apartments, a single
 * 4-bedroom self-contained property, so the photo/location shown
 * alongside each booking is the same fixed APARTMENT constant rather
 * than per-row data.
 */

const APARTMENT = {
  name: 'Home-Office Apartments',
  location: 'Sunyani, Ghana',
  coverImage: '/images/hero-property.jpg',
};

export default function Bookings() {
  const { user, displayName } = useOutletContext();
  const [tab, setTab] = useState('upcoming');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [receiptBooking, setReceiptBooking] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    loadBookings();

    const sub = supabase
      .channel(`guest-bookings-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `guest_id=eq.${user.id}` }, loadBookings)
      .subscribe();

    return () => { supabase.removeChannel(sub); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadBookings = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('guest_id', user.id)
      .order('check_in', { ascending: false });

    if (!error && data) {
      setBookings(data.map((b) => ({
        ...b,
        checkIn: parseISO(b.check_in),
        checkOut: parseISO(b.check_out),
      })));
    }
    setLoading(false);
  };

  const filtered = useMemo(() => {
    const now = new Date();
    return bookings.filter((b) => {
      if (tab === 'upcoming') return b.checkIn > now && b.status !== 'cancelled';
      if (tab === 'current') return b.checkIn <= now && b.checkOut >= now;
      if (tab === 'past') return b.checkOut < now || b.status === 'cancelled';
      return true;
    });
  }, [tab, bookings]);

  const counts = useMemo(() => {
    const now = new Date();
    return {
      upcoming: bookings.filter((b) => b.checkIn > now && b.status !== 'cancelled').length,
      current: bookings.filter((b) => b.checkIn <= now && b.checkOut >= now).length,
      past: bookings.filter((b) => b.checkOut < now || b.status === 'cancelled').length,
    };
  }, [bookings]);

  return (
    <div className="dash-page">
      <header className="dash-page-head">
        <span className="dash-eyebrow">BOOKINGS</span>
        <h1>Your trips</h1>
        <p className="dash-lead">Everywhere you're staying with us, and everywhere you've been.</p>
      </header>

      <div className="dash-tabs">
        <TabBtn active={tab === 'upcoming'} onClick={() => setTab('upcoming')} count={counts.upcoming}>
          Upcoming
        </TabBtn>
        <TabBtn active={tab === 'current'} onClick={() => setTab('current')} count={counts.current}>
          Current
        </TabBtn>
        <TabBtn active={tab === 'past'} onClick={() => setTab('past')} count={counts.past}>
          Past
        </TabBtn>
      </div>

      {loading ? (
        <div className="dash-empty"><p>Loading your trips…</p></div>
      ) : filtered.length === 0 ? (
        <div className="dash-empty">
          <h3>Nothing here yet</h3>
          <p>
            When you book a stay with us, it'll show up here.
          </p>
          <Link to="/book" className="dash-btn dash-btn-primary">
            Send an enquiry <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="dash-booking-list">
          {filtered.map((b) => (
            <BookingCard key={b.reference} booking={b} onReceipt={() => setReceiptBooking(b)} />
          ))}
        </div>
      )}

      {receiptBooking && (
        <Receipt
          booking={receiptBooking}
          guestName={displayName}
          guestEmail={user?.email}
          onClose={() => setReceiptBooking(null)}
        />
      )}
    </div>
  );
}

function TabBtn({ active, onClick, count, children }) {
  return (
    <button className={`dash-tab ${active ? 'active' : ''}`} onClick={onClick}>
      {children}
      <span className="dash-tab-count">{count}</span>
    </button>
  );
}

function BookingCard({ booking, onReceipt }) {
  const b = booking;
  return (
    <article className="dash-booking">
      <img
        src={APARTMENT.coverImage}
        alt={APARTMENT.name}
        className="dash-booking-img"
      />
      <div className="dash-booking-body">
        <div className="dash-booking-top">
          <div>
            <h3>{APARTMENT.name}</h3>
            <div className="dash-loc">
              <MapPin size={12} />
              {APARTMENT.location}
            </div>
          </div>
          <StatusBadge status={b.status} />
        </div>

        <div className="dash-booking-meta">
          <div>
            <div className="dash-detail-label">DATES</div>
            <div className="dash-detail-value">
              {format(b.checkIn, 'd MMM')} → {format(b.checkOut, 'd MMM yyyy')}
            </div>
          </div>
          <div>
            <div className="dash-detail-label">NIGHTS</div>
            <div className="dash-detail-value">{b.nights}</div>
          </div>
          <div>
            <div className="dash-detail-label">GUESTS</div>
            <div className="dash-detail-value">{b.guests}</div>
          </div>
          <div>
            <div className="dash-detail-label">TOTAL</div>
            <div className="dash-detail-value">GHS {Number(b.total).toLocaleString()}</div>
          </div>
          <div>
            <div className="dash-detail-label">REFERENCE</div>
            <div className="dash-detail-value dash-mono">{b.reference}</div>
          </div>
        </div>

        <div className="dash-booking-actions">
          <button className="dash-btn dash-btn-ghost dash-btn-sm" onClick={onReceipt}>
            <Download size={14} /> Receipt
          </button>
          <Link to="/dashboard/messages" className="dash-btn dash-btn-ghost dash-btn-sm">
            <MessageSquare size={14} /> Message host
          </Link>
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ status }) {
  const map = {
    confirmed: { className: 'dash-status confirmed', label: 'Confirmed' },
    pending: { className: 'dash-status pending', label: 'Pending' },
    completed: { className: 'dash-status completed', label: 'Completed' },
    cancelled: { className: 'dash-status cancelled', label: 'Cancelled' },
  };
  const s = map[status] || map.pending;
  return <span className={s.className}>{s.label}</span>;
}
