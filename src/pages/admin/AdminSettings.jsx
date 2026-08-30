import { useOutletContext, Navigate } from 'react-router-dom';
import { ExternalLink, Upload } from 'lucide-react';

const PHOTO_SLOTS = [
  {
    id: 'hero',
    label: 'Homepage Hero',
    desc: 'Full-bleed photo on the homepage',
    file: 'src/pages/Home.jsx',
    url: 'photo-1616486338812-3dadae4b4ace',
  },
  {
    id: 'apartment',
    label: 'Apartment photo',
    desc: 'Main photo for Home-Office Apartments on the guest dashboard',
    file: 'src/pages/dashboard/Overview.jsx',
    url: 'photo-1522708323590-d24dbb6b0267',
  },
  {
    id: 'signin',
    label: 'Sign In page photo',
    desc: 'Left panel of the guest sign-in page',
    file: 'src/pages/SignIn.jsx',
    url: 'photo-1600585154340-be6161a56a0c',
  },
  {
    id: 'book-side',
    label: 'Booking page sidebar',
    desc: 'Photo in the enquiry form sidebar',
    file: 'src/pages/Book.jsx',
    url: 'photo-1600585154340-be6161a56a0c',
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
          The site uses placeholder photos from Unsplash. To use real photos of the property,
          upload them to <a href="https://cloudinary.com/users/register/free" target="_blank" rel="noopener noreferrer" style={{ color: '#2d6a4f', fontWeight: 500 }}>Cloudinary</a> (free),
          copy the URL, then replace the src in the file listed under each photo.
        </p>

        <div className="mgmt-photo-grid">
          {PHOTO_SLOTS.map(slot => (
            <div key={slot.id} className="mgmt-photo-slot">
              <div className="mgmt-photo-preview">
                <img
                  src={`https://images.unsplash.com/${slot.url}?auto=format&fit=crop&w=400&q=60`}
                  alt={slot.label}
                />
              </div>
              <div className="mgmt-photo-info">
                <div className="mgmt-photo-label">{slot.label}</div>
                <div className="mgmt-photo-desc">{slot.desc}</div>
                <div className="mgmt-photo-file"><code>{slot.file}</code></div>
              </div>
              <div className="mgmt-photo-actions">
                <a
                  href="https://cloudinary.com/users/register/free"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mgmt-btn mgmt-btn-primary mgmt-btn-sm"
                >
                  <Upload size={12} /> Upload photo
                </a>
                <a
                  href={`https://images.unsplash.com/${slot.url}?auto=format&fit=crop&w=2400&q=90`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mgmt-btn mgmt-btn-outline mgmt-btn-sm"
                >
                  View current <ExternalLink size={11} />
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="mgmt-photo-note">
          <strong>How to swap a photo in 3 steps</strong>
          <ol>
            <li>Click "Upload photo" → sign up for Cloudinary free → upload your image → copy the URL it gives you</li>
            <li>Open the file shown (e.g. <code>src/pages/Home.jsx</code>) in VS Code, press ⌘F, search for the Unsplash URL and replace it with your Cloudinary URL</li>
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
