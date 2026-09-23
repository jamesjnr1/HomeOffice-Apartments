/*
# Fix reviews admin RLS: user_metadata -> app_metadata

The 20260909170000_fix_admin_role_to_app_metadata.sql migration moved
every admin-role RLS check in this project off `user_metadata` (which
any signed-in user can edit on themselves via
`supabase.auth.updateUser({ data: {...} })`) onto `app_metadata`
(server-only, settable only with the service-role key). The reviews
table was added afterward (20260921130000_reviews_and_guest_accounts.sql)
and reintroduced the same insecure `user_metadata` check the earlier
migration had just eliminated everywhere else — flagged by Supabase's
own security linter as an ERROR.

Concretely exploitable: any signed-in guest could call
`supabase.auth.updateUser({ data: { role: 'owner' } })` on their own
session, then pass `reviews_admin_select_all` / `reviews_admin_update`
and read every review (not just public ones) and edit or hide ANY
guest's review, not just their own.

Fully self-contained and safe to re-run.

1. Changes
   - Redefines reviews_admin_select_all and reviews_admin_update to
     check `app_metadata` instead of `user_metadata`, matching every
     other admin policy in this project (and public.is_admin(), which
     already checks app_metadata).

2. Notes
   - Run this in the Supabase SQL Editor for this project — migrations
     in this repo aren't auto-applied by CI.
   - No user-facing behavior change for legitimate owner/manager
     accounts — their role already lives in app_metadata since the
     original fix migration. This only closes the loophole a guest
     account could otherwise exploit.
*/

DROP POLICY IF EXISTS "reviews_admin_select_all" ON public.reviews;
CREATE POLICY "reviews_admin_select_all" ON public.reviews
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('owner', 'manager'));

DROP POLICY IF EXISTS "reviews_admin_update" ON public.reviews;
CREATE POLICY "reviews_admin_update" ON public.reviews
  FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('owner', 'manager'))
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('owner', 'manager'));
