import { Link, useOutletContext } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import {
  MapPin,
  Clock,
  ArrowRight,
  MessageSquare,
  Wifi,
  KeyRound,
  ScrollText,
  Info,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

/**
 * Overview
 * Landing screen after login. Reads real bookings scoped to this
 * guest (guest_id = auth.uid()) — see AdminEnquiries.jsx for how a
 * booking gets created and linked to an account.
 *
 * Also shows check-in details (WiFi, access, house rules) once the
 * guest has a current or upcoming stay — see AdminSettings.jsx for
 * where those get filled in, and property_details' RLS policy (guest
 * must have a confirmed/completed booking) for why this only ever
 * loads for guests who qualify.
 *
 * Also shows the status of a not-yet-booked enquiry, if there is one
 * — still pending, or declined (e.g. the requested dates turned out
 * to be already reserved — see AdminEnquiries.jsx's Decline action
 * and supabase/migrations/20260910100000_decline_enquiries_and_guest_
 * visibility.sql, which is what lets a guest read their own enquiries
 * by email match at all). A declined enquiry also always gets an
 * email (supabase/migrations/20260910100200_notify_enquiry_declined.
 * sql) and, best-effort, a message on /dashboard/messages — this card
 * is the "see something on their dashboard" half of that, so it's not
 * email-only.
 *
 * Scope: this site represents ONLY Home-Office Apartments, a single
 * 4-bedroom self-contained property — no other listings.
 */

const APARTMENT = {
  id: 'home-office',
  name: 'Home-Office Apartments',
  location: 'Sunyani, Ghana',
  coverImage: '/images/hero-property.jpg',
};

export default function Overview() {
  const { user, displayName } = useOutletContext();
  const [nextStay, setNextStay] = useState(null);
  const [stats, setStats] = useState({ upcomingBookings: 0, pastStays: 0, nightsWithUs: 0 });
  const [hasActiveStay, setHasActiveStay] = useState(false);
  const [checkInDetails, setCheckInDetails] = useState(null);
  const [openEnquiry, setOpenEnquiry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    load();
    loadEnquiryStatus();

    const sub = supabase
      .channel(`guest-overview-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `guest_id=eq.${user.id}` }, load)
      .subscribe();

    // Enquiries aren't tied to guest_id (they're submitted before an
    // account necessarily exists — see enquiries_guest_select_own),
    // so this channel filters by email instead.
    const enquirySub = user.email
      ? supabase
          .channel(`guest-enquiries-${user.id}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'enquiries', filter: `email=eq.${user.email}` }, loadEnquiryStatus)
          .subscribe()
      : null;

    return () => {
      supabase.removeChannel(sub);
      if (enquirySub) supabase.removeChannel(enquirySub);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Most recent enquiry that hasn't (yet) become a booking — shown
  // while it's still pending, or for a couple of weeks after being
  // declined so the guest has time to see why, without it lingering
  // on the dashboard indefinitely.
  const loadEnquiryStatus = async () => {
    if (!user?.email) return;
    try {
      const { data } = await supabase
        .from('enquiries')
        .select('id, check_in, check_out, status, decline_reason, created_at')
        .eq('email', user.email)
        .is('booking_id', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!data) { setOpenEnquiry(null); return; }
      const ageDays = (Date.now() - new Date(data.created_at).getTime()) / 86400000;
      if (data.status === 'declined' && ageDays > 14) { setOpenEnquiry(null); return; }
      if (data.status === 'archived') { setOpenEnquiry(null); return; }
      setOpenEnquiry(data);
    } catch {
      // Non-critical — the enquiry card just won't show.
    }
  };

  // Only fetch check-in details once we know this guest actually has a
  // current or upcoming stay — RLS would block it otherwise anyway,
  // this just avoids a pointless request for everyone else.
  useEffect(() => {
    if (!hasActiveStay) { setCheckInDetails(null); return; }
    supabase
      .from('property_details')
      .select('*')
      .eq('id', 'home-office')
      .maybeSingle()
      .then(({ data }) => setCheckInDetails(data || null))
      .catch(() => setCheckInDetails(null));
  }, [hasActiveStay]);

  const load = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('guest_id', user.id)
        .neq('status', 'cancelled')
        .order('check_in', { ascending: true });

      if (!error && data) {
        const now = new Date();
        const bookings = data.map((b) => ({ ...b, checkIn: parseISO(b.check_in), checkOut: parseISO(b.check_out) }));

        const upcoming = bookings.filter((b) => b.checkIn > now);
        const started = bookings.filter((b) => b.checkIn <= now);

        setNextStay(upcoming[0] || null);
        setHasActiveStay(bookings.some((b) => b.checkOut >= now));
        setStats({
          upcomingBookings: upcoming.length,
          pastStays: bookings.filter((b) => b.checkOut < now).length,
          nightsWithUs: started.reduce((sum, b) => sum + b.nights, 0),
        });
      }
    } catch {
      // A network-level failure would otherwise leave this stuck on
      // "Loading…" forever.
    } finally {
      setLoading(false);
    }
  };

  const daysUntil = nextStay
    ? differenceInCalendarDays(nextStay.checkIn, new Date())
    : null;

  return (
    <div className="dash-page">
      <header className="dash-page-head">
        <span className="dash-eyebrow">DASHBOARD</span>
        <h1>Welcome back, {displayName}.</h1>
        <p className="dash-lead">Here's what's coming up.</p>
      </header>

      {loading ? (
        <div className="dash-empty"><p>Loading…</p></div>
      ) : (
        <>
          {openEnquiry && <EnquiryStatusCard enquiry={openEnquiry} />}

          {/* Next stay hero */}
          {nextStay && (
            <section className="dash-next-stay">
              <div className="dash-next-stay-img">
                <img
                  src={APARTMENT.coverImage}
                  alt={APARTMENT.name}
                />
                <span className="dash-next-stay-badge">
                  <Clock size={12} /> In {daysUntil} day{daysUntil !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="dash-next-stay-body">
                <span className="dash-eyebrow">YOUR NEXT STAY</span>
                <h2>{APARTMENT.name}</h2>
                <div className="dash-loc">
                  <MapPin size={14} />
                  {APARTMENT.location}
                </div>

                <div className="dash-next-stay-details">
                  <div>
                    <div className="dash-detail-label">CHECK-IN</div>
                    <div className="dash-detail-value">
                      {format(nextStay.checkIn, 'EEE, d MMM')}
                    </div>
                  </div>
                  <div>
                    <div className="dash-detail-label">CHECK-OUT</div>
                    <div className="dash-detail-value">
                      {format(nextStay.checkOut, 'EEE, d MMM')}
                    </div>
                  </div>
                  <div>
                    <div className="dash-detail-label">NIGHTS</div>
                    <div className="dash-detail-value">{nextStay.nights}</div>
                  </div>
                  <div>
                    <div className="dash-detail-label">GUESTS</div>
                    <div className="dash-detail-value">{nextStay.guests}</div>
                  </div>
                </div>

                <div className="dash-next-stay-actions">
                  <Link
                    to="/dashboard/bookings"
                    className="dash-btn dash-btn-primary"
                  >
                    View trip <ArrowRight size={16} />
                  </Link>
                  <Link
                    to="/dashboard/messages"
                    className="dash-btn dash-btn-ghost"
                  >
                    <MessageSquare size={16} /> Message host
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* Stats */}
          <section className="dash-stat-grid">
            <StatCard label="Upcoming" value={stats.upcomingBookings} suffix="bookings" />
            <StatCard label="Past stays" value={stats.pastStays} suffix="visits" />
            <StatCard label="Nights with us" value={stats.nightsWithUs} suffix="total" />
          </section>

          {/* Check-in details — only for guests with a current/upcoming stay */}
          {checkInDetails && <CheckInDetailsCard details={checkInDetails} />}
        </>
      )}
    </div>
  );
}

function CheckInDetailsCard({ details: d }) {
  const hasWifi = d.wifi_network || d.wifi_password;
  return (
    <section className="dash-card" style={{ marginTop: 24 }}>
      <h2 className="dash-card-h">Check-in details</h2>
      <p className="dash-card-sub">Everything you need for your stay.</p>

      <div className="dash-checkin-grid">
        <div>
          <div className="dash-detail-label">CHECK-IN</div>
          <div className="dash-detail-value">{d.check_in_time}</div>
        </div>
        <div>
          <div className="dash-detail-label">CHECK-OUT</div>
          <div className="dash-detail-value">{d.check_out_time}</div>
        </div>
      </div>

      {hasWifi && (
        <div className="dash-checkin-item">
          <Wifi size={16} />
          <div>
            <div className="dash-checkin-item-label">WiFi</div>
            <div className="dash-checkin-item-body">
              {d.wifi_network && <div>{d.wifi_network}</div>}
              {d.wifi_password && <div className="dash-mono">{d.wifi_password}</div>}
            </div>
          </div>
        </div>
      )}

      {d.access_instructions && (
        <div className="dash-checkin-item">
          <KeyRound size={16} />
          <div>
            <div className="dash-checkin-item-label">How to get in</div>
            <div className="dash-checkin-item-body">{d.access_instructions}</div>
          </div>
        </div>
      )}

      {d.house_rules && (
        <div className="dash-checkin-item">
          <ScrollText size={16} />
          <div>
            <div className="dash-checkin-item-label">House rules</div>
            <div className="dash-checkin-item-body">{d.house_rules}</div>
          </div>
        </div>
      )}

      {d.host_notes && (
        <div className="dash-checkin-item">
          <Info size={16} />
          <div>
            <div className="dash-checkin-item-label">Good to know</div>
            <div className="dash-checkin-item-body">{d.host_notes}</div>
          </div>
        </div>
      )}
    </section>
  );
}

function EnquiryStatusCard({ enquiry: en }) {
  const dates = `${format(parseISO(en.check_in), 'd MMM')} → ${format(parseISO(en.check_out), 'd MMM yyyy')}`;
  return (
    <section className="dash-card" style={{ marginBottom: 24 }}>
      <h2 className="dash-card-h">Your enquiry</h2>
      <p className="dash-card-sub">{dates}</p>
      {en.status === 'declined' ? (
        <div className="form-error" style={{ marginBottom: 0 }}>
          Unfortunately we couldn't host you for these dates — they're no longer available.
          {en.decline_reason ? ` ${en.decline_reason}` : ''} Feel free to send a new enquiry with different dates any time.
        </div>
      ) : (
        <div className="field-note" style={{ marginTop: 0 }}>
          We're reviewing your enquiry — we'll be in touch soon to confirm availability and rates.
        </div>
      )}
    </section>
  );
}

function StatCard({ label, value, suffix }) {
  return (
    <div className="dash-stat">
      <div className="dash-stat-label">{label}</div>
      <div className="dash-stat-value">{value}</div>
      <div className="dash-stat-suffix">{suffix}</div>
    </div>
  );
}
