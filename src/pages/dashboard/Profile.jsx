import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Save,
  User,
  Mail,
  Phone,
  Camera,
  Lock,
  Check,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

/**
 * Profile — real account details, stored on public.profiles (see
 * supabase/migrations/20260923000000_guest_profile_avatar_and_phone.sql
 * for phone/avatar_url). Loaded from and saved straight to that table;
 * profiles_update_own RLS (auth.uid() = id) is what actually lets a
 * guest edit their own row here.
 *
 * Password IS wired up for real too (see PasswordSection below) —
 * this is where a guest who was auto-signed-up at booking time (see
 * supabase/functions/book-and-pay/index.ts's "welcome_account" email)
 * actually lands to set one, via a Supabase recovery link that signs
 * them in and redirects here.
 */

export default function Profile() {
  const { user, profile, refreshProfile } = useOutletContext();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setFullName(profile?.full_name || user?.user_metadata?.full_name || '');
    setPhone(profile?.phone || '');
  }, [profile, user]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() || null, phone: phone.trim() || null })
      .eq('id', user.id);
    setSaving(false);
    if (updateError) {
      setError("Couldn't save your changes. Please try again.");
      return;
    }
    refreshProfile();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || '';
  const initials = (displayName || user?.email || 'H').charAt(0).toUpperCase();

  return (
    <div className="dash-page">
      <header className="dash-page-head">
        <p className="dash-eyebrow">PROFILE</p>
        <h1>Your account</h1>
        <p className="dash-lead">Your details, and how to reach you.</p>
      </header>

      <form onSubmit={submit} className="dash-profile">
        <section className="dash-card">
          <div className="dash-profile-head">
            <AvatarUpload userId={user?.id} avatarUrl={profile?.avatar_url} initials={initials} onUploaded={refreshProfile} />
            <div>
              <h2>{displayName || 'Add your name'}</h2>
              <p className="dash-text-muted">{user?.email}</p>
            </div>
          </div>

          {error && (
            <div className="form-error" style={{ marginBottom: 16 }}>
              <AlertCircle size={14} style={{ verticalAlign: -2, marginRight: 6 }} />
              {error}
            </div>
          )}

          <div className="dash-form-grid">
            <Field label="Full name" icon={<User size={14} />}>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
              />
            </Field>
            <Field label="Email" icon={<Mail size={14} />}>
              <input type="email" value={user?.email || ''} disabled />
            </Field>
            <Field label="Phone / WhatsApp" icon={<Phone size={14} />}>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+233 …"
              />
            </Field>
          </div>

          <div className="dash-save-bar" style={{ marginTop: 20, position: 'static' }}>
            {saved && (
              <span className="dash-save-note">
                <Check size={14} /> Saved
              </span>
            )}
            <button type="submit" className="dash-btn dash-btn-primary" disabled={saving}>
              <Save size={16} /> {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </section>

        <section className="dash-card">
          <h2 className="dash-card-h">Security</h2>
          <PasswordSection />
        </section>
      </form>
    </div>
  );
}

function Field({ label, icon, children }) {
  return (
    <label className="dash-field">
      <span className="dash-field-label">
        {icon} {label}
      </span>
      {children}
    </label>
  );
}

// Uploads to the public "avatars" storage bucket at "{user.id}/avatar.
// <ext>" — the storage RLS policies (see the migration above) key off
// that first path segment, so a guest can only ever write inside their
// own folder. `upsert: true` means re-uploading just replaces the same
// file rather than accumulating old ones; the cache-busting query
// param on the saved URL is what makes a new photo show immediately
// instead of the browser serving its cached copy of the old one.
function AvatarUpload({ userId, avatarUrl, initials, onUploaded }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const pick = () => inputRef.current?.click();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB.');
      return;
    }

    setError('');
    setUploading(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, cacheControl: '3600' });

    if (uploadError) {
      setUploading(false);
      setError("Couldn't upload that photo. Please try again.");
      return;
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ avatar_url: `${urlData.publicUrl}?t=${Date.now()}` })
      .eq('id', userId);

    setUploading(false);
    if (profileError) {
      setError("Photo uploaded, but couldn't be saved. Please try again.");
      return;
    }
    onUploaded();
  };

  return (
    <div className="dash-avatar-upload">
      <div className="dash-avatar dash-avatar-lg">
        {avatarUrl ? <img src={avatarUrl} alt="" /> : initials}
        <button
          type="button"
          className="dash-avatar-edit"
          onClick={pick}
          disabled={uploading}
          title="Change photo"
        >
          <Camera size={13} />
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        style={{ display: 'none' }}
      />
      {error && <p className="form-error" style={{ position: 'absolute', marginTop: 68, fontSize: 12 }}>{error}</p>}
    </div>
  );
}

// The only other part of this page wired to Supabase for real — this
// is where an auto-created guest account (see book-and-pay's
// "welcome_account" email) actually gets a password set for the first
// time, via a recovery link that signs them in and lands them here —
// same call either way, whether that's a first-time password or a
// change to an existing one.
function PasswordSection() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
    setOpen(false);
    setPassword('');
    setConfirm('');
    setTimeout(() => setDone(false), 3000);
  };

  if (!open) {
    return (
      <>
        <button type="button" className="dash-btn dash-btn-outline dash-btn-sm" onClick={() => setOpen(true)}>
          <Lock size={14} /> {done ? 'Password updated' : 'Change password'}
        </button>
        {done && <p className="dash-text-muted" style={{ marginTop: 8 }}><Check size={13} style={{ verticalAlign: -2 }} /> Your password was updated.</p>}
      </>
    );
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      {error && (
        <div className="form-error" style={{ marginBottom: 12 }}>
          <AlertCircle size={14} style={{ verticalAlign: -2, marginRight: 6 }} />
          {error}
        </div>
      )}
      <div className="dash-form-grid">
        <Field label="New password">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            minLength={8}
            autoFocus
          />
        </Field>
        <Field label="Confirm password">
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter password"
            minLength={8}
          />
        </Field>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button type="button" className="dash-btn dash-btn-primary dash-btn-sm" disabled={saving} onClick={submit}>
          {saving ? 'Saving…' : 'Save password'}
        </button>
        <button type="button" className="dash-btn dash-btn-ghost dash-btn-sm" onClick={() => { setOpen(false); setError(''); setPassword(''); setConfirm(''); }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
