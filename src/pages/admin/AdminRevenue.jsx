// AdminRevenue.jsx — owner-only revenue stats
import { useOutletContext, Navigate } from 'react-router-dom';

const MONTHS = [
  { m:'Jan', v:0 },{ m:'Feb', v:0 },{ m:'Mar', v:2400 },{ m:'Apr', v:3600 },
  { m:'May', v:4200 },{ m:'Jun', v:5800 },{ m:'Jul', v:7200 },{ m:'Aug', v:6400 },
  { m:'Sep', v:6240 },{ m:'Oct', v:0 },{ m:'Nov', v:0 },{ m:'Dec', v:0 },
];
const MAX = Math.max(...MONTHS.map(m => m.v));

const BY_APT = [
  { apt:'The Verandah Apartment', nights:38, revenue:23560, occupancy:'62%' },
  { apt:'The Garden Apartment', nights:29, revenue:13920, occupancy:'47%' },
];

export default function AdminRevenue() {
  const { isOwner } = useOutletContext();
  if (!isOwner) return <Navigate to="/admin" replace/>;

  const ytd = MONTHS.reduce((a, m) => a + m.v, 0);
  const totalNights = BY_APT.reduce((a, b) => a + b.nights, 0);

  return (
    <div className="ad-page">
      <header className="ad-page-head">
        <span className="ad-eyebrow">REVENUE</span>
        <h1>Revenue overview</h1>
        <p className="ad-lead">Year-to-date earnings and occupancy for both apartments.</p>
      </header>

      <div className="ad-stat-grid">
        <div className="ad-stat ad-stat-green">
          <div className="ad-stat-value">GHS {ytd.toLocaleString()}</div>
          <div className="ad-stat-label">Year-to-date revenue</div>
        </div>
        <div className="ad-stat ad-stat-blue">
          <div className="ad-stat-value">{totalNights}</div>
          <div className="ad-stat-label">Total nights booked</div>
        </div>
        <div className="ad-stat ad-stat-purple">
          <div className="ad-stat-value">54%</div>
          <div className="ad-stat-label">Avg occupancy (YTD)</div>
        </div>
      </div>

      <div className="ad-card">
        <h2 className="ad-card-h">Monthly revenue 2026</h2>
        <div className="ad-bar-chart">
          {MONTHS.map(m => (
            <div key={m.m} className="ad-bar-col">
              <div className="ad-bar-wrap">
                <div
                  className="ad-bar"
                  style={{ height: MAX > 0 ? `${(m.v / MAX) * 100}%` : '0%' }}
                  title={`GHS ${m.v.toLocaleString()}`}
                />
              </div>
              <div className="ad-bar-label">{m.m}</div>
              {m.v > 0 && <div className="ad-bar-val">{(m.v/1000).toFixed(1)}k</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="ad-card" style={{ marginTop: 20 }}>
        <h2 className="ad-card-h">Per apartment</h2>
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead><tr><th>Apartment</th><th>Nights booked</th><th>Revenue</th><th>Occupancy</th></tr></thead>
            <tbody>
              {BY_APT.map(a => (
                <tr key={a.apt}>
                  <td className="ad-td-primary">{a.apt}</td>
                  <td>{a.nights}</td>
                  <td>GHS {a.revenue.toLocaleString()}</td>
                  <td><span className="ad-occ-pill">{a.occupancy}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
