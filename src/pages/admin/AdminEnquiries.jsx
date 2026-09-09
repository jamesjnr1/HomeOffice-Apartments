import { Fragment, useState, useEffect } from 'react';
import { Check, Reply, Archive, Trash2, CalendarCheck, Ban, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../../lib/supabase';

/**
 * AdminEnquiries — real submissions from the public Book form, stored
 * in the `enquiries` table (see supabase/migrations/20260909140000_
 * create_enquiries.sql). Kept live via a realtime subscription, same
 * pattern as AdminMessages.jsx.
 *
 * Also where an enquiry becomes a real booking (Phase 2): expand a row
 * and enter the agreed total to create a `bookings` row (see
 * supabase/migrations/20260909150000_create_bookings.sql). That's the
 * only place bookings get created — no on-site payment, the admin
 * confirms after agreeing dates/price with the guest directly. It's
 * also one of the two things that release a guest to submit another
 * enquiry — see the urgency() helper below and supabase/migrations/
 * 20260909210000_block_until_booked_not_just_replied.sql. Marking an
 * enquiry replied or archived deliberately does NOT release it;
 * declining it (see declineEnquiry below) does, immediately.
 *
 * Reservation conflicts: since 20260910100100_prevent_overlapping_
 * bookings.sql, two confirmed bookings can never actually overlap —
 * the database rejects it outright. This page surfaces that ahead of
 * time (the overlap() badge below) so an admin sees the conflict
 * before trying, and offers Decline as the resolution — see
 * declineEnquiry, which emails the guest via supabase/migrations/
 * 20260910100200_notify_enquiry_declined.sql and, if they have an
 * account, also leaves them a message they'll see on next login.
 */

const TABS = ['all', 'new', 'replied', 'archived', 'declined'];
const RESUBMIT_WINDOW_MS = 3 * 24 * 60 * 60 * 1000; // keep in sync with the
// 3-day window in supabase/migrations/20260909210000_block_until_booked_not_just_replied.sql

function makeReference() {
  const code = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `HO-${code}`;
}

// Do two date ranges (as YYYY-MM-DD strings, check-out exclusive)
// overlap? Mirrors the daterange && check the DB does in
// bookings_no_date_overlap and is_date_range_available.
function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

// An enquiry that hasn't become a booking yet blocks the same email
// from resubmitting — marking it replied or archived does NOT release
// this, only confirming a booking or declining it does (or the 3-day
// self-expiry). Surfaced here so a second enquiry from the same
// person, once the window opens, doesn't come as a surprise.
function urgency(e) {
  if (e.booking_id || e.status === 'declined') return null;
  const remaining = RESUBMIT_WINDOW_MS - (Date.now() - new Date(e.created_at).getTime());
  if (remaining <= 0) return { label: 'Overdue · guest can resubmit', className: 'cancelled' };
  if (remaining <= 24 * 60 * 60 * 1000) {
    const hrs = Math.max(1, Math.round(remaining / (60 * 60 * 1000)));
    return { label: `Resubmit window opens in ${hrs}h`, className: 'pending' };
  }
  return null;
}

export default function AdminEnquiries() {
  const [tab, setTab] = useState('all');
  const [enquiries, setEnquiries] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [amounts, setAmounts] = useState({}); // enquiry id -> draft total string
  const [declineReasons, setDeclineReasons] = useState({}); // enquiry id -> draft reason string
  const [confirmingId, setConfirmingId] = useState(null);
  const [decliningId, setDecliningId] = useState(null);
  const [bookError, setBookError] = useState('');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    loadEnquiries();

    const sub = supabase
      .channel('admin-enquiries')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enquiries' }, loadEnquiries)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, loadEnquiries)
      .subscribe();

    return () => { supabase.removeChannel(sub); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadEnquiries = async () => {
    try {
      // Embedded select pulls the linked booking's reference/status in
      // one query, so a converted enquiry can show "Booked · HO-XXXXX"
      // without a second round trip. There are two FKs between these
      // tables (bookings.enquiry_id and enquiries.booking_id), so the
      // embed is ambiguous unless we name the constraint — without
      // this, PostgREST errors on every request and the whole list
      // silently comes back empty (this was the "enquiries not
      // showing" bug).
      const [enquiriesRes, bookingsRes] = await Promise.all([
        supabase
          .from('enquiries')
          .select('*, bookings!enquiries_booking_id_fkey(reference, status)')
          .order('created_at', { ascending: false }),
        // All bookings' dates, for the overlap warning below — full
        // row detail is fine here, this page is already admin-only.
        supabase
          .from('bookings')
          .select('id, reference, status, check_in, check_out')
          .neq('status', 'cancelled'),
      ]);

      if (enquiriesRes.error) {
        // Surface it instead of silently leaving the list empty —
        // that silence is exactly how the ambiguous-embed bug above
        // went unnoticed.
        setLoadError(enquiriesRes.error.message);
      } else if (enquiriesRes.data) {
        setEnquiries(enquiriesRes.data);
        setLoadError('');
      }
      if (bookingsRes.data) setBookings(bookingsRes.data);
    } catch {
      setLoadError("Couldn't reach the database — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Does this (not-yet-booked) enquiry's date range overlap an
  // existing confirmed booking? Advisory only — the database itself
  // is the real backstop (bookings_no_date_overlap), this just lets
  // an admin see the conflict before trying instead of hitting an
  // error after filling in the amount.
  const overlap = (e) => {
    if (e.booking_id) return null;
    return bookings.find(b => rangesOverlap(e.check_in, e.check_out, b.check_in, b.check_out)) || null;
  };

  const filtered = enquiries.filter(e => tab === 'all' || e.status === tab);
  const counts = Object.fromEntries(TABS.map(t => [t, t === 'all' ? enquiries.length : enquiries.filter(e => e.status === t).length]));

  const act = async (id, status) => {
    setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status } : e));
    await supabase.from('enquiries').update({ status }).eq('id', id);
  };

  const remove = async (id) => {
    setEnquiries(prev => prev.filter(e => e.id !== id));
    if (expanded === id) setExpanded(null);
    await supabase.from('enquiries').delete().eq('id', id);
  };

  const confirmBooking = async (e) => {
    const total = Number(amounts[e.id]);
    if (!total || total <= 0) {
      setBookError('Enter the agreed total before confirming.');
      return;
    }
    const conflict = overlap(e);
    if (conflict) {
      setBookError(`Those dates overlap an existing booking (${conflict.reference}). Decline this enquiry instead, or agree different dates first.`);
      return;
    }
    setBookError('');
    setConfirmingId(e.id);

    // Best-effort: if this guest already has an account under the
    // same email, link the booking to it so it shows in their
    // dashboard. No account yet → guest_id stays null.
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', e.email)
      .maybeSingle();

    const bookingRow = {
      enquiry_id: e.id,
      guest_id: profile?.id || null,
      guest_name: e.name,
      guest_email: e.email,
      guest_phone: e.phone || null,
      check_in: e.check_in,
      check_out: e.check_out,
      guests: e.guests,
      total,
      status: 'confirmed',
    };

    // `reference` has a unique constraint — retry once on the rare
    // collision instead of failing the whole confirmation. A
    // '23P01' here means the overlap check above raced with another
    // confirmation (or missed something) — the DB's own exclusion
    // constraint (bookings_no_date_overlap) is the real backstop, so
    // it still can't happen even if the advisory check above is wrong.
    let inserted = null;
    for (let attempt = 0; attempt < 2 && !inserted; attempt++) {
      const { data, error } = await supabase
        .from('bookings')
        .insert({ ...bookingRow, reference: makeReference() })
        .select()
        .single();
      if (!error) inserted = data;
      else if (error.code === '23P01') {
        setBookError('Those dates overlap an existing booking. Decline this enquiry instead, or agree different dates first.');
        setConfirmingId(null);
        return;
      } else if (!String(error.message).includes('reference')) {
        setBookError("Couldn't create the booking. Please try again.");
        setConfirmingId(null);
        return;
      }
    }
    if (!inserted) {
      setBookError("Couldn't create the booking. Please try again.");
      setConfirmingId(null);
      return;
    }

    await supabase
      .from('enquiries')
      .update({ booking_id: inserted.id, status: e.status === 'new' ? 'replied' : e.status })
      .eq('id', e.id);

    setEnquiries(prev => prev.map(row => row.id === e.id
      ? { ...row, booking_id: inserted.id, bookings: { reference: inserted.reference, status: inserted.status }, status: row.status === 'new' ? 'replied' : row.status }
      : row));
    setBookings(prev => [...prev, { id: inserted.id, reference: inserted.reference, status: inserted.status, check_in: inserted.check_in, check_out: inserted.check_out }]);
    setConfirmingId(null);
  };

  // Decline — most commonly used when the requested dates conflict
  // with an existing booking (see the overlap warning above), but
  // works for any reason. Releases the duplicate-enquiry block
  // immediately (the DB trigger checks status <> 'declined') and
  // notifies the guest two ways: an email always (see
  // 20260910100200_notify_enquiry_declined.sql), and — best-effort,
  // same email-match pattern as confirmBooking — an in-app message if
  // they already have an account, so it's waiting on their dashboard
  // even before they check their inbox.
  const declineEnquiry = async (e) => {
    const reason = (declineReasons[e.id] || '').trim();
    setDecliningId(e.id);
    setBookError('');

    const { error } = await supabase
      .from('enquiries')
      .update({ status: 'declined', decline_reason: reason || null })
      .eq('id', e.id);

    if (error) {
      setBookError("Couldn't decline this enquiry. Please try again.");
      setDecliningId(null);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', e.email)
      .maybeSingle();

    if (profile?.id) {
      await supabase.from('messages').insert({
        guest_id: profile.id,
        guest_name: e.name,
        guest_email: e.email,
        from_admin: true,
        body: reason
          ? `About your enquiry for ${e.check_in} → ${e.check_out}: ${reason}`
          : `Unfortunately we can't host you for ${e.check_in} → ${e.check_out} — those dates are no longer available. Feel free to send a new enquiry with different dates any time.`,
        read_by_guest: false,
        read_by_admin: true,
      });
    }

    setEnquiries(prev => prev.map(row => row.id === e.id ? { ...row, status: 'declined', decline_reason: reason || null } : row));
    setDecliningId(null);
  };

  return (
    <div className="mgmt-page">
      <header className="mgmt-page-head">
        <span className="mgmt-eyebrow">ENQUIRIES</span>
        <h1>Enquiries inbox</h1>
        <p className="mgmt-lead">Every booking request submitted through the site.</p>
      </header>

      <div className="mgmt-tabs">
        {TABS.map(t => (
          <button key={t} className={`mgmt-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
            <span className="mgmt-tab-count">{counts[t]}</span>
          </button>
        ))}
      </div>

      {loadError && (
        <div className="form-error" style={{ marginBottom: 16 }}>
          Couldn't load enquiries: {loadError}
        </div>
      )}

      <div className="mgmt-card mgmt-card-flush">
        {loading ? (
          <div className="mgmt-empty"><p>Loading enquiries…</p></div>
        ) : filtered.length === 0 ? (
          <div className="mgmt-empty"><p>No enquiries in this category.</p></div>
        ) : (
          <div className="mgmt-table-wrap">
            <table className="mgmt-table">
              <thead>
                <tr><th>Guest</th><th>Dates</th><th>Guests</th><th>Status</th><th>Received</th><th></th></tr>
              </thead>
              <tbody>
                {filtered.map(e => {
                  const conflict = overlap(e);
                  return (
                  <Fragment key={e.id}>
                    <tr
                      className={`mgmt-tr-click ${expanded === e.id ? 'expanded' : ''}`}
                      onClick={() => { setExpanded(expanded === e.id ? null : e.id); setBookError(''); }}
                    >
                      <td><div className="mgmt-td-primary">{e.name}</div><div className="mgmt-td-sub">{e.email}</div></td>
                      <td>{e.check_in} → {e.check_out}</td>
                      <td>{e.guests}</td>
                      <td>
                        <span className={`mgmt-status ${e.status}`}>{e.status}</span>
                        {e.bookings && (
                          <span className="mgmt-status confirmed" style={{ marginLeft: 6 }}>
                            Booked · {e.bookings.reference}
                          </span>
                        )}
                        {urgency(e) && (
                          <span className={`mgmt-status ${urgency(e).className}`} style={{ marginLeft: 6 }}>
                            {urgency(e).label}
                          </span>
                        )}
                        {conflict && (
                          <span className="mgmt-status cancelled" style={{ marginLeft: 6 }} title={`Overlaps ${conflict.reference}`}>
                            <AlertTriangle size={11} style={{ verticalAlign: -1, marginRight: 3 }} />
                            Dates taken · {conflict.reference}
                          </span>
                        )}
                      </td>
                      <td className="mgmt-td-muted">{formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}</td>
                      <td>
                        <div className="mgmt-row-actions" onClick={ev => ev.stopPropagation()}>
                          <button title="Mark replied" onClick={() => act(e.id,'replied')}><Check size={14}/></button>
                          <button title="Archive" onClick={() => act(e.id,'archived')}><Archive size={14}/></button>
                          <button title="Delete" onClick={() => remove(e.id)} className="mgmt-action-danger"><Trash2 size={14}/></button>
                        </div>
                      </td>
                    </tr>
                    {expanded === e.id && (
                      <tr className="mgmt-tr-expanded">
                        <td colSpan={6}>
                          <div className="mgmt-expanded-body">
                            {e.message && <p><strong>Message:</strong> {e.message}</p>}
                            {e.phone && <p><strong>Phone:</strong> {e.phone}</p>}
                            {e.status === 'declined' && (
                              <p className="mgmt-td-muted">
                                Declined{e.decline_reason ? ` — ${e.decline_reason}` : ''}.
                              </p>
                            )}
                            <div className="mgmt-expanded-actions">
                              <a className="mgmt-btn mgmt-btn-primary" href={`mailto:${e.email}?subject=Re: Your enquiry — Home-Office Apartments`}>
                                <Reply size={14}/> Reply by email
                              </a>
                              {e.phone && (
                                <a className="mgmt-btn mgmt-btn-outline" href={`tel:${e.phone}`}>
                                  Call
                                </a>
                              )}
                            </div>

                            <div className="mgmt-divider" />

                            {e.bookings ? (
                              <p className="mgmt-td-muted">
                                Already booked as <strong>{e.bookings.reference}</strong> ({e.bookings.status}).
                              </p>
                            ) : e.status === 'declined' ? null : (
                              <div className="mgmt-decision-row" onClick={ev => ev.stopPropagation()}>
                                <div className="mgmt-confirm-booking">
                                  {conflict && (
                                    <p className="form-error" style={{ margin: '0 0 10px' }}>
                                      <AlertTriangle size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
                                      These dates overlap an existing booking ({conflict.reference}). Confirming will fail — decline this enquiry instead, or agree different dates.
                                    </p>
                                  )}
                                  <label>
                                    <span>Agreed total (GHS)</span>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      placeholder="e.g. 2480"
                                      value={amounts[e.id] || ''}
                                      onChange={ev => setAmounts(prev => ({ ...prev, [e.id]: ev.target.value }))}
                                    />
                                  </label>
                                  <button
                                    className="mgmt-btn mgmt-btn-primary"
                                    disabled={confirmingId === e.id || decliningId === e.id}
                                    onClick={() => confirmBooking(e)}
                                  >
                                    <CalendarCheck size={14}/> {confirmingId === e.id ? 'Confirming…' : 'Confirm booking'}
                                  </button>
                                </div>

                                <div className="mgmt-decline-box">
                                  <label>
                                    <span>Decline reason (optional, shown to guest)</span>
                                    <input
                                      type="text"
                                      placeholder="e.g. Those dates are already booked"
                                      value={declineReasons[e.id] || ''}
                                      onChange={ev => setDeclineReasons(prev => ({ ...prev, [e.id]: ev.target.value }))}
                                    />
                                  </label>
                                  <button
                                    className="mgmt-btn mgmt-btn-outline mgmt-action-danger"
                                    disabled={confirmingId === e.id || decliningId === e.id}
                                    onClick={() => declineEnquiry(e)}
                                  >
                                    <Ban size={14}/> {decliningId === e.id ? 'Declining…' : 'Decline enquiry'}
                                  </button>
                                </div>

                                {bookError && confirmingId === null && decliningId === null && (
                                  <span className="form-error" style={{ margin: 0 }}>{bookError}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
