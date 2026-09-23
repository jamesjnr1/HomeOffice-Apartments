import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
  Phone, Mail, KeyRound, Users, BedDouble, CalendarDays,
  Filter, Download, MessageSquare,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { APARTMENTS, apartmentName } from '../../lib/apartments';
import StatusBadge from '../../components/StatusBadge';
import Receipt from '../../components/Receipt';
import PropertyGallery from '../../components/PropertyGallery';

/**
 * AdminGuestDetail — a single guest's full profile: contact details,
 * their current/next stay, and every past booking. Laid out after a
 * hotel-management "Guest Details" reference the user shared, but
 * every field here is real data from this project's own schema, not
 * the reference's hotel-room fields we don't have (individual room
 * numbers/floors — we let two whole apartments, not per-room hotel
 * inventory). "Room Capacity"/"Bed Type" map to the apartment's real
 * guests/bedrooms/beds (src/lib/apartments.js); the facilities list
 * and photos (see PropertyGallery) are this project's own real
 * content, shared with the guest dashboard's own Overview page so
 * both show the exact same thing — nothing invented.
 *
 * No page-level top bar (search/notifications/language picker) was
 * added here — that's global admin chrome, out of scope for a single
 * page, and this project has neither a search index nor i18n to back
 * it for real.
 */

