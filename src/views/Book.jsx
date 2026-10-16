'use client';

import { useState, useMemo } from 'react';
import { Mail, Phone, MessageCircle, Check, AlertCircle, CreditCard, Loader2 } from 'lucide-react';
import BookingSteps from '../components/BookingSteps';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { APARTMENT_LIST, APARTMENTS, DEFAULT_APARTMENT } from '../lib/apartments';
import { container, Eyebrow, btn } from '../components/ui';
import { NIGHTLY_RATE_GHS, MULTI_NIGHT_DISCOUNT_GHS, LONG_STAY_DISCOUNT_PCT, nightsBetween, calculateTotal, priceBreakdown } from '../lib/pricing';

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

  const label = 'mb-2 block text-[12px] font-medium uppercase tracking-[0.16em] text-ink-soft';
  const input =
    'w-full rounded-xl border border-stone bg-white/80 px-4 py-3 text-[15.5px] text-ink outline-none transition placeholder:text-muted/70 focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/10 disabled:opacity-60';
  const apt = APARTMENTS[form.apartment];
  const breakdown = priceBreakdown(nights);
  const datesDone = nights > 0;
  const detailsDone = datesDone && form.name.trim() && form.email.trim();
  const currentStep = booking ? 3 : detailsDone ? 2 : datesDone ? 1 : 0;

  return (
    <>
      <section className="pb-14 pt-40 sm:pt-48">
        <div className={container}>
          <div className="max-w-3xl">
            <Eyebrow>Book</Eyebrow>
            <h1 className="mt-6 font-display text-[44px] font-light leading-[1.04] tracking-[-0.02em] text-ink sm:text-[64px]">
              Plan your stay.
            </h1>
            <p className="mt-6 max-w-xl text-[17.5px] leading-relaxed text-ink-soft">
              Pick your dates — if they&apos;re free, you can pay and lock them in right now.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-28">
        <div className={`${container} mb-10`}>
          <BookingSteps current={currentStep} />
        </div>
        <div className={`${container} grid items-start gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:gap-14`}>
          {/* Form */}
          <form className="rounded-[28px] bg-paper p-6 shadow-[0_1px_0_rgba(27,36,32,0.06),0_30px_60px_-40px_rgba(27,36,32,0.25)] sm:p-10" noValidate>
            {error && (
              <div className="form-error flex items-start gap-2" role="alert">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mb-6">
              <label className={label}>Which apartment?</label>
              <select
                className={input}
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
              <p className="field-note">
                Two separate apartments in the same building — book either one, or send a separate enquiry for both.
              </p>
            </div>

            <div className="mb-6">
              <label className={label}>Your full name</label>
              <input
                className={input}
                type="text"
                value={form.name}
                onChange={update('name')}
                placeholder="Jane Adjei"
                required
                disabled={loading}
              />
            </div>

            <div className="mb-6 grid gap-6 sm:grid-cols-2">
              <div>
                <label className={label}>Email</label>
                <input
                  className={input}
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
                    You already have an enquiry with us we&apos;re still working on — no need to send another, we&apos;ll be in touch soon.
                  </p>
                )}
              </div>
              <div>
                <label className={label}>Phone / WhatsApp</label>
                <input
                  className={input}
                  type="tel"
                  value={form.phone}
                  onChange={update('phone')}
                  placeholder="+233 …"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className={label}>Check-in</label>
                <input
                  className={input}
                  type="date"
                  value={form.checkIn}
                  onChange={(e) => { setAvailabilityNotice(false); update('checkIn')(e); }}
                  onBlur={checkAvailability}
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className={label}>Check-out</label>
                <input
                  className={input}
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
                Heads up — those dates look taken. &quot;Book &amp; pay now&quot; will likely fall back to an enquiry instead, or try different dates.
              </p>
            )}

            <div className="mt-6">
              <label className={label}>Guests</label>
              <select className={input} value={form.guests} onChange={update('guests')} disabled={loading}>
                <option value="1">1 guest</option>
                <option value="2">2 guests</option>
                <option value="3">3 guests</option>
                <option value="4">4 guests</option>
              </select>
            </div>

            <div className="mt-6">
              <label className={label}>Anything we should know? (optional)</label>
              <textarea
                className={`${input} resize-y`}
                rows={4}
                value={form.message}
                onChange={update('message')}
                placeholder="Visit purpose, arrival time, special requests…"
                disabled={loading}
              />
            </div>

            {breakdown && (
              <div className="mt-8 rounded-2xl bg-accent-soft px-5 py-4 text-[14.5px] text-forest">
                <div className="flex items-center justify-between">
                  <span>{breakdown.nights} night{breakdown.nights === 1 ? '' : 's'} × GHS {breakdown.rate.toLocaleString()}</span>
                  <span>GHS {breakdown.subtotal.toLocaleString()}</span>
                </div>
                {breakdown.discount > 0 && (
                  <div className="mt-1.5 flex items-center justify-between">
                    <span>{breakdown.discountLabel}</span>
                    <span>− GHS {breakdown.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="mt-3 flex items-center justify-between border-t border-forest/15 pt-3">
                  <span className="font-medium">Total to pay</span>
                  <strong className="font-display text-[22px] font-normal">GHS {total.toLocaleString()}</strong>
                </div>
              </div>
            )}

            <button
              type="submit"
              className={`${btn.primary} mt-8 w-full`}
              disabled={loading}
              onClick={bookAndPay}
            >
              {booking ? (
                <><Loader2 size={16} className="spin" /> Checking availability…</>
              ) : (
                <><CreditCard size={16} strokeWidth={1.75} /> Book &amp; pay now{nights > 0 ? ` — GHS ${total.toLocaleString()}` : ''}</>
              )}
            </button>
            <button
              type="button"
              className={`${btn.outline} mt-3 w-full`}
              disabled={loading}
              onClick={sendEnquiry}
            >
              {sendingEnquiry ? 'Sending…' : 'Not ready to book? Send a question instead'}
            </button>
            <p className="mt-5 text-center text-[12.5px] leading-relaxed text-muted">
              Paying now locks in your dates immediately via Paystack (card or Mobile Money). We don&apos;t share your details.
            </p>
          </form>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-28">
            <div className="overflow-hidden rounded-[28px] bg-paper shadow-[0_1px_0_rgba(27,36,32,0.06)]">
              <img src="/images/hero-property.jpg" alt={apt.name} className="aspect-[16/10] w-full object-cover" />
              <div className="p-7 sm:p-8">
                <h3 className="font-display text-[24px] font-light leading-tight text-ink">{apt.name}</h3>
                <p className="mt-1.5 text-[13.5px] text-muted">LivingSpring Gardens · Sunyani, Ghana</p>

                <SideList>
                  <SideItem title={`Sleeps up to ${apt.guests}`} text={`${apt.bedrooms} bedrooms · ${apt.beds} beds · ${apt.baths} baths`} />
                  <SideItem title="Fully self-contained" text="Kitchen & private verandah" />
                  <SideItem title="Central Sunyani" text="Minutes from market & cafés" />
                </SideList>

                <h4 className="mt-7 text-[11.5px] font-medium uppercase tracking-[0.2em] text-muted">Rates</h4>
                <SideList>
                  <SideItem title={`GHS ${NIGHTLY_RATE_GHS} / night`} text="Base rate per apartment" />
                  <SideItem title={`GHS ${MULTI_NIGHT_DISCOUNT_GHS} off`} text="When booked for 5+ nights" />
                  <SideItem title={`${LONG_STAY_DISCOUNT_PCT * 100}% off`} text="When booked for 28–30 nights" />
                </SideList>

                <h4 className="mt-7 text-[11.5px] font-medium uppercase tracking-[0.2em] text-muted">Prefer to chat?</h4>
                <div className="mt-3 flex flex-col">
                  <a className="flex items-center gap-2.5 py-1.5 text-[14.5px] text-ink hover:text-accent" href={`mailto:${CONTACT_EMAIL}`}>
                    <Mail size={14} strokeWidth={1.75} /> {CONTACT_EMAIL}
                  </a>
                  <a className="flex items-center gap-2.5 py-1.5 text-[14.5px] text-ink hover:text-accent" href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`}>
                    <Phone size={14} strokeWidth={1.75} /> {CONTACT_PHONE}
                  </a>
                  <a
                    className="flex items-center gap-2.5 py-1.5 text-[14.5px] text-ink hover:text-accent"
                    href={`https://wa.me/${WHATSAPP_NUMBER}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle size={14} strokeWidth={1.75} /> WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Success modal (question-only path, or a book-and-pay fallback) */}
      {sent && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-forest-deep/50 p-5 backdrop-blur-sm" onClick={() => setSent(false)}>
          <div className="w-full max-w-md rounded-[28px] bg-paper p-10 text-center shadow-[0_40px_80px_-20px_rgba(0,0,0,0.35)]" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Check size={30} strokeWidth={1.75} />
            </div>
            <h2 className="mt-6 font-display text-[32px] font-light text-ink">Enquiry sent.</h2>
            <p className="mt-3 text-[15.5px] leading-relaxed text-ink-soft">Thanks — we&apos;ll be in touch shortly to confirm availability and share rates.</p>
            <button className={`${btn.outline} mt-8`} onClick={() => setSent(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}

function SideList({ children }) {
  return <ul className="mt-5 divide-y divide-stone border-y border-stone">{children}</ul>;
}

function SideItem({ title, text }) {
  return (
    <li className="flex flex-col py-3">
      <strong className="text-[14.5px] font-medium text-ink">{title}</strong>
      <span className="text-[13.5px] text-muted">{text}</span>
    </li>
  );
}
