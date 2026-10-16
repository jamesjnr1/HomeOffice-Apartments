'use client';

import { useState } from 'react';
import { Link, useNavigate } from '@/lib/router';
import AuthShell, { AuthField, AuthSubmit } from '../components/AuthShell';
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
    <AuthShell
      headline={<>Peace, comfort,<br />and a warm welcome.</>}
      sub="Sign in to manage your bookings, save favourites, and stay in touch with your host."
      title="Welcome back"
      lede="Sign in to manage your bookings."
      error={error}
      alt={<>New here? <Link to="/signup" className="font-medium text-accent hover:underline">Create an account</Link></>}
    >
      <form onSubmit={submit}>
        <AuthField
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
          placeholder="you@example.com"
        />
        <AuthField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="At least 8 characters"
        />
        <AuthSubmit loading={loading} loadingText="Signing in…">Sign in</AuthSubmit>
      </form>
    </AuthShell>
  );
}
