// AdminRevenue.jsx — owner-only revenue stats, computed live from the
// real `bookings` table (no more hardcoded figures). Kept current via
// a realtime subscription, same pattern as the other admin pages —
// confirming or cancelling a booking anywhere updates this instantly.
import { useOutletContext, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { parseISO, differenceInCalendarDays } from 'date-fns';
import { supabase } from '../../lib/supabase';

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AdminRevenue() {
  const { isOwner } = useOutletContext();
  if (!isOwner) return <Navigate to="/admin" replace/>;

  const year = new Date().getFullYear();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();

    const sub = supabase
      .channel('admin-revenue')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, loadBookings)
      .subscribe();

    return () => { supabase.removeChannel(sub); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadBookings = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .neq('status', 'cancelled')
      .gte('check_in', `${year}-01-01`)
      .lte('check_in', `${year}-12-31`);

    if (!error && data) setBookings(data);
    setLoading(false);
  };

  const months = MONTH_LABELS.map((label, i) => ({
    m: label,
    v: bookings
      .filter((b) => parseISO(b.check_in).getMonth() === i)
      .reduce((sum, b) => sum + Number(b.total), 0),
  }));
  const max = Math.max(...months.map((m) => m.v), 0);

  const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.total), 0);
  const totalNights = bookings.reduce((sum, b) => sum + b.nights, 0);
  const daysInYear = differenceInCalendarDays(new Date(year + 1, 0, 1), new Date(year, 0, 1));
  const occupancy = daysInYear > 0 ? Math.round((totalNights / daysInYear) * 100) : 0;

  return (
    <div className="mgmt-page">
      <header className="mgmt-page-head">
        <span className="mgmt-eyebrow">REVENUE</span>
        <h1>Revenue overview</h1>
        <p className="mgmt-lead">
          {loading ? 'Loading…' : `${year} earnings and occupancy for the apartment, from confirmed bookings.`}
        </p>
      </header>

      <div className="mgmt-stat-grid">
        <div className="mgmt-stat mgmt-stat-green">
          <div className="mgmt-stat-value">GHS {totalRevenue.toLocaleString()}</div>
          <div className="mgmt-stat-label">Total revenue ({year})</div>
        </div>
        <div className="mgmt-stat mgmt-stat-blue">
          <div className="mgmt-stat-value">{totalNights}</div>
          <div className="mgmt-stat-label">Total nights booked</div>
        </div>
        <div className="mgmt-stat mgmt-stat-purple">
          <div className="mgmt-stat-value">{occupancy}%</div>
          <div className="mgmt-stat-label">Occupancy ({year})</div>
        </div>
      </div>

      <div className="mgmt-card">
        <h2 className="mgmt-card-h">Monthly revenue {year}</h2>
        {!loading && bookings.length === 0 ? (
          <div className="mgmt-empty"><p>No confirmed bookings for {year} yet.</p></div>
        ) : (
          <div className="mgmt-bar-chart">
            {months.map(m => (
              <div key={m.m} className="mgmt-bar-col">
                <div className="mgmt-bar-wrap">
                  <div
                    className="mgmt-bar"
                    style={{ height: max > 0 ? `${(m.v / max) * 100}%` : '0%' }}
                    title={`GHS ${m.v.toLocaleString()}`}
                  />
                </div>
                <div className="mgmt-bar-label">{m.m}</div>
                {m.v > 0 && <div className="mgmt-bar-val">{(m.v/1000).toFixed(1)}k</div>}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
