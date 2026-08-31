import { useState } from 'react';
import { Mail, Phone, MessageCircle, Check, AlertCircle } from 'lucide-react';

/**
 * Book — enquiry form that actually sends.
 *
 * POST to Formspree endpoint set in VITE_FORMSPREE_URL.
 * Set it in Vercel → Settings → Environment Variables:
 *   VITE_FORMSPREE_URL=https://formspree.io/f/xxxxxxxx
 *
 * Formspree emails every submission to your inbox for free.
 */

const FORMSPREE_URL = import.meta.env.VITE_FORMSPREE_URL;
const CONTACT_EMAIL = 'hello@homeoffice.gh'; // <-- update to real email later
const CONTACT_PHONE = '+233 00 000 0000';

export default function Book() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', checkIn: '', checkOut: '',
    guests: '2', message: '',
  });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

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

    if (!FORMSPREE_URL) {
      setError(
        `Enquiries aren't wired up yet. Please email ${CONTACT_EMAIL} directly and we'll get right back to you.`
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(FORMSPREE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || '(not provided)',
          checkIn: form.checkIn,
          checkOut: form.checkOut,
          guests: form.guests,
          message: form.message || '(no message)',
          _subject: `New enquiry from ${form.name} — ${form.checkIn} to ${form.checkOut}`,
          _replyto: form.email,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.errors?.[0]?.message || 'Failed to send enquiry');
      }

      setSent(true);
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
                    onChange={update('email')}
                    placeholder="jane@example.com"
                    required
                    disabled={loading}
                  />
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
                    onChange={update('checkIn')}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="field">
                  <label>Check-out</label>
                  <input
                    type="date"
                    value={form.checkOut}
                    onChange={update('checkOut')}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

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
                  <a className="contact-line" href="#">
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
