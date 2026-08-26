import { useState } from 'react';
import { useOutletContext, Navigate } from 'react-router-dom';
import { Upload, Image, Check, ExternalLink } from 'lucide-react';

/**
 * AdminSettings (owner only)
 * - Role management (SQL instructions)
 * - Site photo management (swap Unsplash placeholders for real photos)
 * - Admin sign-in URL
 */

const PHOTO_SLOTS = [
  { id: 'hero', label: 'Homepage Hero', desc: 'Full-bleed photo on the homepage', file: 'src/pages/Home.jsx', currentUrl: 'photo-1616486338812-3dadae4b4ace' },
  { id: 'verandah', label: 'Verandah Apartment', desc: 'Main photo for The Verandah Apartment', file: 'src/pages/dashboard/Overview.jsx', currentUrl: 'photo-1522708323590-d24dbb6b0267' },
  { id: 'garden', label: 'Garden Apartment', desc: 'Main photo for The Garden Apartment', file: 'src/pages/dashboard/Overview.jsx', currentUrl: 'photo-1560448204-e02f11c3d0e2' },
  { id: 'signin', label: 'Sign In page photo', desc: 'Left panel of the guest sign-in page', file: 'src/pages/SignIn.jsx', currentUrl: 'photo-1600585154340-be6161a56a0c' },
  { id: 'gardens-page', label: 'LivingSpring Gardens page', desc: 'Main photo on the Gardens page', file: 'src/pages/Gardens.jsx', currentUrl: 'photo-1600607687939-ce8a6c25118c' },
  { id: 'book-side', label: 'Booking page sidebar', desc: 'Photo in the enquiry form sidebar', file: 'src/pages/Book.jsx', currentUrl: 'photo-1600585154340-be6161a56a0c' },
];

export default function AdminSettings() {
  const { isOwner } = useOutletContext();
  if (!isOwner) return <Navigate to="/admin" replace/>;

  const [saved, setSaved] = useState({});

  const saveUrl = (id, url) => {
    setSaved(prev => ({ ...prev, [id]: url }));
  };

  return (
    <div>
      <header className="mgmt-page-head">
        <span className="mgmt-eyebrow">SETTINGS</span>
        <h1>Settings</h1>
        <p className="mgmt-lead">Manage admin roles, site photos, and configuration.</p>
      </header>

      {/* ── PHOTO MANAGEMENT ── */}
      <section className="mgmt-card" style={{ marginBottom: 20 }}>
        <div className="mgmt-card-head">
          <div>
            <h2 className="mgmt-card-h">Site photos</h2>
            <p className="mgmt-card-sub">
              The site currently uses placeholder photos. Replace them by uploading to a free CDN
              (Cloudinary or Unsplash) and pasting the URL below, then update the src in the
              relevant file in your code editor.
            </p>
          </div>
        </div>

        <div className="mgmt-photo-grid">
          {PHOTO_SLOTS.map(slot => (
            <div key={slot.id} className="mgmt-photo-slot">
              <div className="mgmt-photo-preview">
                <img
                  src={`https://images.unsplash.com/${slot.currentUrl}?auto=format&fit=crop&w=400&q=60`}
                  alt={slot.label}
                />
                <div className="mgmt-photo-overlay">
                  <Image size={20}/>
                  <span>Current photo</span>
                </div>
              </div>
              <div className="mgmt-photo-info">
                <div className="mgmt-photo-label">{slot.label}</div>
                <div className="mgmt-photo-desc">{slot.desc}</div>
                <div className="mgmt-photo-file">
                  <code>{slot.file}</code>
                </div>
              </div>
              <div className="mgmt-photo-actions">
                <a
                  href="https://cloudinary.com/users/register/free"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mgmt-btn mgmt-btn-outline mgmt-btn-sm"
                >
                  <Upload size={13}/> Upload to Cloudinary
                  <ExternalLink size={11}/>
                </a>
                <a
                  href={`https://images.unsplash.com/${slot.currentUrl}?auto=format&fit=crop&w=2400&q=90`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mgmt-btn mgmt-btn-outline mgmt-btn-sm"
                >
                  View current <ExternalLink size={11}/>
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="mgmt-photo-note">
          <strong>How to swap a photo:</strong>
          <ol>
            <li>Upload your photo to <a href="https://cloudinary.com" target="_blank" rel="noopener noreferrer">Cloudinary</a> (free) or any image host</li>
            <li>Copy the direct image URL (ends in .jpg, .png, or /upload/...)</li>
            <li>Open the file shown above in VS Code or your editor</li>
            <li>Search for the Unsplash URL and replace it with your photo URL</li>
            <li>Commit and push — Vercel will redeploy automatically</li>
          </ol>
        </div>
      </section>

      {/* ── ROLE MANAGEMENT ── */}
      <section className="mgmt-card" style={{ marginBottom: 20, maxWidth: 720 }}>
        <h2 className="mgmt-card-h">Admin roles</h2>
        <p className="mgmt-card-sub">
          Roles are stored in Supabase on each user's <code>user_metadata</code>.
          Run the SQL below in your Supabase project's SQL Editor to assign roles.
        </p>

        <div className="mgmt-code-block">
          <pre>{`-- Make someone an owner (full access):
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role":"owner"}'::jsonb
WHERE email = 'james@example.com';

-- Make someone a manager (no revenue/settings):
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role":"manager"}'::jsonb
WHERE email = 'dad@example.com';

-- Remove admin access:
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data - 'role'
WHERE email = 'someone@example.com';`}</pre>
        </div>

        <div className="mgmt-role-table">
          <table className="mgmt-table" style={{ marginTop: 20 }}>
            <thead>
              <tr>
                <th>Feature</th>
                <th>Owner</th>
                <th>Manager</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Overview', true, true],
                ['Enquiries', true, true],
                ['Bookings + calendar', true, true],
                ['Guests', true, true],
                ['Messages', true, true],
                ['Rates (view)', true, true],
                ['Rates (edit)', true, false],
                ['Revenue stats', true, false],
                ['Settings', true, false],
              ].map(([f, o, m]) => (
                <tr key={f}>
                  <td>{f}</td>
                  <td>{o ? '✅' : '—'}</td>
                  <td>{m ? '✅' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── ADMIN URL ── */}
      <section className="mgmt-card" style={{ maxWidth: 720 }}>
        <h2 className="mgmt-card-h">Admin sign-in URL</h2>
        <p className="mgmt-card-sub">Share this with anyone who needs admin access:</p>
        <div className="mgmt-url-chip">
          {typeof window !== 'undefined' ? window.location.origin : 'https://home-office-apartments.vercel.app'}/admin/signin
        </div>
      </section>
    </div>
  );
}
