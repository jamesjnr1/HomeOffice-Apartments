import { useState } from 'react';
import { Mail, Phone, MessageCircle, Check } from 'lucide-react';

export default function Book() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', checkIn: '', checkOut: '',
    guests: '2', apartment: 'either', message: '',
  });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.checkIn || !form.checkOut) {
      setError('Please fill in your name, email, and dates.');
      return;
    }
    if (new Date(form.checkOut) <= new Date(form.checkIn)) {
      setError('Check-out must be after check-in.');
      return;
    }
    // TODO: wire this up to Formspree / EmailJS / Supabase Edge Function later.
    console.log('Enquiry:', form);
    setSent(true);
  };

  return (
    <>
      <section className="page-header">
        <div className="container">
          <p className="eyebrow">ENQUIRE</p>
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
              {error && <div className="form-error">{error}</div>}

              <div className="field">
                <label>Your full name</label>
                <input type="text" value={form.name} onChange={update('name')} placeholder="Jane Adjei" required />
              </div>

              <div className="field-row">
                <div className="field">
                  <label>Email</label>
                  <input type="email" value={form.email} onChange={update('email')} placeholder="jane@example.com" required />
                </div>
                <div className="field">
                  <label>Phone / WhatsApp</label>
                  <input type="tel" value={form.phone} onChange={update('phone')} placeholder="+233 …" />
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label>Check-in</label>
                  <input type="date" value={form.checkIn} onChange={update('checkIn')} required />
                </div>
                <div className="field">
                  <label>Check-out</label>
                  <input type="date" value={form.checkOut} onChange={update('checkOut')} required />
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label>Guests</label>
                  <select value={form.guests} onChange={update('guests')}>
                    <option value="1">1 guest</option>
                    <option value="2">2 guests</option>
                    <option value="3">3 guests</option>
                    <option value="4">4 guests</option>
                    <option value="5">5+ guests</option>
                  </select>
                </div>
                <div className="field">
                  <label>Which apartment?</label>
                  <select value={form.apartment} onChange={update('apartment')}>
                    <option value="either">Either / no preference</option>
                    <option value="a">Apartment A</option>
                    <option value="b">Apartment B</option>
                    <option value="both">Both (for a group)</option>
                  </select>
                </div>
              </div>

              <div className="field">
                <label>Anything we should know?</label>
                <textarea rows={4} value={form.message} onChange={update('message')} placeholder="Visit purpose, arrival time, special requests…" />
              </div>

              <button type="submit" className="btn btn-primary btn-lg btn-block">
                Send enquiry
              </button>
              <p className="fine-print">
                By sending this enquiry, you'll receive a reply at the email above. We don't share your details.
              </p>
            </form>

            {/* Sidebar */}
            <aside className="book-side">
              <div className="side-card">
                <img
                  src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"
                  alt="Home-Office Apartments"
                />
                <div className="side-body">
                  <h3>Home-Office Apartments</h3>
                  <p className="text-muted small">Living Spring Gardens · Sunyani, Ghana</p>
                  <div className="side-divider" />

                  <ul className="side-list">
                    <li><strong>Two apartments</strong><span>Each fully self-contained</span></li>
                    <li><strong>Sleeps up to 4</strong><span>Per apartment</span></li>
                    <li><strong>Central Sunyani</strong><span>Minutes from market &amp; cafés</span></li>
                    <li><strong>Long stays welcome</strong><span>Weekly &amp; monthly rates on request</span></li>
                  </ul>

                  <div className="side-divider" />
                  <h4>Prefer to chat?</h4>
                  <a className="contact-line" href="mailto:hello@homeoffice.gh">
                    <Mail size={14} /> hello@homeoffice.gh
                  </a>
                  <a className="contact-line" href="tel:+233000000000">
                    <Phone size={14} /> +233 00 000 0000
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
