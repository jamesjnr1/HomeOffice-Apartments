import { useOutletContext } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ArrowRight, Inbox, Users, CalendarDays, TrendingUp } from 'lucide-react';

const STATS = [
  { label: 'New enquiries', value: 3, icon: Inbox, link: '/admin/enquiries', color: 'green' },
  { label: 'Upcoming bookings', value: 2, icon: CalendarDays, link: '/admin/bookings', color: 'blue' },
  { label: 'Total guests', value: 14, icon: Users, link: '/admin/guests', color: 'purple' },
  { label: 'Revenue (Sep)', value: 'GHS 6,240', icon: TrendingUp, link: '/admin/revenue', color: 'gold' },
];

const RECENT_ENQUIRIES = [
  { id: 1, name: 'Abena Mensah', email: 'abena@example.com', dates: '10–15 Oct', apt: 'Verandah', status: 'new', at: '2h ago' },
  { id: 2, name: 'Kofi Asante', email: 'kofi@example.com', dates: '20–24 Oct', apt: 'Garden', status: 'new', at: '4h ago' },
  { id: 3, name: 'Ama Darko', email: 'ama@example.com', dates: '1–8 Nov', apt: 'Either', status: 'new', at: '1d ago' },
];

const UPCOMING = [
  { id: 1, name: 'Jonathan Duah', apt: 'Verandah', checkIn: 'Mon 31 Aug', checkOut: 'Fri 4 Sep', nights: 4 },
  { id: 2, name: 'Esi Boateng', apt: 'Garden', checkIn: 'Sat 6 Sep', checkOut: 'Mon 8 Sep', nights: 2 },
];

export default function AdminOverview() {
  const { displayName, isOwner } = useOutletContext();
  return (
    <div className="ad-page">
      <header className="ad-page-head">
        <span className="ad-eyebrow">OVERVIEW</span>
        <h1>Good morning, {displayName}.</h1>
        <p className="ad-lead">Here's what needs your attention today.</p>
      </header>

      <div className="ad-stat-grid">
        {STATS.filter(s => s.label !== 'Revenue (Sep)' || isOwner).map(s => (
          <Link to={s.link} key={s.label} className={`ad-stat ad-stat-${s.color}`}>
            <s.icon size={22} className="ad-stat-icon"/>
            <div className="ad-stat-value">{s.value}</div>
            <div className="ad-stat-label">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="ad-two-col">
        <section className="ad-card">
          <div className="ad-card-head">
            <h2>Recent enquiries</h2>
            <Link to="/admin/enquiries" className="ad-linky">View all <ArrowRight size={14}/></Link>
          </div>
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead><tr><th>Guest</th><th>Dates</th><th>Apt</th><th>Status</th><th>Received</th></tr></thead>
              <tbody>
                {RECENT_ENQUIRIES.map(e => (
                  <tr key={e.id}>
                    <td><div className="ad-td-primary">{e.name}</div><div className="ad-td-sub">{e.email}</div></td>
                    <td>{e.dates}</td>
                    <td>{e.apt}</td>
                    <td><span className={`ad-status ${e.status}`}>{e.status}</span></td>
                    <td className="ad-td-muted">{e.at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="ad-card">
          <div className="ad-card-head">
            <h2>Upcoming check-ins</h2>
            <Link to="/admin/bookings" className="ad-linky">View all <ArrowRight size={14}/></Link>
          </div>
          <div className="ad-booking-list">
            {UPCOMING.map(b => (
              <div key={b.id} className="ad-booking-row">
                <div className="ad-booking-apt">{b.apt}</div>
                <div>
                  <div className="ad-td-primary">{b.name}</div>
                  <div className="ad-td-sub">{b.checkIn} → {b.checkOut} · {b.nights} nights</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
