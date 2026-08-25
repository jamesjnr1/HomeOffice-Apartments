import { useOutletContext, Navigate } from 'react-router-dom';

export default function AdminSettings() {
  const { isOwner } = useOutletContext();
  if (!isOwner) return <Navigate to="/admin" replace/>;

  return (
    <div className="ad-page">
      <header className="ad-page-head">
        <span className="ad-eyebrow">SETTINGS</span>
        <h1>Settings</h1>
        <p className="ad-lead">Manage admin roles and site configuration.</p>
      </header>

      <div className="ad-card" style={{ maxWidth: 640 }}>
        <h2 className="ad-card-h">Admin roles</h2>
        <p className="ad-card-sub">
          Roles are set directly in Supabase on each user's <code>user_metadata</code>.
          Use the SQL below to assign a role — run it in your Supabase project's SQL editor.
        </p>

        <div className="ad-code-block">
          <pre>{`-- Make someone an owner:
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role":"owner"}'::jsonb
WHERE email = 'james@example.com';

-- Make someone a manager:
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role":"manager"}'::jsonb
WHERE email = 'dad@example.com';`}</pre>
        </div>

        <p className="ad-card-sub" style={{ marginTop: 16 }}>
          <strong>Owner</strong> — sees all sections including Revenue and Settings. Can edit rates.
          <br />
          <strong>Manager</strong> — sees Enquiries, Bookings, Guests, Messages, and Rates (read-only). No revenue or settings.
        </p>
      </div>

      <div className="ad-card" style={{ maxWidth: 640, marginTop: 20 }}>
        <h2 className="ad-card-h">Admin sign-in URL</h2>
        <p className="ad-card-sub">Share this link with anyone who needs admin access:</p>
        <div className="ad-url-chip">
          {window.location.origin}/admin/signin
        </div>
      </div>
    </div>
  );
}
