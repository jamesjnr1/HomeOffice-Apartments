// AdminRevenue.jsx — owner-only revenue stats
import { useOutletContext, Navigate } from 'react-router-dom';

const MONTHS = [
  { m:'Jan', v:0 },{ m:'Feb', v:0 },{ m:'Mar', v:2400 },{ m:'Apr', v:3600 },
  { m:'May', v:4200 },{ m:'Jun', v:5800 },{ m:'Jul', v:7200 },{ m:'Aug', v:6400 },
  { m:'Sep', v:6240 },{ m:'Oct', v:0 },{ m:'Nov', v:0 },{ m:'Dec', v:0 },
];
const MAX = Math.max(...MONTHS.map(m => m.v));

export default function AdminRevenue() {
  const { isOwner } = useOutletContext();
  if (!isOwner) return <Navigate to="/admin" replace/>;

  const ytd = MONTHS.reduce((a, m) => a + m.v, 0);
  const totalNights = 67;

  return (
    <div className="mgmt-page">
      <header className="mgmt-page-head">
        <span className="mgmt-eyebrow">REVENUE</span>
        <h1>Revenue overview</h1>
        <p className="mgmt-lead">Year-to-date earnings and occupancy for the apartment.</p>
      </header>

      <div className="mgmt-stat-grid">
        <div className="mgmt-stat mgmt-stat-green">
          <div className="mgmt-stat-value">GHS {ytd.toLocaleString()}</div>
          <div className="mgmt-stat-label">Year-to-date revenue</div>
        </div>
        <div className="mgmt-stat mgmt-stat-blue">
          <div className="mgmt-stat-value">{totalNights}</div>
          <div className="mgmt-stat-label">Total nights booked</div>
        </div>
        <div className="mgmt-stat mgmt-stat-purple">
          <div className="mgmt-stat-value">54%</div>
          <div className="mgmt-stat-label">Avg occupancy (YTD)</div>
        </div>
      </div>

      <div className="mgmt-card">
        <h2 className="mgmt-card-h">Monthly revenue 2026</h2>
        <div className="mgmt-bar-chart">
          {MONTHS.map(m => (
            <div key={m.m} className="mgmt-bar-col">
              <div className="mgmt-bar-wrap">
                <div
                  className="mgmt-bar"
                  style={{ height: MAX > 0 ? `${(m.v / MAX) * 100}%` : '0%' }}
                  title={`GHS ${m.v.toLocaleString()}`}
                />
              </div>
              <div className="mgmt-bar-label">{m.m}</div>
              {m.v > 0 && <div className="mgmt-bar-val">{(m.v/1000).toFixed(1)}k</div>}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
