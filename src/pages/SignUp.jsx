import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function SignUp() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isSupabaseConfigured) {
      setError('Sign-up is not configured yet. Ask the site owner to set Supabase env vars.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate('/dashboard');
  };

  return (
    <div className="auth-split">
      <aside className="auth-photo auth-photo-signup">
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
              A quiet space<br />
              made for you.
            </h2>
            <p className="auth-photo-sub">
              Create an account to save your booking details and get updates about your stay.
            </p>
          </div>
        </div>
      </aside>

      <section className="auth-form-panel">
        <div className="auth-form-inner">
          <Link to="/" className="auth-mono" aria-label="Home">
            <span className="auth-mono-dot">H</span>
            <span className="auth-mono-name">
              Home-Office Apartments
              <span className="auth-mono-sub">
                and Living<span className="brand-accent">Spring</span> Gardens
              </span>
            </span>
          </Link>

          <h1 className="auth-title">Create your account</h1>
          <p className="auth-lede">Book faster and manage your stays.</p>

          {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

          <form onSubmit={submit} className="auth-form">
            <div className="field">
              <label>Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoFocus
                placeholder="Your full name"
              />
            </div>
            <div className="field">
              <label>Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
                minLength={8}
                placeholder="At least 8 characters"
              />
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? 'Creating account…' : (
                <>Create account <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <p className="auth-alt">
            Already have an account? <Link to="/signin">Sign in</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
