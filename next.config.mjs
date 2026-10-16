/** @type {import('next').NextConfig} */
const nextConfig = {
  // The Vercel project's env vars are VITE_-prefixed from the old Vite
  // build. Map them onto NEXT_PUBLIC_ names here so nothing needs to
  // be renamed in Vercel → Settings → Environment Variables.
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
  },
};

export default nextConfig;
