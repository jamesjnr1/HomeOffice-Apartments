/*
# Guest profiles directory

The admin panel needs to list everyone who has registered on the site,
but `auth.users` isn't queryable from the browser with the anon key
(that requires the service-role key, which must never reach the client).
The standard fix is a public `profiles` table kept in sync with
`auth.users` via a trigger, readable by admins through RLS.

This migration is fully self-contained — it does not assume the
`profiles` table from any earlier migration actually exists on this
project, and creates it if missing.

1. Changes
   - Creates `public.profiles` if it doesn't already exist, and adds
     an `email` column either way (in case an older, incomplete
     version of the table is already there).
   - Backfills `profiles` for every account that already exists.
   - Adds a trigger so every new sign-up gets a `profiles` row
     automatically, with the name captured from `auth.signUp`'s
     `options.data.full_name`.
   - Adds RLS policies: guests can read/update their own profile, and
     admins/managers (checked via the same `user_metadata.role` used
     elsewhere in the admin panel) can read every profile.

2. Notes
   - Run this in the Supabase SQL Editor for this project — migrations
     in this repo aren't auto-applied by CI.
   - Safe to re-run: every statement is guarded (`IF NOT EXISTS`,
     `ON CONFLICT`, `DROP ... IF EXISTS` before `CREATE`).
*/

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Backfill: create/update a profile row for every account that already exists
INSERT INTO public.profiles (id, email, full_name, created_at)
SELECT id, email, raw_user_meta_data->>'full_name', created_at
FROM auth.users
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

-- Keep profiles in sync with auth.users going forward
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Guests can read and update their own profile
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Let admins/managers read every guest's profile
DROP POLICY IF EXISTS "profiles_admin_read_all" ON public.profiles;
CREATE POLICY "profiles_admin_read_all" ON public.profiles
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('owner', 'manager'));
