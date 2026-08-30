import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';

/**
 * AdminGuests — real registered guests, from the `profiles` table.
 * `profiles` is kept in sync with `auth.users` by a database trigger
 * (see supabase/migrations/20260830120000_guest_profiles_directory.sql).
 *
 * Booking counts / total spent aren't shown yet — there's no real
 * `bookings` table wired up on the live schema, and showing fake
 * numbers next to real guest data would be misleading.
 */

export default function AdminGuests() {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    loadGuests();
  }, []);

  const loadGuests = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setGuests(data);
    setLoading(false);
  };

  const filtered = guests.filter((g) =>
    (g.full_name || '').toLowerCase().includes(q.toLowerCase()) ||
    (g.email || '').toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="mgmt-page">
      <header className="mgmt-page-head">
        <span className="mgmt-eyebrow">GUESTS</span>
        <h1>Guests</h1>
        <p className="mgmt-lead">Everyone who has signed up on the site.</p>
      </header>

      <div className="mgmt-search-bar">
        <Search size={15} />
        <input
          type="text"
          placeholder="Search by name or email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="mgmt-card mgmt-card-flush">
        {loading ? (
          <div className="mgmt-empty"><p>Loading guests…</p></div>
        ) : filtered.length === 0 ? (
          <div className="mgmt-empty"><p>No guests yet.</p></div>
        ) : (
          <div className="mgmt-table-wrap">
            <table className="mgmt-table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Joined</th></tr>
              </thead>
              <tbody>
                {filtered.map((g) => (
                  <tr key={g.id}>
                    <td>
                      <div className="mgmt-guest-row">
                        <div className="mgmt-guest-av">
                          {(g.full_name || g.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="mgmt-td-primary">{g.full_name || 'Guest'}</div>
                      </div>
                    </td>
                    <td className="mgmt-td-sub">{g.email || '—'}</td>
                    <td className="mgmt-td-muted">
                      {g.created_at ? new Date(g.created_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
