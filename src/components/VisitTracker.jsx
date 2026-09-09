import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getVisitorId } from '../lib/visitorId';

// Skip admin/guest dashboards — that's the site owner or a signed-in
// guest using their own tools, not a "visitor" in the marketing sense.
const EXCLUDED_PREFIXES = ['/admin', '/dashboard'];

/**
 * VisitTracker — mounted once at the app root. Logs one row to
 * site_visits per public-page view (see
 * supabase/migrations/20260909180000_create_site_visits.sql), read
 * back by AdminAnalytics.jsx. Renders nothing; failures are silent
 * and never block the page.
 */
export default function VisitTracker() {
  const location = useLocation();

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const path = location.pathname;
    if (EXCLUDED_PREFIXES.some((prefix) => path.startsWith(prefix))) return;

    supabase
      .from('site_visits')
      .insert({ session_id: getVisitorId(), path, referrer: document.referrer || null })
      .then(() => {}, () => {});
  }, [location.pathname]);

  return null;
}
