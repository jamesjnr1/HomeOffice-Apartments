import { useOutletContext, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ExternalLink, Save, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// All four slots below currently point at the same real property photo
// (public/images/hero-property.jpg) — there's no per-slot image yet,
// unlike the earlier Unsplash-placeholder version of this page.
const PHOTO_SLOTS = [
  {
    id: 'hero',
    label: 'Homepage Hero',
    desc: 'Full-bleed photo on the homepage',
    file: 'src/pages/Home.jsx',
    image: '/images/hero-property.jpg',
  },
  {
    id: 'apartment',
    label: 'Apartment photo',
    desc: 'Main photo for Home-Office Apartments on the guest dashboard',
    file: 'src/pages/dashboard/Overview.jsx',
    image: '/images/hero-property.jpg',
  },
  {
    id: 'signin',
    label: 'Sign In page photo',
    desc: 'Left panel of the guest sign-in page',
    file: 'src/styles/globals.css (.auth-photo)',
    image: '/images/hero-property.jpg',
  },
  {
    id: 'book-side',
    label: 'Booking page sidebar',
    desc: 'Photo in the enquiry form sidebar',
    file: 'src/pages/Book.jsx',
    image: '/images/hero-property.jpg',
  },
];

export default function AdminSettings() {
  const { isOwner } = useOutletContext();
  if (!isOwner) return <Navigate to="/admin" replace />;

  return (
    <div className="mgmt-page">
      <header className="mgmt-page-head">
        <span className="mgmt-eyebrow">SETTINGS</span>
        <h1>Settings</h1>
        <p className="mgmt-lead">Update check-in details, site photos, and manage admin access.</p>
      </header>

      <CheckInDetailsCard />

      {/* ── PHOTO MANAGEMENT ── */}
      <section className="mgmt-card" style={{ marginBottom: 24 }}>
        <h2 className="mgmt-card-h">Site photos</h2>
        <p className="mgmt-card-sub">
          These are real photos of the property, served from <code>public/images/</code> in the
          site's code — no Unsplash or Cloudinary involved. All four spots below currently show
          the same photo (<code>hero-property.jpg</code>); swap any one in by replacing the file.
        </p>

        <div className="mgmt-photo-grid">
          {PHOTO_SLOTS.map(slot => (
            <div key={slot.id} className="mgmt-photo-slot">
              <div className="mgmt-photo-preview">
                <img src={slot.image} alt={slot.label} />
              </div>
              <div className="mgmt-photo-info">
                <div className="mgmt-photo-label">{slot.label}</div>
                <div className="mgmt-photo-desc">{slot.desc}</div>
                <div className="mgmt-photo-file"><code>{slot.file}</code></div>
              </div>
              <div className="mgmt-photo-actions">
                <a
                  href={slot.image}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mgmt-btn mgmt-btn-outline mgmt-btn-sm"
                >
                  View full size <ExternalLink size={11} />
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="mgmt-photo-note">
          <strong>How to swap a photo in 2 steps</strong>
          <ol>
            <li>Replace the file in <code>public/images/</code> with your new photo, keeping the exact same filename (e.g. <code>hero-property.jpg</code>) — or give it a new filename and update the reference in the file shown under that photo</li>
            <li>Save → <code>git add . && git commit -m "Update photos" && git push</code> — Vercel deploys automatically in ~30 seconds</li>
          </ol>
        </div>
      </section>

      {/* ── ADMIN ACCESS ── */}
      <section className="mgmt-card" style={{ maxWidth: 680 }}>
        <h2 className="mgmt-card-h">Admin access</h2>
        <p className="mgmt-card-sub">
          To give someone admin access, run this SQL in your{' '}
          <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" style={{ color: '#2d6a4f', fontWeight: 500 }}>
            Supabase SQL Editor <ExternalLink size={11} style={{ verticalAlign: 'middle' }} />
          </a>
          . Uses <code>app_metadata</code>, not <code>user_metadata</code> — that's deliberate,
          it's the only place a role can live that a signed-in user can't edit themselves.
        </p>

        <div className="mgmt-code-block" style={{ marginBottom: 16 }}>
          <pre>{`-- Owner (full access including revenue + settings):
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role":"owner"}'::jsonb
WHERE email = 'james@example.com';

-- Manager (no revenue or settings):
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role":"manager"}'::jsonb
WHERE email = 'dad@example.com';`}</pre>
        </div>

        <p className="mgmt-card-sub" style={{ margin: '0 0 16px' }}>
          The account you just granted needs to sign out and back in before the new role takes
          effect — it's read from their session token, which only refreshes on sign-in.
        </p>

        <p className="mgmt-card-sub" style={{ margin: 0 }}>
          Admin sign-in URL: <code style={{ background: '#f4f5f3', padding: '2px 8px', borderRadius: 5, fontSize: 13, color: '#2d6a4f' }}>
            {typeof window !== 'undefined' ? window.location.origin : 'https://home-office-apartments.vercel.app'}/admin/signin
          </code>
        </p>
      </section>
    </div>
  );
}

/**
 * CheckInDetailsCard — the admin side of Phase 3. Loads/updates the
 * single property_details row (see supabase/migrations/20260909160000_
 * create_property_details.sql). A guest with a confirmed or completed
 * booking reads this same row from their dashboard (Overview.jsx).
 */
function CheckInDetailsCard() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const emptyForm = {
    wifi_network: '', wifi_password: '',
    check_in_time: 'After 2:00 PM', check_out_time: 'Before 11:00 AM',
    access_instructions: '', house_rules: '', host_notes: '',
  };

  useEffect(() => {
    supabase
      .from('property_details')
      .select('*')
      .eq('id', 'home-office')
      .maybeSingle()
      .then(({ data }) => setForm(data || emptyForm))
      // A network-level failure (not just a Supabase error payload)
      // would otherwise leave this stuck on "Loading…" forever.
      .catch(() => { setForm(emptyForm); setError("Couldn't load current details — showing a blank form."); })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const { error: err } = await supabase
      .from('property_details')
      .update({
        wifi_network: form.wifi_network,
        wifi_password: form.wifi_password,
        check_in_time: form.check_in_time,
        check_out_time: form.check_out_time,
        access_instructions: form.access_instructions,
        house_rules: form.house_rules,
        host_notes: form.host_notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 'home-office');

    setSaving(false);
    if (err) setError("Couldn't save — please try again.");
    else { setSaved(true); setTimeout(() => setSaved(false), 2500); }
  };

  if (loading || !form) {
    return (
      <section className="mgmt-card" style={{ marginBottom: 24 }}>
        <h2 className="mgmt-card-h">Check-in details</h2>
        <p className="mgmt-card-sub">Loading…</p>
      </section>
    );
  }

  return (
    <section className="mgmt-card" style={{ marginBottom: 24 }}>
      <h2 className="mgmt-card-h">Check-in details</h2>
      <p className="mgmt-card-sub">
        Shown to a guest on their dashboard once they have a confirmed booking — WiFi, how to get
        in, and house rules, so they're not messaging you to ask.
      </p>

      <form onSubmit={save} className="mgmt-checkin-form">
        {error && <div className="form-error">{error}</div>}

        <div className="mgmt-rates-grid">
          <label className="mgmt-rate-field">
            <span>WiFi network name</span>
            <input type="text" value={form.wifi_network} onChange={update('wifi_network')} placeholder="e.g. HomeOffice-Guest" />
          </label>
          <label className="mgmt-rate-field">
            <span>WiFi password</span>
            <input type="text" value={form.wifi_password} onChange={update('wifi_password')} placeholder="e.g. quietstay2026" />
          </label>
          <label className="mgmt-rate-field">
            <span>Check-in time</span>
            <input type="text" value={form.check_in_time} onChange={update('check_in_time')} placeholder="e.g. After 2:00 PM" />
          </label>
          <label className="mgmt-rate-field">
            <span>Check-out time</span>
            <input type="text" value={form.check_out_time} onChange={update('check_out_time')} placeholder="e.g. Before 11:00 AM" />
          </label>
        </div>

        <label className="mgmt-checkin-textarea">
          <span>How to get in</span>
          <textarea
            rows={3}
            value={form.access_instructions}
            onChange={update('access_instructions')}
            placeholder="e.g. Gate code is 4471. The caretaker, Kwame, will be there to let you into the apartment and show you around."
          />
        </label>

        <label className="mgmt-checkin-textarea">
          <span>House rules</span>
          <textarea
            rows={3}
            value={form.house_rules}
            onChange={update('house_rules')}
            placeholder="e.g. No smoking indoors. Quiet hours after 10 PM. No parties or events."
          />
        </label>

        <label className="mgmt-checkin-textarea">
          <span>Anything else guests should know (optional)</span>
          <textarea
            rows={2}
            value={form.host_notes}
            onChange={update('host_notes')}
            placeholder="e.g. The nearest supermarket is a 5-minute walk, on the left after the junction."
          />
        </label>

        <div className="mgmt-save-row">
          {saved && <span className="mgmt-save-note"><Check size={14}/> Saved</span>}
          <button type="submit" className="mgmt-btn mgmt-btn-primary" disabled={saving}>
            <Save size={15}/> {saving ? 'Saving…' : 'Save check-in details'}
          </button>
        </div>
      </form>
    </section>
  );
}
