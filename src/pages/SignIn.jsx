import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isSupabaseConfigured) {
      setError('Sign-in is not configured yet. Ask the site owner to set Supabase env vars.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate('/dashboard');
  };

  return (
    <div className="auth-split">
      {/* Left: photo panel */}
      <aside className="auth-photo">
        <div className="auth-photo-tint" />
        <div className="auth-photo-content">
          <Link to="/" className="auth-mono">
            <span className="auth-mono-dot">H</span>
            <span className="auth-mono-name">
              Home-Office Apartments
              <span className="auth-mono-sub">
                and Living<span className="brand-accent">Spring</span> Gardens
              </span>
            </span>
          </Link>
          <div className="auth-photo-headline">
            <h2 className="auth-photo-title">
              Peace, comfort,<br />
              and a warm welcome.
            </h2>
            <p className="auth-photo-sub">
              Sign in to manage your bookings, save favourites, and stay in touch with your host.
            </p>
          </div>
        </div>
      </aside>

      {/* Right: form panel */}
      <section className="auth-form-panel">
        <div className="auth-form-inner">
          <Link to="/" className="auth-mono" aria-label="Home">
            <span className="auth-mono-dot">H</span>
            <span className="auth-mono-name">
              Home-Office
              <span className="auth-mono-sub">
                Living<span className="brand-accent">Spring</span> Gardens
              </span>
            </span>
          </Link>

          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-lede">Sign in to manage your bookings.</p>

          {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

          <form onSubmit={submit} className="auth-form">
            <div className="field">
              <label>Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="you@example.com"
              />
            </div>
            <div className="field">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="At least 8 characters"
              />
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? 'Signing in…' : (
                <>Sign in <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <p className="auth-alt">
            New here? <Link to="/signup">Create an account</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
