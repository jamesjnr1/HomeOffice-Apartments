import { useState, useMemo } from 'react';
import { Mail, Phone, MessageCircle, Check, AlertCircle, CreditCard, Loader2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { APARTMENT_LIST, APARTMENTS, DEFAULT_APARTMENT } from '../lib/apartments';
import { NIGHTLY_RATE_GHS, MULTI_NIGHT_DISCOUNT_GHS, LONG_STAY_DISCOUNT_PCT, nightsBetween, calculateTotal } from '../lib/pricing';

/**
 * Book — the public booking page. Two ways to reach out:
 *
 * "Book & pay now" — the fast path. Calls the book-and-pay edge
 * function (see supabase/functions/book-and-pay/index.ts), which
 * checks the dates are actually free (against this site's own
 * bookings AND the Airbnb-synced calendar), computes the real GHS
 * total itself, creates the booking, opens a Paystack checkout, and
 * hands back the checkout URL — the browser redirects straight there.
 * No admin step for the common case: if the dates are free, payment is
 * the only thing standing between "Book & pay now" and a confirmed
 * stay. If the dates turn out NOT to be free (or a race loses to
 * another booking at the last moment), the edge function falls back
 * to filing a plain enquiry instead, and this page shows the same
 * "Enquiry sent" confirmation as the question-only path below.
 *
 * "Send a question instead" — for anyone not ready to commit to dates
 * (custom requests, long-stay negotiation, etc.) — a plain enquiry,
 * inserted directly into `enquiries` exactly as before. Same duplicate-
 * enquiry guard (has_open_enquiry / the 3-day resubmit window) applies
 * here, not to the pay-now path.
 *
 * Live price estimate: computed client-side from src/lib/pricing.js
 * purely for display — the edge function keeps its own copy of the
 * exact same math as the real source of truth for what's charged.
 */

const CONTACT_EMAIL = 'jamesd@home-officegroup.com';
const CONTACT_PHONE = '+233 20 630 1032';
const WHATSAPP_NUMBER = '233206301032'; // CONTACT_PHONE in E.164, no spaces or +

export default function Book() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', checkIn: '', checkOut: '',
    guests: '2', message: '', apartment: DEFAULT_APARTMENT,
  });
  const [sent, setSent] = useState(false);
  const [booking, setBooking] = useState(false);
  const [sendingEnquiry, setSendingEnquiry] = useState(false);
  const [error, setError] = useState('');
  const [pendingNotice, setPendingNotice] = useState(false);
  const [availabilityNotice, setAvailabilityNotice] = useState(false);

  const loading = booking || sendingEnquiry;
  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const nights = useMemo(() => nightsBetween(form.checkIn, form.checkOut), [form.checkIn, form.checkOut]);
  const total = useMemo(() => calculateTotal(nights), [nights]);

  const checkPendingEnquiry = async () => {
    if (!isSupabaseConfigured || !form.email.trim()) return;
    const { data } = await supabase.rpc('has_open_enquiry', { check_email: form.email.trim() });
    setPendingNotice(!!data);
  };

  const checkAvailability = async () => {
    if (!isSupabaseConfigured || !form.checkIn || !form.checkOut) { setAvailabilityNotice(false); return; }
    if (new Date(form.checkOut) <= new Date(form.checkIn)) { setAvailabilityNotice(false); return; }
    const { data } = await supabase.rpc('is_date_range_available', {
      check_in: form.checkIn,
      check_out: form.checkOut,
      apartment: form.apartment,
    });
    setAvailabilityNotice(data === false);
  };

  const validate = () => {
    if (!form.name.trim() || !form.email.trim() || !form.checkIn || !form.checkOut) {
      setError('Please fill in your name, email, and dates.');
      return false;
    }
    if (new Date(form.checkOut) <= new Date(form.checkIn)) {
      setError('Check-out must be after check-in.');
      return false;
    }
    if (!isSupabaseConfigured) {
      setError(`Booking isn't wired up yet. Please email ${CONTACT_EMAIL} directly and we'll get right back to you.`);
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setPendingNotice(false);
    setAvailabilityNotice(false);
    setForm({ name: '', email: '', phone: '', checkIn: '', checkOut: '', guests: '2', message: '', apartment: DEFAULT_APARTMENT });
  };

  // The fast path: check dates are free, pay, done. Redirects the
  // whole page to Paystack's checkout on success — nothing left to
  // render here in that case. Falls back to a plain enquiry (same
  // "Enquiry sent" confirmation as the question-only path) if the
  // edge function finds the dates aren't actually available.
  const bookAndPay = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setBooking(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('book-and-pay', {
        body: {
          name: form.name, email: form.email, phone: form.phone || null,
          checkIn: form.checkIn, checkOut: form.checkOut,
          guests: Number(form.guests), message: form.message || null,
          apartment: form.apartment,
        },
      });

      if (fnError || !data?.ok) {
        setError(data?.error || "Sorry — we couldn't process that. Please try again, or send us a question instead.");
        setBooking(false);
        return;
      }

      if (data.mode === 'paid') {
        window.location.href = data.authorization_url;
        return; // leaving the page — no need to reset loading state
      }

      // mode === 'enquiry': dates weren't actually available, filed as
      // an enquiry instead.
      setSent(true);
      resetForm();
    } catch {
      setError(`Sorry — we couldn't process that. Please try again, or email ${CONTACT_EMAIL} directly.`);
    } finally {
      setBooking(false);
    }
  };

  // The question-only path — unchanged from before: a plain enquiry,
  // no payment involved, admin follows up personally.
  const sendEnquiry = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setSendingEnquiry(true);
    try {
      const { error: dbError } = await supabase.from('enquiries').insert({
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        check_in: form.checkIn,
        check_out: form.checkOut,
        guests: Number(form.guests),
        message: form.message || null,
        apartment: form.apartment,
      });

      if (dbError?.message?.includes('DUPLICATE_OPEN_ENQUIRY')) {
        setError(`You already have an enquiry with us that we're still working on — we'll be in touch soon! Email ${CONTACT_EMAIL} if it's urgent.`);
        setSendingEnquiry(false);
        return;
      }
      if (dbError) throw dbError;

      setSent(true);
      resetForm();
    } catch {
      setError(`Sorry — we couldn't send that. Please try again, or email ${CONTACT_EMAIL} directly.`);
    } finally {
      setSendingEnquiry(false);
    }
  };

  return (
    <>
      <section className="page-header page-header-v2">
        <div className="container">
          <span className="eyebrow">BOOK</span>
          <h1>Plan your stay.</h1>
          <p className="lead">
            Pick your dates — if they're free, you can pay and lock them in right now.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 20 }}>
        <div className="container">
          <div className="book-grid">
            {/* Form */}
            <form className="book-form" noValidate>
              {error && (
                <div className="form-error" role="alert">
                  <AlertCircle size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                  {error}
                </div>
              )}

              <div className="field">
                <label>Which apartment?</label>
                <select
                  value={form.apartment}
                  onChange={(e) => {
                    setAvailabilityNotice(false);
                    setForm((f) => ({ ...f, apartment: e.target.value }));
                  }}
                  onBlur={checkAvailability}
                  disabled={loading}
                >
                  {APARTMENT_LIST.map((a) => (
                    <option key={a.value} value={a.value}>{a.name}</option>
                  ))}
                </select>
                <p className="field-note" style={{ marginTop: 6 }}>
                  Two separate apartments in the same building — book either one, or send a separate enquiry for both.
                </p>
              </div>

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
                <p className="field-note field-note-warn">
                  Heads up — those dates look taken. "Book & pay now" will likely fall back to an enquiry instead, or try different dates.
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
                <label>Anything we should know? (optional)</label>
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={update('message')}
                  placeholder="Visit purpose, arrival time, special requests…"
                  disabled={loading}
                />
              </div>

              {nights > 0 && (
                <div className="book-price-estimate">
                  <span>{nights} night{nights === 1 ? '' : 's'} × GHS {NIGHTLY_RATE_GHS}</span>
                  <strong>GHS {total.toLocaleString()}</strong>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-lg btn-block"
                disabled={loading}
                onClick={bookAndPay}
              >
                {booking ? (
                  <><Loader2 size={16} className="spin" style={{ marginRight: 6, verticalAlign: -3 }} /> Checking availability…</>
                ) : (
                  <><CreditCard size={16} style={{ marginRight: 6, verticalAlign: -3 }} /> Book & pay now{nights > 0 ? ` — GHS ${total.toLocaleString()}` : ''}</>
                )}
              </button>
              <button
                type="button"
                className="btn btn-outline btn-block"
                style={{ marginTop: 10 }}
                disabled={loading}
                onClick={sendEnquiry}
              >
                {sendingEnquiry ? 'Sending…' : 'Not ready to book? Send a question instead'}
              </button>
              <p className="fine-print">
                Paying now locks in your dates immediately via Paystack (card or Mobile Money). We don't share your details.
              </p>
            </form>

            {/* Sidebar */}
            <aside className="book-side">
              <div className="side-card">
                <img
                  src="/images/hero-property.jpg"
                  alt={APARTMENTS[form.apartment].name}
                />
                <div className="side-body">
                  <h3>{APARTMENTS[form.apartment].name}</h3>
                  <p className="text-muted small">LivingSpring Gardens · Sunyani, Ghana</p>
                  <div className="side-divider" />

                  <ul className="side-list">
                    <li>
                      <strong>Sleeps up to {APARTMENTS[form.apartment].guests}</strong>
                      <span>{APARTMENTS[form.apartment].bedrooms} bedrooms · {APARTMENTS[form.apartment].beds} beds · {APARTMENTS[form.apartment].baths} baths</span>
                    </li>
                    <li><strong>Fully self-contained</strong><span>Kitchen &amp; private verandah</span></li>
                    <li><strong>Central Sunyani</strong><span>Minutes from market &amp; cafés</span></li>
                  </ul>

                  <div className="side-divider" />
                  <h4>Rates</h4>
                  <ul className="side-list">
                    <li><strong>GHS {NIGHTLY_RATE_GHS} / night</strong><span>Base rate per apartment</span></li>
                    <li><strong>GHS {MULTI_NIGHT_DISCOUNT_GHS} off</strong><span>When booked for 5+ nights</span></li>
                    <li><strong>{LONG_STAY_DISCOUNT_PCT * 100}% off</strong><span>When booked for 28–30 nights</span></li>
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

      {/* Success modal (question-only path, or a book-and-pay fallback) */}
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
