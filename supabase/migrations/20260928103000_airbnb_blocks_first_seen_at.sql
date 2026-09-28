ALTER TABLE public.external_calendar_blocks
  ADD COLUMN IF NOT EXISTS first_seen_at timestamptz NOT NULL DEFAULT now();

COMMENT ON COLUMN public.external_calendar_blocks.first_seen_at IS
  'Set once on first INSERT, never touched by the sync function''s upsert payload again — the admin dashboard uses this (not synced_at, which changes on every resync) to detect genuinely new Airbnb reservations for the nav notification dot.';
