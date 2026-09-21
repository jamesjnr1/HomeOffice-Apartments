// StatCard — one cell in a .stat-band row (see globals.css). Shared
// between Apartments.jsx and About.jsx rather than each page keeping
// its own copy of the same three-line component.
export default function StatCard({ label, value, suffix }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {suffix && <div className="stat-suffix">{suffix}</div>}
    </div>
  );
}
