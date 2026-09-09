import { Fragment, useState, useEffect } from 'react';
import { Check, Reply, Archive, Trash2, CalendarCheck } from 'lucide-react';
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
 * also the only thing that releases a guest to submit another enquiry
 * — see the urgency() helper below and supabase/migrations/
 * 20260909210000_block_until_booked_not_just_replied.sql. Marking an
 * enquiry replied or archived deliberately does NOT release it.
 */

const TABS = ['all', 'new', 'replied', 'archived'];
const RESUBMIT_WINDOW_MS = 3 * 24 * 60 * 60 * 1000; // keep in sync with the
// 3-day window in supabase/migrations/20260909210000_block_until_booked_not_just_replied.sql

function makeReference() {
  const code = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `HO-${code}`;
}

// An enquiry that hasn't become a booking yet blocks the same email
// from resubmitting — marking it replied or archived does NOT release
// this, only confirming a booking does (see confirmBooking below) or
// the 3-day self-expiry. Surfaced here so a second enquiry from the
// same person, once the window opens, doesn't come as a surprise.
function urgency(e) {
  if (e.booking_id) return null;
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
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [amounts, setAmounts] = useState({}); // enquiry id -> draft total string
  const [confirmingId, setConfirmingId] = useState(null);
  const [bookError, setBookError] = useState('');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    loadEnquiries();

    const sub = supabase
      .channel('admin-enquiries')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enquiries' }, loadEnquiries)
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
      const { data, error } = await supabase
        .from('enquiries')
        .select('*, bookings!enquiries_booking_id_fkey(reference, status)')
        .order('created_at', { ascending: false });

      if (error) {
        // Surface it instead of silently leaving the list empty —
        // that silence is exactly how the ambiguous-embed bug above
        // went unnoticed.
        setLoadError(error.message);
      } else if (data) {
        setEnquiries(data);
        setLoadError('');
      }
    } catch {
      setLoadError("Couldn't reach the database — check your connection and try again.");
    } finally {
      setLoading(false);
    }
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
    // collision instead of failing the whole confirmation.
    let inserted = null;
    for (let attempt = 0; attempt < 2 && !inserted; attempt++) {
      const { data, error } = await supabase
        .from('bookings')
        .insert({ ...bookingRow, reference: makeReference() })
        .select()
        .single();
      if (!error) inserted = data;
      else if (!String(error.message).includes('reference')) {
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
    setConfirmingId(null);
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
                {filtered.map(e => (
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
                            ) : (
                              <div className="mgmt-confirm-booking" onClick={ev => ev.stopPropagation()}>
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
                                  disabled={confirmingId === e.id}
                                  onClick={() => confirmBooking(e)}
                                >
                                  <CalendarCheck size={14}/> {confirmingId === e.id ? 'Confirming…' : 'Confirm booking'}
                                </button>
                                {bookError && confirmingId === null && (
                                  <span className="form-error" style={{ margin: 0 }}>{bookError}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