export default function AdminGuestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [receiptBooking, setReceiptBooking] = useState(null);

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    setLoading(true);
    const [{ data: p, error: pErr }, { data: b }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
      supabase.from('bookings').select('*').eq('guest_id', id).order('check_in', { ascending: false }),
    ]);
    if (pErr || !p) { setNotFound(true); setLoading(false); return; }
    setProfile(p);
    setBookings(b || []);
    setLoading(false);
  };

  const now = new Date();
  const withDates = useMemo(
    () => bookings.map((b) => ({ ...b, checkIn: parseISO(b.check_in), checkOut: parseISO(b.check_out) })),
    [bookings]
  );

  // "Current booking" — whichever isn't over yet, soonest first. Not
  // necessarily "confirmed": an awaiting_payment or upcoming booking
  // still counts as what this guest currently has going on with us.
  const current = useMemo(() => {
    const active = withDates.filter((b) => b.checkOut >= now && b.status !== 'cancelled');
    return active.sort((a, b) => a.checkIn - b.checkIn)[0] || null;
  }, [withDates]);

  const history = useMemo(() => {
    let rows = withDates.filter((b) => !current || b.id !== current.id);
    if (dateFrom) rows = rows.filter((b) => b.check_in >= dateFrom);
    if (dateTo) rows = rows.filter((b) => b.check_in <= dateTo);
    return rows.sort((a, b) => b.checkIn - a.checkIn);
  }, [withDates, current, dateFrom, dateTo]);

  // A real CSV of this guest's booking history — no server round trip
  // needed, everything's already loaded client-side.
  const downloadReport = () => {
    const header = ['Reference', 'Apartment', 'Check-in', 'Check-out', 'Guests', 'Total (GHS)', 'Status'];
    const rows = history.map((b) => [
      b.reference, apartmentName(b.apartment), b.check_in, b.check_out, b.guests, b.total, b.status,
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(profile?.full_name || 'guest').replace(/\s+/g, '-').toLowerCase()}-booking-history.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="mgmt-empty"><p>Loading guest…</p></div>;
  if (notFound) return (
    <div className="mgmt-empty">
      <h3>Guest not found</h3>
      <p>This guest may have been removed.</p>
      <Link to="/admin/guests" className="mgmt-btn mgmt-btn-outline">Back to guests</Link>
    </div>
  );

  const apt = current ? APARTMENTS[current.apartment] : null;
  const initial = (profile.full_name || profile.email || '?').charAt(0).toUpperCase();

  return (
    <div className="mgmt-page">
      <header className="mgmt-page-head">
        <span className="mgmt-eyebrow">
          <Link to="/admin/guests" className="mgmt-linky">Guests</Link> / {profile.full_name || 'Guest'}
        </span>
        <h1>{profile.full_name || 'Guest'}</h1>
      </header>

      <div className="mgmt-guest-detail-grid">
        {/* Left — identity card */}
        <div className="mgmt-card mgmt-guest-photo-card">
          <div className="mgmt-guest-photo-banner">
            {profile.avatar_url && <img src={profile.avatar_url} alt="" />}
          </div>
          <div className="mgmt-guest-photo-avatar">
            {profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : initial}
          </div>
          <div className="mgmt-guest-photo-id">#{profile.id.slice(0, 8).toUpperCase()}</div>
          <h2 className="mgmt-guest-photo-name">{profile.full_name || 'Guest'}</h2>

          <div className="mgmt-guest-contact">
            {profile.phone && (
              <a className="mgmt-guest-contact-row" href={`tel:${profile.phone}`}>
                <span className="mgmt-guest-contact-icon"><Phone size={14} /></span>
                {profile.phone}
              </a>
            )}
            <a className="mgmt-guest-contact-row" href={`mailto:${profile.email}`}>
              <span className="mgmt-guest-contact-icon"><Mail size={14} /></span>
              {profile.email}
            </a>
          </div>

          <Link to={`/admin/messages?guest=${profile.id}`} className="mgmt-btn mgmt-btn-outline" style={{ marginTop: 18, width: '100%', justifyContent: 'center' }}>
            <MessageSquare size={14} /> Message guest
          </Link>
        </div>

        {/* Right — current booking + facilities */}
        <div className="mgmt-card">
          <h2 className="mgmt-card-h">Current booking</h2>

          {!current ? (
            <p className="mgmt-td-muted">No upcoming or active booking right now.</p>
          ) : (
            <>
              <div className="mgmt-current-booking-bar">
                <span className="mgmt-current-booking-icon"><KeyRound size={18} /></span>
                <div className="mgmt-current-booking-main">
                  <div className="mgmt-td-muted" style={{ fontSize: 12 }}>Booking ID #{current.reference}</div>
                  <div className="mgmt-current-booking-title">{apartmentName(current.apartment)}</div>
                </div>
                <StatusBadge status={current.status} />
              </div>

              <div className="mgmt-current-booking-stats">
                <div className="mgmt-stat-inline">
                  <Users size={14} />
                  <div><span className="mgmt-stat-inline-label">ROOM CAPACITY</span><span className="mgmt-stat-inline-value">Up to {apt?.guests ?? current.guests} guests</span></div>
                </div>
                <div className="mgmt-stat-inline">
                  <BedDouble size={14} />
                  <div><span className="mgmt-stat-inline-label">BEDS</span><span className="mgmt-stat-inline-value">{apt?.bedrooms} bedrooms · {apt?.beds} beds</span></div>
                </div>
                <div className="mgmt-stat-inline">
                  <CalendarDays size={14} />
                  <div><span className="mgmt-stat-inline-label">BOOKING DATES</span><span className="mgmt-stat-inline-value">{format(current.checkIn, 'd MMM')} – {format(current.checkOut, 'd MMM yyyy')}</span></div>
                </div>
              </div>

              <PropertyGallery />
            </>
          )}
        </div>
      </div>

      {/* History */}
      <section className="mgmt-card mgmt-card-flush" style={{ marginTop: 20 }}>
        <div className="mgmt-card-head" style={{ padding: '20px 24px 0' }}>
          <h2 className="mgmt-card-h" style={{ margin: 0 }}>History booking</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="mgmt-date-filter">
              <Filter size={13} />
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} aria-label="From date" />
              <span>–</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} aria-label="To date" />
            </span>
            <button className="mgmt-btn mgmt-btn-outline mgmt-btn-sm" onClick={downloadReport} disabled={history.length === 0}>
              <Download size={13} /> Generate report
            </button>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="mgmt-empty"><p>No other bookings{dateFrom || dateTo ? ' in this date range' : ' yet'}.</p></div>
        ) : (
          <div className="mgmt-table-wrap" style={{ marginTop: 16 }}>
            <table className="mgmt-table">
              <thead>
                <tr><th>Apartment</th><th>Beds</th><th>Dates</th><th>Guests</th><th>Total</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {history.map((b) => {
                  const a = APARTMENTS[b.apartment];
                  return (
                    <tr key={b.id}>
                      <td>
                        <div className="mgmt-td-primary">{apartmentName(b.apartment)}</div>
                        <div className="mgmt-td-mono mgmt-td-muted">{b.reference}</div>
                      </td>
                      <td className="mgmt-td-sub">{a?.bedrooms} bed · {a?.beds} beds</td>
                      <td className="mgmt-td-muted">
                        {format(b.checkIn, 'd MMM yyyy')} → {format(b.checkOut, 'd MMM yyyy')}
                      </td>
                      <td>{b.guests}</td>
                      <td>GHS {Number(b.total).toLocaleString()}</td>
                      <td><StatusBadge status={b.status} /></td>
                      <td>
                        <button className="mgmt-btn mgmt-btn-outline mgmt-btn-sm" onClick={() => setReceiptBooking(b)}>
                          <Download size={13} /> Receipt
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {receiptBooking && (
        <Receipt
          booking={receiptBooking}
          guestName={profile.full_name}
          guestEmail={profile.email}
          onClose={() => setReceiptBooking(null)}
        />
      )}
    </div>
  );
}
