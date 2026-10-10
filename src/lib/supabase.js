import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Fallback placeholders keep the app from crashing at boot when env vars
// haven't been configured yet. Set them in Vercel → Settings →
// Environment Variables before wiring up auth or data.
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  key || 'placeholder-anon-key'
);

export const isSupabaseConfigured = Boolean(url && key);
