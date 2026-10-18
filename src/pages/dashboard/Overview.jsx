import { Link, useOutletContext } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { differenceInCalendarDays, format, parseISO, startOfToday } from 'date-fns';
import {
  MapPin,
  ArrowRight,
  MessageSquare,
  Wifi,
  KeyRound,
  ScrollText,
  Info,
  Users,
  BedDouble,
  CalendarCheck,
  CalendarX,
  Moon,
  Wallet,
  Hash,
  CalendarDays,
  History,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { APARTMENTS, apartmentName } from '../../lib/apartments';
import PropertyGallery from '../../components/PropertyGallery';

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
  location: 'Sunyani, Ghana',
};

// Only a paid booking is a real stay — an `awaiting_payment` one isn't
// held yet (see DashboardLayout's PaymentDueBanner), so it never
// counts as "upcoming" or towards nights/past stays here.
const PAID = ['confirmed', 'completed'];

export default function Overview() {
  const { user, displayName } = useOutletContext();
  const [nextStay, setNextStay] = useState(null);
  // True when nextStay is the stay the guest is in right now (checked in,
  // not yet past check-out day) rather than a future one.
  const [stayingNow, setStayingNow] = useState(false);
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
        const today = startOfToday();
        const bookings = data
          .filter((b) => PAID.includes(b.status))
          .map((b) => ({ ...b, checkIn: parseISO(b.check_in), checkOut: parseISO(b.check_out) }));

        const current = bookings.find((b) => b.checkIn <= today && b.checkOut >= today);
        const upcoming = bookings.filter((b) => b.checkIn > today);
        const started = bookings.filter((b) => b.checkIn <= today);

        setNextStay(current || upcoming[0] || null);
        setStayingNow(!!current);
        setHasActiveStay(bookings.some((b) => b.checkOut >= today));
        setStats({
          upcomingBookings: upcoming.length,
          pastStays: bookings.filter((b) => b.checkOut < now).length,
          nightsWithUs: started.reduce((sum, b) => sum + (b.nights || 0), 0),
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
  const countdown = daysUntil === null ? ''
    : daysUntil <= 0 ? 'Today'
    : daysUntil === 1 ? 'Tomorrow'
    : `In ${daysUntil} days`;

  return (
    <div className="dash-page">
      <header className="dash-page-head dash-welcome">
        <h1>Welcome back, {displayName}</h1>
        <p className="dash-lead">It's good to see you again!</p>
      </header>

      {loading ? (
        <div className="dash-empty"><p>Loading…</p></div>
      ) : (
        <>
          {openEnquiry && <EnquiryStatusCard enquiry={openEnquiry} />}

          {nextStay ? (
            <section className="dash-glass">
              <div className="dash-glass-head">
                <div>
                  <span className="dash-glass-label">
                    {stayingNow
                      ? `You're staying with us · ${differenceInCalendarDays(nextStay.checkOut, new Date()) <= 0 ? 'check-out today' : `leaves ${format(nextStay.checkOut, 'EEE d MMM')}`}`
                      : `Your next stay · ${countdown}`}
                  </span>
                  <h2>{apartmentName(nextStay.apartment)}</h2>
                  <div className="dash-loc"><MapPin size={13} /> {APARTMENT.location}</div>
                </div>
                <div className="dash-glass-actions">
                  <Link to="/dashboard/bookings" className="dash-btn dash-btn-primary">
                    View trip <ArrowRight size={16} />
                  </Link>
                  <Link to="/dashboard/messages" className="dash-btn dash-btn-ghost">
                    <MessageSquare size={16} /> Message host
                  </Link>
                </div>
              </div>
              <div className="dash-tiles">
                <Tile icon={CalendarCheck} label="Check-in" value={format(nextStay.checkIn, 'EEE, d MMM')} />
                <Tile icon={CalendarX} label="Check-out" value={format(nextStay.checkOut, 'EEE, d MMM')} />
                <Tile icon={Moon} label="Nights" value={nextStay.nights} />
                <Tile icon={Users} label="Guests" value={nextStay.guests} />
                <Tile icon={Wallet} label="Paid" value={`GHS ${Number(nextStay.total).toLocaleString()}`} />
                <Tile icon={Hash} label="Reference" value={nextStay.reference} mono />
              </div>
            </section>
          ) : (
            <section className="dash-glass">
              <div className="dash-glass-head">
                <div>
                  <span className="dash-glass-label">Your next stay</span>
                  <h2>No confirmed stays yet</h2>
                  <div className="dash-loc">Once a booking is paid, it shows up here.</div>
                </div>
                <div className="dash-glass-actions">
                  <Link to="/book" className="dash-btn dash-btn-primary">
                    Book a stay <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </section>
          )}

          <section className="dash-glass">
            <span className="dash-glass-label">At a glance</span>
            <div className="dash-tiles dash-tiles-3">
              <Tile icon={CalendarDays} label="Upcoming stays" value={stats.upcomingBookings} />
              <Tile icon={History} label="Past stays" value={stats.pastStays} />
              <Tile icon={Moon} label="Nights with us" value={stats.nightsWithUs} />
            </div>
          </section>

          {/* Check-in details — only for guests with a current/upcoming paid stay */}
          {checkInDetails && <CheckInDetailsCard details={checkInDetails} />}

          {/* Room capacity/beds + the real facilities gallery — same
              content AdminGuestDetail shows an admin for any guest
              (see PropertyGallery), just framed as "your stay". */}
          {nextStay && (
            <section className="dash-card" style={{ marginTop: 18 }}>
              <div className="dash-stay-facts">
                <div className="dash-stay-fact">
                  <Users size={14} />
                  <div><span className="dash-detail-label">ROOM CAPACITY</span><span className="dash-detail-value">Up to {APARTMENTS[nextStay.apartment]?.guests ?? nextStay.guests} guests</span></div>
                </div>
                <div className="dash-stay-fact">
                  <BedDouble size={14} />
                  <div><span className="dash-detail-label">BEDS</span><span className="dash-detail-value">{APARTMENTS[nextStay.apartment]?.bedrooms} bedrooms · {APARTMENTS[nextStay.apartment]?.beds} beds</span></div>
                </div>
              </div>
              <PropertyGallery />
            </section>
          )}
        </>
      )}
    </div>
  );
}

function Tile({ icon: Icon, label, value, mono }) {
  return (
    <div className="dash-tile">
      <Icon size={17} strokeWidth={1.8} />
      <span className="dash-tile-label">{label}</span>
      <span className={`dash-tile-value${mono ? ' dash-mono' : ''}`}>{value}</span>
    </div>
  );
}

function CheckInDetailsCard({ details: d }) {
  const hasWifi = d.wifi_network || d.wifi_password;
  return (
    <section className="dash-card" style={{ marginTop: 18 }}>
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
    <section className="dash-card" style={{ marginBottom: 18 }}>
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

