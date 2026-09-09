/*
# Fix admin role check: user_metadata -> app_metadata

Every admin-only RLS policy in this project (profiles, enquiries,
bookings, and the messages table's is_admin() helper) checked
`auth.jwt() -> 'user_metadata' ->> 'role'`. Supabase's security linter
flags this as an ERROR: `user_metadata` is editable by the signed-in
user themselves via `supabase.auth.updateUser({ data: {...} })` — any
guest could grant themselves 'owner' from their own browser console.

`app_metadata` is the secure equivalent: it can only be set with the
service-role key (i.e. by an admin running SQL directly), never by a
user's own session. This migration moves the source of truth there.

1. Changes
   - Copies each user's role from raw_user_meta_data to
     raw_app_meta_data, then strips it from raw_user_meta_data (belt
     and suspenders — with the value gone, there's nothing left to
     spoof even if a future policy accidentally checked the wrong
     field again).
   - Redefines public.is_admin() to check app_metadata. Every messages
     policy already calls this function, so fixing it here fixes all
     three without touching them directly.
   - Redefines profiles_admin_read_all, and every enquiries_admin_*
     and bookings_admin_* policy, to check app_metadata directly (they
     don't go through is_admin()).

2. Notes
   - Run this in the Supabase SQL Editor for this project — migrations
     in this repo aren't auto-applied by CI.
   - IMPORTANT: app_metadata only lands in a session's JWT on that
     session's next token refresh — an admin who is already signed in
     when this runs needs to sign out and back in (or wait for the
     automatic refresh) before the new checks recognize them.
   - The "grant admin access" SQL shown in AdminSettings.jsx is updated
     to target raw_app_meta_data — the old raw_user_meta_data version
     of that snippet no longer grants access after this migration.
*/

-- Move role from user_metadata (client-editable) to app_metadata
-- (server-only) for every account that currently has one set.
UPDATE auth.users
SET
  raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', raw_user_meta_data ->> 'role'),
  raw_user_meta_data = raw_user_meta_data - 'role'
WHERE raw_user_meta_data ->> 'role' IS NOT NULL;

-- Fixes messages_select / messages_insert / messages_update in one
-- place, since all three already call is_admin() rather than
-- inlining the role check.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('owner', 'manager'),
    false
  );
$function$;

DROP POLICY IF EXISTS "profiles_admin_read_all" ON public.profiles;
CREATE POLICY "profiles_admin_read_all" ON public.profiles
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('owner', 'manager'));

DROP POLICY IF EXISTS "enquiries_admin_select" ON public.enquiries;
CREATE POLICY "enquiries_admin_select" ON public.enquiries
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('owner', 'manager'));

DROP POLICY IF EXISTS "enquiries_admin_update" ON public.enquiries;
CREATE POLICY "enquiries_admin_update" ON public.enquiries
  FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('owner', 'manager'))
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('owner', 'manager'));

DROP POLICY IF EXISTS "enquiries_admin_delete" ON public.enquiries;
CREATE POLICY "enquiries_admin_delete" ON public.enquiries
  FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('owner', 'manager'));

DROP POLICY IF EXISTS "bookings_admin_select" ON public.bookings;
CREATE POLICY "bookings_admin_select" ON public.bookings
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('owner', 'manager'));

DROP POLICY IF EXISTS "bookings_admin_insert" ON public.bookings;
CREATE POLICY "bookings_admin_insert" ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('owner', 'manager'));

DROP POLICY IF EXISTS "bookings_admin_update" ON public.bookings;
CREATE POLICY "bookings_admin_update" ON public.bookings
  FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('owner', 'manager'))
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('owner', 'manager'));

DROP POLICY IF EXISTS "bookings_admin_delete" ON public.bookings;
CREATE POLICY "bookings_admin_delete" ON public.bookings
  FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('owner', 'manager'));

-- property_details doesn't exist on every environment yet (it's from
-- a later migration) — guard so this still applies cleanly either way.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'property_details') THEN
    EXECUTE 'DROP POLICY IF EXISTS "property_details_admin_select" ON public.property_details';
    EXECUTE $policy$CREATE POLICY "property_details_admin_select" ON public.property_details
      FOR SELECT TO authenticated
      USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('owner', 'manager'))$policy$;

    EXECUTE 'DROP POLICY IF EXISTS "property_details_admin_update" ON public.property_details';
    EXECUTE $policy$CREATE POLICY "property_details_admin_update" ON public.property_details
      FOR UPDATE TO authenticated
      USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('owner', 'manager'))
      WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('owner', 'manager'))$policy$;
  END IF;
END $$;
