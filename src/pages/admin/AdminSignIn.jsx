import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Shield } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export default function AdminSignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isSupabaseConfigured) {
      setError('Admin sign-in is not configured yet.');
      return;
    }
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) { setError(authError.message); return; }
    const role = data.user?.user_metadata?.role;
    if (role !== 'owner' && role !== 'manager') {
      await supabase.auth.signOut();
      setError('This account does not have admin access.');
      return;
    }
    navigate('/admin');
  };

  return (
    <div className="auth-split">
      <aside className="auth-photo auth-photo-admin">
        <div className="auth-photo-tint" />
        <div className="auth-photo-content">
          <Link to="/" className="auth-mono">
            <span className="auth-mono-dot"><Shield size={18} /></span>
            <span className="auth-mono-name">
              Home-Office Apartments
              <span className="auth-mono-sub">and Living<span className="brand-accent">Spring</span> Gardens</span>
            </span>
          </Link>
          <div className="auth-photo-headline">
            <h2 className="auth-photo-title">Property<br />dashboard.</h2>
            <p className="auth-photo-sub">Manage enquiries, bookings, guests, and everything else — all in one place.</p>
          </div>
        </div>
      </aside>

      <section className="auth-form-panel">
        <div className="auth-form-inner">
          <Link to="/" className="auth-mono" aria-label="Home">
            <span className="auth-mono-dot"><Shield size={16} /></span>
            <span className="auth-mono-name">
              Admin
              <span className="auth-mono-sub">Home-Office · Living<span className="brand-accent">Spring</span></span>
            </span>
          </Link>

          <h1 className="auth-title">Sign in to admin</h1>
          <p className="auth-lede">Owners and managers only.</p>

          {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

          <form onSubmit={submit} className="auth-form">
            <div className="field">
              <label>Email address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus placeholder="you@homeoffice.gh" />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Password" />
            </div>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Signing in…' : <> Sign in <ArrowRight size={18} /></>}
            </button>
          </form>
          <p className="auth-alt">Not an admin? <Link to="/signin">Guest sign in</Link></p>
        </div>
      </section>
    </div>
  );
}
