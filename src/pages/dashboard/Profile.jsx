import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Save,
  User,
  Mail,
  Phone,
  Monitor,
  Clock,
  BellRing,
  CreditCard,
  Lock,
  Check,
} from 'lucide-react';

/**
 * Profile
 * Editable profile + preferences relevant to a remote-worker/homeoffice apartment.
 *
 * TODO(supabase):
 *   - Load: supabase.from('profiles').select('*').eq('user_id', user.id).single()
 *   - Save: supabase.from('profiles').upsert({ user_id: user.id, ...form })
 *   - Password: supabase.auth.updateUser({ password: newPassword })
 */

export default function Profile() {
  const { user } = useOutletContext();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    workspace: 'dedicated-desk',
    monitors: '1',
    checkInPreference: 'afternoon',
    quietHours: true,
    emailUpdates: true,
    smsUpdates: false,
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        fullName: user.user_metadata?.full_name || '',
        email: user.email || '',
      }));
    }
    // TODO(supabase): load full profile
  }, [user]);

  const update = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: val }));
  };

  const submit = (e) => {
    e.preventDefault();
    // TODO(supabase): upsert profile
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const initials =
    (form.fullName || form.email || 'H').charAt(0).toUpperCase();

  return (
    <div className="dash-page">
      <header className="dash-page-head">
        <p className="dash-eyebrow">PROFILE</p>
        <h1>Your account</h1>
        <p className="dash-lead">Details, preferences, and payment.</p>
      </header>

      <form onSubmit={submit} className="dash-profile">
        {/* Identity card */}
        <section className="dash-card">
          <div className="dash-profile-head">
            <div className="dash-avatar dash-avatar-lg">{initials}</div>
            <div>
              <h2>{form.fullName || 'Add your name'}</h2>
              <p className="dash-text-muted">{form.email}</p>
            </div>
          </div>

          <div className="dash-form-grid">
            <Field label="Full name" icon={<User size={14} />}>
              <input
                type="text"
                value={form.fullName}
                onChange={update('fullName')}
                placeholder="Your full name"
              />
            </Field>
            <Field label="Email" icon={<Mail size={14} />}>
              <input
                type="email"
                value={form.email}
                onChange={update('email')}
                disabled
              />
            </Field>
            <Field label="Phone / WhatsApp" icon={<Phone size={14} />}>
              <input
                type="tel"
                value={form.phone}
                onChange={update('phone')}
                placeholder="+233 …"
              />
            </Field>
          </div>
        </section>

        {/* Workspace preferences — the HomeOffice angle */}
        <section className="dash-card">
          <h2 className="dash-card-h">Workspace preferences</h2>
          <p className="dash-text-muted dash-card-sub">
            Help us match you to the right apartment for how you work.
          </p>

          <div className="dash-form-grid">
            <Field label="Preferred workspace" icon={<Monitor size={14} />}>
              <select value={form.workspace} onChange={update('workspace')}>
                <option value="dedicated-desk">Dedicated desk</option>
                <option value="standing-desk">Standing desk</option>
                <option value="laptop-friendly">Laptop-friendly nook</option>
                <option value="dining-table">Dining table is fine</option>
              </select>
            </Field>
            <Field label="Monitors needed">
              <select value={form.monitors} onChange={update('monitors')}>
                <option value="0">None (laptop only)</option>
                <option value="1">1 external monitor</option>
                <option value="2">Dual monitors</option>
              </select>
            </Field>
            <Field label="Check-in preference" icon={<Clock size={14} />}>
              <select
                value={form.checkInPreference}
                onChange={update('checkInPreference')}
              >
                <option value="morning">Morning (before 12)</option>
                <option value="afternoon">Afternoon (12 – 5)</option>
                <option value="evening">Evening (after 5)</option>
                <option value="late-night">Late night arrival</option>
              </select>
            </Field>
          </div>

          <label className="dash-toggle">
            <input
              type="checkbox"
              checked={form.quietHours}
              onChange={update('quietHours')}
            />
            <span>Prefer apartments with quiet-hours policy after 10 PM</span>
          </label>
        </section>

        {/* Notifications */}
        <section className="dash-card">
          <h2 className="dash-card-h">Notifications</h2>

          <label className="dash-toggle">
            <input
              type="checkbox"
              checked={form.emailUpdates}
              onChange={update('emailUpdates')}
            />
            <span>
              <BellRing size={14} />
              Email me trip reminders and receipts
            </span>
          </label>

          <label className="dash-toggle">
            <input
              type="checkbox"
              checked={form.smsUpdates}
              onChange={update('smsUpdates')}
            />
            <span>
              <BellRing size={14} />
              SMS me check-in codes and urgent updates
            </span>
          </label>
        </section>

        {/* Payment */}
        <section className="dash-card">
          <h2 className="dash-card-h">Payment methods</h2>
          <div className="dash-empty dash-empty-inline">
            <CreditCard size={28} className="dash-empty-icon" />
            <p>No cards saved yet.</p>
            <button type="button" className="dash-btn dash-btn-outline dash-btn-sm">
              Add a card
            </button>
          </div>
        </section>

        {/* Security */}
        <section className="dash-card">
          <h2 className="dash-card-h">Security</h2>
          <button type="button" className="dash-btn dash-btn-outline dash-btn-sm">
            <Lock size={14} /> Change password
          </button>
        </section>

        {/* Save bar */}
        <div className="dash-save-bar">
          {saved && (
            <span className="dash-save-note">
              <Check size={14} /> Saved
            </span>
          )}
          <button type="submit" className="dash-btn dash-btn-primary">
            <Save size={16} /> Save changes
          </button>
        </div>
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
