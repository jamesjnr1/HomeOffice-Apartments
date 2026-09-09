import { useOutletContext, Navigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';

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
        <p className="mgmt-lead">Update site photos and manage admin access.</p>
      </header>

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
        </p>

        <div className="mgmt-code-block" style={{ marginBottom: 16 }}>
          <pre>{`-- Owner (full access including revenue + settings):
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role":"owner"}'::jsonb
WHERE email = 'james@example.com';

-- Manager (no revenue or settings):
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role":"manager"}'::jsonb
WHERE email = 'dad@example.com';`}</pre>
        </div>

        <p className="mgmt-card-sub" style={{ margin: 0 }}>
          Admin sign-in URL: <code style={{ background: '#f4f5f3', padding: '2px 8px', borderRadius: 5, fontSize: 13, color: '#2d6a4f' }}>
            {typeof window !== 'undefined' ? window.location.origin : 'https://home-office-apartments.vercel.app'}/admin/signin
          </code>
        </p>
      </section>
    </div>
  );
}
