/*
# Guest profiles directory

The admin panel needs to list everyone who has registered on the site,
but `auth.users` isn't queryable from the browser with the anon key
(that requires the service-role key, which must never reach the client).
The standard fix is a public `profiles` table kept in sync with
`auth.users` via a trigger, readable by admins through RLS.

1. Changes
   - Adds an `email` column to `public.profiles` (the existing table
     from the marketplace migration only had `full_name`/`avatar_url`/`role`).
   - Backfills `profiles` for every account that already exists.
   - Adds a trigger so every new sign-up gets a `profiles` row
     automatically, with the name captured from `auth.signUp`'s
     `options.data.full_name`.
   - Adds an RLS policy so admins/managers (checked via the same
     `user_metadata.role` used elsewhere in the admin panel) can read
     every profile, not just their own.

2. Notes
   - Run this in the Supabase SQL Editor for this project — migrations
     in this repo aren't auto-applied by CI.
   - Safe to re-run: every statement is guarded (`IF NOT EXISTS`,
     `ON CONFLICT`, `DROP ... IF EXISTS` before `CREATE`).
*/

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Backfill: create a profile row for every account that signed up before this migration
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

-- Let admins/managers read every guest's profile (guests can already read their own)
DROP POLICY IF EXISTS "profiles_admin_read_all" ON public.profiles;
CREATE POLICY "profiles_admin_read_all" ON public.profiles
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('owner', 'manager'));
