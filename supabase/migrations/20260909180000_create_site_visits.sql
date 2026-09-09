/*
# Create site_visits table

Lightweight, self-hosted page-view tracking so the admin can see
visitors alongside enquiries and bookings in one place, instead of a
separate analytics dashboard. No cookies, no third-party script — a
random id generated client-side and kept in localStorage approximates
a "visitor" across page views on the same browser (see
src/lib/visitorId.js and src/components/VisitTracker.jsx).

This is deliberately simple, not a full analytics product: it doesn't
filter bots/crawlers, and "unique visitors" really means "distinct
browsers we've seen", not verified individual people. Good enough for
"is anyone finding the site, and how many of them enquire/book" — not
a replacement for a real analytics tool if that's ever needed later.

This migration is fully self-contained like the others in this repo
— every statement is guarded so it's safe to re-run.

1. New Table
   - `site_visits`: one row per page view on a *public* page (the
     client-side tracker skips /admin and /dashboard routes, so
     admin/guest activity on their own dashboards never counts).

2. Security
   - Row Level Security is enabled.
   - Anyone (including anonymous visitors — that's the point) can
     INSERT a visit row. No UPDATE/DELETE policy for anyone — visit
     rows are immutable once written.
   - Only owner/manager admins can read them.

3. Notes
   - Run this in the Supabase SQL Editor for this project — migrations
     in this repo aren't auto-applied by CI.
*/

CREATE TABLE IF NOT EXISTS public.site_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  path text NOT NULL,
  referrer text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS site_visits_created_at_idx ON public.site_visits(created_at);
CREATE INDEX IF NOT EXISTS site_visits_session_id_idx ON public.site_visits(session_id);

ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_visits_public_insert" ON public.site_visits;
CREATE POLICY "site_visits_public_insert" ON public.site_visits
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "site_visits_admin_select" ON public.site_visits;
CREATE POLICY "site_visits_admin_select" ON public.site_visits
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('owner', 'manager'));

-- Enable realtime so "visitors today" can tick up live on the
-- analytics page, same as everything else in this project.
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.site_visits;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
