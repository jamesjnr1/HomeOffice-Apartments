import { useState } from 'react';
import { Mail, Phone, MessageCircle, Check, AlertCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Book — enquiry form that actually sends and actually persists.
 *
 * Duplicate enquiries: while a guest has an enquiry that hasn't turned
 * into a booking yet (marking it replied or archived does NOT release
 * this — only AdminEnquiries.jsx's "Confirm booking" does), for less
 * than 3 days, a second submission from the same email is rejected by
 * a database trigger (see supabase/migrations/20260909210000_block_
 * until_booked_not_just_replied.sql) — caught below and turned into a
 * friendly message. The 3-day window is deliberate: if an enquiry is
 * ever missed entirely, the guest isn't locked out forever waiting on
 * someone to notice. As soon as the email field loses focus,
 * has_open_enquiry() is also checked proactively so a guest with a
 * pending enquiry finds out before filling in the rest of the form,
 * not after.
 *
 * Availability: once both dates are picked, is_date_range_available()
 * (see supabase/migrations/20260910100100_prevent_overlapping_
 * bookings.sql) is also checked proactively — same privacy-safe,
 * boolean-only RPC shape as has_open_enquiry, so it never exposes who
 * else is staying when. This is only ever a heads-up, never a block:
 * the admin still makes the real call (see AdminEnquiries.jsx's
 * Confirm/Decline), since dates can free up or the admin may know
 * something the calendar doesn't yet.
 *
 * On submit: saves the enquiry to Supabase (table: enquiries) — this
 * is the single source of truth other pages (admin Enquiries inbox,
 * overview stats, the sidebar badge) read from. That insert is also
 * what triggers the admin email notification server-side (see
 * supabase/migrations/20260909220000_notify_enquiry_by_email.sql and
 * supabase/functions/notify-enquiry) — this used to be a second,
 * separate POST to Formspree from the guest's own browser, which
 * meant a flaky guest connection could silently mean the notification
 * never arrived even though the enquiry itself saved fine. Now
 * there's exactly one write, and the notification is guaranteed by
 * the database itself rather than by the guest's browser completing a
 * second request. If Supabase isn't configured at all, guests are
 * told to email directly.
 */

const CONTACT_EMAIL = 'jamesduah@gmail.com';
const CONTACT_PHONE = '+233 20 630 1032';
const WHATSAPP_NUMBER = '233206301032'; // CONTACT_PHONE in E.164, no spaces or +

export default function Book() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', checkIn: '', checkOut: '',
    guests: '2', message: '',
  });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingNotice, setPendingNotice] = useState(false);
  const [availabilityNotice, setAvailabilityNotice] = useState(false);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Proactive check as soon as the guest moves on from the email
  // field — so they find out about a pending enquiry before filling
  // in the rest of the form, not after submitting it.
  const checkPendingEnquiry = async () => {
    if (!isSupabaseConfigured || !form.email.trim()) return;
    const { data } = await supabase.rpc('has_open_enquiry', { check_email: form.email.trim() });
    setPendingNotice(!!data);
  };

  // Same idea, for dates: once both are picked, check them against
  // existing bookings. Purely a heads-up (see doc comment above) —
  // never blocks the form.
  const checkAvailability = async () => {
    if (!isSupabaseConfigured || !form.checkIn || !form.checkOut) { setAvailabilityNotice(false); return; }
    if (new Date(form.checkOut) <= new Date(form.checkIn)) { setAvailabilityNotice(false); return; }
    const { data } = await supabase.rpc('is_date_range_available', {
      check_in: form.checkIn,
      check_out: form.checkOut,
    });
    setAvailabilityNotice(data === false);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!form.name.trim() || !form.email.trim() || !form.checkIn || !form.checkOut) {
      setError('Please fill in your name, email, and dates.');
      return;
    }
    if (new Date(form.checkOut) <= new Date(form.checkIn)) {
      setError('Check-out must be after check-in.');
      return;
    }

    if (!isSupabaseConfigured) {
      setError(
        `Enquiries aren't wired up yet. Please email ${CONTACT_EMAIL} directly and we'll get right back to you.`
      );
      return;
    }

    setLoading(true);
    try {
      const { error: dbError } = await supabase.from('enquiries').insert({
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        check_in: form.checkIn,
        check_out: form.checkOut,
        guests: Number(form.guests),
        message: form.message || null,
      });

      if (dbError?.message?.includes('DUPLICATE_OPEN_ENQUIRY')) {
        setError(
          `You already have an enquiry with us that we're still working on — we'll be in touch soon! Email ${CONTACT_EMAIL} if it's urgent.`
        );
        setLoading(false);
        return;
      }
      if (dbError) throw dbError;

      setSent(true);
      setPendingNotice(false);
      setAvailabilityNotice(false);
      setForm({
        name: '', email: '', phone: '', checkIn: '', checkOut: '',
        guests: '2', message: '',
      });
    } catch (err) {
      setError(
        `Sorry — we couldn't send that. Please try again, or email ${CONTACT_EMAIL} directly.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="page-header page-header-v2">
        <div className="container">
          <span className="eyebrow">ENQUIRE</span>
          <h1>Plan your stay.</h1>
          <p className="lead">
            Tell us when you'd like to visit. We'll come back with availability and rates within a day.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 20 }}>
        <div className="container">
          <div className="book-grid">
            {/* Form */}
            <form className="book-form" onSubmit={submit} noValidate>
              {error && (
                <div className="form-error" role="alert">
                  <AlertCircle size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                  {error}
                </div>
              )}

              <div className="field">
                <label>Your full name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={update('name')}
                  placeholder="Jane Adjei"
                  required
                  disabled={loading}
                />
              </div>

              <div className="field-row">
                <div className="field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => { setPendingNotice(false); update('email')(e); }}
                    onBlur={checkPendingEnquiry}
                    placeholder="jane@example.com"
                    required
                    disabled={loading}
                  />
                  {pendingNotice && (
                    <p className="field-note">
                      You already have an enquiry with us we're still working on — no need to send another, we'll be in touch soon.
                    </p>
                  )}
                </div>
                <div className="field">
                  <label>Phone / WhatsApp</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={update('phone')}
                    placeholder="+233 …"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label>Check-in</label>
                  <input
                    type="date"
                    value={form.checkIn}
                    onChange={(e) => { setAvailabilityNotice(false); update('checkIn')(e); }}
                    onBlur={checkAvailability}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="field">
                  <label>Check-out</label>
                  <input
                    type="date"
                    value={form.checkOut}
                    onChange={(e) => { setAvailabilityNotice(false); update('checkOut')(e); }}
                    onBlur={checkAvailability}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              {availabilityNotice && (
                <p className="field-note">
                  Heads up — those dates may already be booked. We'll confirm availability when we reply, or feel free to try different dates.
                </p>
              )}

              <div className="field">
                <label>Guests</label>
                <select value={form.guests} onChange={update('guests')} disabled={loading}>
                  <option value="1">1 guest</option>
                  <option value="2">2 guests</option>
                  <option value="3">3 guests</option>
                  <option value="4">4 guests</option>
                </select>
              </div>

              <div className="field">
                <label>Anything we should know?</label>
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={update('message')}
                  placeholder="Visit purpose, arrival time, special requests…"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg btn-block"
                disabled={loading}
              >
                {loading ? 'Sending…' : 'Send enquiry'}
              </button>
              <p className="fine-print">
                By sending this enquiry, you'll receive a reply at the email above. We don't share your details.
              </p>
            </form>

            {/* Sidebar */}
            <aside className="book-side">
              <div className="side-card">
                <img
                  src="/images/hero-property.jpg"
                  alt="Home-Office Apartments"
                />
                <div className="side-body">
                  <h3>Home-Office Apartments</h3>
                  <p className="text-muted small">LivingSpring Gardens · Sunyani, Ghana</p>
                  <div className="side-divider" />

                  <ul className="side-list">
                    <li><strong>Sleeps up to 4</strong><span>4 bedrooms · 5 beds · 4 baths</span></li>
                    <li><strong>Fully self-contained</strong><span>Kitchen &amp; private verandah</span></li>
                    <li><strong>Central Sunyani</strong><span>Minutes from market &amp; cafés</span></li>
                  </ul>

                  <div className="side-divider" />
                  <h4>Rates</h4>
                  <ul className="side-list">
                    <li><strong>$41 / night</strong><span>Base rate per apartment</span></li>
                    <li><strong>$10 off</strong><span>When booked for 5 nights</span></li>
                    <li><strong>20% off</strong><span>When booked for 28–30 nights</span></li>
                  </ul>

                  <div className="side-divider" />
                  <h4>Prefer to chat?</h4>
                  <a className="contact-line" href={`mailto:${CONTACT_EMAIL}`}>
                    <Mail size={14} /> {CONTACT_EMAIL}
                  </a>
                  <a className="contact-line" href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`}>
                    <Phone size={14} /> {CONTACT_PHONE}
                  </a>
                  <a
                    className="contact-line"
                    href={`https://wa.me/${WHATSAPP_NUMBER}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle size={14} /> WhatsApp
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Success modal */}
      {sent && (
        <div className="modal" onClick={() => setSent(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="check-mark"><Check size={32} /></div>
            <h2>Enquiry sent.</h2>
            <p>Thanks — we'll be in touch shortly to confirm availability and share rates.</p>
            <button className="btn btn-outline" onClick={() => setSent(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
