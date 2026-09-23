import { useState, useMemo, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Download, MessageSquare, ArrowRight, MapPin, CreditCard, Star } from 'lucide-react';
import Receipt from '../../components/Receipt';
import StatusBadge from '../../components/StatusBadge';
import StarRating from '../../components/StarRating';
import { supabase } from '../../lib/supabase';
import { apartmentName } from '../../lib/apartments';

/**
 * Bookings — real rows from the `bookings` table, scoped to this
 * guest (guest_id = auth.uid(), enforced by RLS too). Every booking
 * gets a guest_id one way or another — automatically for anything
 * booked through the site (book-and-pay's ensureGuestAccount), or via
 * admin-onboard-guest for the rarer manually-confirmed enquiry — see
 * AdminEnquiries.jsx's "Give dashboard access".
 *
 * Payment: an `awaiting_payment` booking's "Pay now" (see
 * PayNowButton below) is the ONLY way payment happens — there's no
 * admin-side "send a payment link" action. The guest starts checkout
 * themselves, whenever they're ready.
 *
 * Home-Office Apartment and LivingSpring Gardens & Apartment are two
 * separate units in the same building, so the name shown per booking
 * comes from that row's own `apartment` column — the location/photo
 * stay fixed since both units are in the same compound.
 *
 * Reviews: once a booking is `completed` (a daily job flips it from
 * `confirmed` once check_out has passed — see supabase/migrations/
 * 20260921130000_reviews_and_guest_accounts.sql), this page offers a
 * "Leave a review" form right on the trip card, same idea as Airbnb's
 * post-stay review prompt (also emailed — see notify-enquiry's
 * "review_request" type). One review per booking, enforced by a
 * unique constraint and RLS, not just this UI.
 */

const APARTMENT = {
  location: 'Sunyani, Ghana',
  coverImage: '/images/hero-property.jpg',
};

export default function Bookings() {
  const { user, displayName } = useOutletContext();
  const [tab, setTab] = useState('upcoming');
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState({}); // booking_id -> review row
  const [loading, setLoading] = useState(true);
  const [receiptBooking, setReceiptBooking] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    loadBookings();
    loadReviews();

    const sub = supabase
      .channel(`guest-bookings-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `guest_id=eq.${user.id}` }, loadBookings)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews', filter: `guest_id=eq.${user.id}` }, loadReviews)
      .subscribe();

    return () => { supabase.removeChannel(sub); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadBookings = async () => {
    try {
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
    } catch {
      // A network-level failure would otherwise leave this stuck on
      // "Loading…" forever.
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    const { data } = await supabase.from('reviews').select('*').eq('guest_id', user.id);
    if (data) setReviews(Object.fromEntries(data.map((r) => [r.booking_id, r])));
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
            Book a stay <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="dash-booking-list">
          {filtered.map((b) => (
            <BookingCard
              key={b.reference}
              booking={b}
              review={reviews[b.id]}
              onReceipt={() => setReceiptBooking(b)}
              onReviewSaved={loadReviews}
            />
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

function BookingCard({ booking, review, onReceipt, onReviewSaved }) {
  const b = booking;
  // A guest can leave a review the moment they've checked out, even
  // if the daily job hasn't flipped the status to `completed` yet —
  // mirrors the same check the reviews_insert_own RLS policy makes,
  // so this button never promises something the database will reject.
  const canReview = !review && b.status !== 'cancelled' && b.checkOut <= new Date();

  return (
    <article className="dash-booking">
      <img
        src={APARTMENT.coverImage}
        alt={apartmentName(b.apartment)}
        className="dash-booking-img"
      />
      <div className="dash-booking-body">
        <div className="dash-booking-top">
          <div>
            <h3>{apartmentName(b.apartment)}</h3>
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
          {b.status === 'awaiting_payment' && <PayNowButton booking={b} />}
          <button className="dash-btn dash-btn-ghost dash-btn-sm" onClick={onReceipt}>
            <Download size={14} /> Receipt
          </button>
          <Link to="/dashboard/messages" className="dash-btn dash-btn-ghost dash-btn-sm">
            <MessageSquare size={14} /> Message host
          </Link>
        </div>

        {review ? (
          <div className="dash-review-existing">
            <StarRating value={review.rating} size={14} />
            {review.comment && <p>{review.comment}</p>}
          </div>
        ) : canReview ? (
          <ReviewForm booking={b} onSaved={onReviewSaved} />
        ) : null}
      </div>
    </article>
  );
}

// Payment lives entirely here in the guest's own dashboard — there is
// no admin-side "send a payment link" action anymore. Clicking this
// calls paystack-init directly (RLS's bookings_guest_select_own lets
// a guest request a checkout link for their own booking, same as an
// admin can for any booking) and redirects straight to Paystack's
// hosted checkout the moment it's ready, whenever the guest chooses
// to pay.
function PayNowButton({ booking }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const payNow = async () => {
    setError('');
    setLoading(true);
    const { data, error: fnError } = await supabase.functions.invoke('paystack-init', {
      body: { booking_id: booking.id },
    });
    if (fnError || !data?.authorization_url) {
      setError(data?.error || "Couldn't start payment. Please try again.");
      setLoading(false);
      return;
    }
    window.location.href = data.authorization_url;
  };

  return (
    <>
      <button className="dash-btn dash-btn-primary dash-btn-sm" disabled={loading} onClick={payNow}>
        <CreditCard size={14} /> {loading ? 'Preparing checkout…' : 'Pay now'}
      </button>
      {error && <p className="form-error" style={{ margin: '6px 0 0', fontSize: 12, flexBasis: '100%' }}>{error}</p>}
    </>
  );
}

function ReviewForm({ booking, onSaved }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!rating) {
      setError('Pick a star rating first.');
      return;
    }
    setError('');
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error: insertError } = await supabase.from('reviews').insert({
      booking_id: booking.id,
      guest_id: user.id,
      guest_name: booking.guest_name,
      apartment: booking.apartment,
      rating,
      comment: comment.trim() || null,
    });
    setSaving(false);
    if (insertError) {
      setError("Couldn't save your review. Please try again.");
      return;
    }
    onSaved();
  };

  if (!open) {
    return (
      <button className="dash-btn dash-btn-outline dash-btn-sm" style={{ marginTop: 12 }} onClick={() => setOpen(true)}>
        <Star size={14} /> Leave a review
      </button>
    );
  }

  return (
    <div className="dash-review-form">
      {error && <p className="form-error" style={{ margin: '0 0 10px' }}>{error}</p>}
      <StarRating value={rating} onChange={setRating} size={22} />
      <textarea
        rows={3}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="How was your stay? (optional)"
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="dash-btn dash-btn-primary dash-btn-sm" disabled={saving} onClick={submit}>
          {saving ? 'Saving…' : 'Submit review'}
        </button>
        <button className="dash-btn dash-btn-ghost dash-btn-sm" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </div>
  );
}
