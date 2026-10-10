'use client';

import { useState } from 'react';
import { Link, useNavigate } from '@/lib/router';
import { Shield } from 'lucide-react';
import AuthShell, { AuthField, AuthSubmit } from '../../components/AuthShell';
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
    const role = data.user?.app_metadata?.role;
    if (role !== 'owner' && role !== 'manager') {
      await supabase.auth.signOut();
      setError('This account does not have admin access.');
      return;
    }
    navigate('/admin');
  };

  return (
    <AuthShell
      image="/images/exterior-2.jpg"
      badge={
        <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-ivory/10 px-3.5 py-1.5 text-[12px] font-medium tracking-wide text-ivory/80 backdrop-blur">
          <Shield size={13} strokeWidth={1.75} /> Admin
        </span>
      }
      headline={<>Property<br />dashboard.</>}
      sub="Manage enquiries, bookings, guests, and everything else — all in one place."
      title="Sign in to admin"
      lede="Owners and managers only."
      error={error}
      alt={<>Not an admin? <Link to="/signin" className="font-medium text-accent hover:underline">Guest sign in</Link></>}
    >
      <form onSubmit={submit}>
        <AuthField label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus placeholder="you@homeoffice.gh" />
        <AuthField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Password" />
        <AuthSubmit loading={loading} loadingText="Signing in…">Sign in</AuthSubmit>
      </form>
    </AuthShell>
  );
}
