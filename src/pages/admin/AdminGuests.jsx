import { useState } from 'react';
import { Search } from 'lucide-react';

const GUESTS = [
  { id:1, name:'Jonathan Duah', email:'james@example.com', joined:'2026-08-10', bookings:2, spent:5260 },
  { id:2, name:'Esi Boateng', email:'esi@example.com', joined:'2026-08-20', bookings:1, spent:960 },
  { id:3, name:'Nana Adjei', email:'nana@example.com', joined:'2026-08-22', bookings:1, spent:2480 },
  { id:4, name:'Abena Mensah', email:'abena@example.com', joined:'2026-07-05', bookings:3, spent:7680 },
  { id:5, name:'Kofi Asante', email:'kofi@example.com', joined:'2026-08-24', bookings:0, spent:0 },
  { id:6, name:'Ama Darko', email:'ama@example.com', joined:'2026-08-24', bookings:0, spent:0 },
  { id:7, name:'Emmanuel Owusu', email:'eo@example.com', joined:'2026-09-01', bookings:1, spent:2160 },
  { id:8, name:'Grace Ofori', email:'grace@example.com', joined:'2026-09-03', bookings:1, spent:1440 },
];

export default function AdminGuests() {
  const [q, setQ] = useState('');
  const filtered = GUESTS.filter(g =>
    g.name.toLowerCase().includes(q.toLowerCase()) ||
    g.email.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="ad-page">
      <header className="ad-page-head">
        <span className="ad-eyebrow">GUESTS</span>
        <h1>Guests</h1>
        <p className="ad-lead">Everyone who has signed up on the site.</p>
      </header>

      <div className="ad-search-bar">
        <Search size={15}/>
        <input type="text" placeholder="Search by name or email…" value={q} onChange={e => setQ(e.target.value)}/>
      </div>

      <div className="ad-card ad-card-flush">
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Joined</th><th>Bookings</th><th>Total spent</th></tr>
            </thead>
            <tbody>
              {filtered.map(g => (
                <tr key={g.id}>
                  <td>
                    <div className="ad-guest-row">
                      <div className="ad-guest-av">{g.name.charAt(0)}</div>
                      <div className="ad-td-primary">{g.name}</div>
                    </div>
                  </td>
                  <td className="ad-td-sub">{g.email}</td>
                  <td className="ad-td-muted">{g.joined}</td>
                  <td>{g.bookings}</td>
                  <td>{g.spent > 0 ? `GHS ${g.spent.toLocaleString()}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
