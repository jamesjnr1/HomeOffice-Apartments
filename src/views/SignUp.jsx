'use client';

import { useState } from 'react';
import { Link, useNavigate } from '@/lib/router';
import AuthShell, { AuthField, AuthSubmit } from '../components/AuthShell';
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
    <AuthShell
      image="/images/exterior-1.jpg"
      headline={<>A quiet space<br />made for you.</>}
      sub="Create an account to save your booking details and get updates about your stay."
      title="Create your account"
      lede="Book faster and manage your stays."
      error={error}
      alt={<>Already have an account? <Link to="/signin" className="font-medium text-accent hover:underline">Sign in</Link></>}
    >
      <form onSubmit={submit}>
        <AuthField
          label="Full name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          autoFocus
          placeholder="Your full name"
        />
        <AuthField
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@example.com"
        />
        <AuthField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          placeholder="At least 8 characters"
        />
        <AuthSubmit loading={loading} loadingText="Creating account…">Create account</AuthSubmit>
      </form>
    </AuthShell>
  );
}
