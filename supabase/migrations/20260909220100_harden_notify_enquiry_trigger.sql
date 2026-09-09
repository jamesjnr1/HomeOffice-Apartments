/*
# Harden the notify-enquiry trigger (fixes 2 advisor WARNs)

Two WARN-level security advisories showed up immediately after
20260909220000_notify_enquiry_by_email.sql, both self-inflicted by
that migration:

1. "Extension in Public" — CREATE EXTENSION pg_net with no schema
   specified installed its extension record into `public`. On this
   platform pg_net's extension explicitly refuses ALTER EXTENSION ...
   SET SCHEMA (`0A000: extension "pg_net" does not support SET
   SCHEMA`) — a Supabase-managed restriction on this particular
   extension, not something a migration can work around. Left as-is;
   this doesn't affect net.http_post() itself, which always lives in
   its own dedicated `net` schema regardless.

2. "Public Can Execute SECURITY DEFINER Function" — any function
   created in the `public` schema is auto-exposed by PostgREST as
   /rest/v1/rpc/<name> and, by default, executable by anon and
   authenticated. public.notify_new_enquiry() is a trigger function
   (it reads the magic NEW variable) — Postgres already refuses to run
   it outside of trigger context ("trigger functions can only be
   called as triggers"), so this was never actually exploitable, but
   there's no reason to leave an RPC endpoint sitting there for it.
   Revoking EXECUTE from anon/authenticated doesn't affect the
   trigger's own ability to call it — trigger invocation runs as the
   function owner, not through a role's EXECUTE grant.

Safe to re-run.

1. Changes
   - Revokes EXECUTE on public.notify_new_enquiry() from PUBLIC, anon,
     and authenticated (the only one of the two advisories fixable
     here — see note above on pg_net's schema).

2. Notes
   - Depends on 20260909220000_notify_enquiry_by_email.sql.
*/

REVOKE EXECUTE ON FUNCTION public.notify_new_enquiry() FROM PUBLIC, anon, authenticated;
