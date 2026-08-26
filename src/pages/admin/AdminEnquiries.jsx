import { useState } from 'react';
import { Check, Reply, Archive, Trash2 } from 'lucide-react';

const MOCK = [
  { id:1, name:'Abena Mensah', email:'abena@example.com', phone:'+233 24 000 0001', checkIn:'2026-10-10', checkOut:'2026-10-15', guests:2, apt:'Verandah', message:'Visiting for work. Will need reliable Wi-Fi.', status:'new', at:'2h ago' },
  { id:2, name:'Kofi Asante', email:'kofi@example.com', phone:'+233 20 000 0002', checkIn:'2026-10-20', checkOut:'2026-10-24', guests:1, apt:'Garden', message:'Solo trip. Quiet space preferred.', status:'new', at:'4h ago' },
  { id:3, name:'Ama Darko', email:'ama@example.com', phone:'', checkIn:'2026-11-01', checkOut:'2026-11-08', guests:3, apt:'Either', message:'Family visit from Accra.', status:'new', at:'1d ago' },
  { id:4, name:'Emmanuel Owusu', email:'eo@example.com', phone:'+233 27 000 0004', checkIn:'2026-09-12', checkOut:'2026-09-15', guests:2, apt:'Verandah', message:'', status:'replied', at:'3d ago' },
  { id:5, name:'Grace Ofori', email:'grace@example.com', phone:'', checkIn:'2026-09-05', checkOut:'2026-09-08', guests:2, apt:'Garden', message:'Short break.', status:'archived', at:'1wk ago' },
];

const TABS = ['all','new','replied','archived'];

export default function AdminEnquiries() {
  const [tab, setTab] = useState('all');
  const [enquiries, setEnquiries] = useState(MOCK);
  const [expanded, setExpanded] = useState(null);

  const filtered = enquiries.filter(e => tab === 'all' || e.status === tab);
  const counts = Object.fromEntries(TABS.map(t => [t, t === 'all' ? enquiries.length : enquiries.filter(e => e.status === t).length]));

  const act = (id, status) => setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status } : e));
  const remove = (id) => setEnquiries(prev => prev.filter(e => e.id !== id));

  return (
    <div className="mgmt-page">
      <header className="mgmt-page-head">
        <span className="mgmt-eyebrow">ENQUIRIES</span>
        <h1>Enquiries inbox</h1>
        <p className="mgmt-lead">Every booking request submitted through the site.</p>
      </header>

      <div className="mgmt-tabs">
        {TABS.map(t => (
          <button key={t} className={`mgmt-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
            <span className="mgmt-tab-count">{counts[t]}</span>
          </button>
        ))}
      </div>

      <div className="mgmt-card mgmt-card-flush">
        {filtered.length === 0 ? (
          <div className="mgmt-empty"><p>No enquiries in this category.</p></div>
        ) : (
          <div className="mgmt-table-wrap">
            <table className="mgmt-table">
              <thead>
                <tr><th>Guest</th><th>Apartment</th><th>Dates</th><th>Guests</th><th>Status</th><th>Received</th><th></th></tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <>
                    <tr key={e.id} className={`mgmt-tr-click ${expanded === e.id ? 'expanded' : ''}`} onClick={() => setExpanded(expanded === e.id ? null : e.id)}>
                      <td><div className="mgmt-td-primary">{e.name}</div><div className="mgmt-td-sub">{e.email}</div></td>
                      <td>{e.apt}</td>
                      <td>{e.checkIn} → {e.checkOut}</td>
                      <td>{e.guests}</td>
                      <td><span className={`mgmt-status ${e.status}`}>{e.status}</span></td>
                      <td className="mgmt-td-muted">{e.at}</td>
                      <td>
                        <div className="mgmt-row-actions" onClick={ev => ev.stopPropagation()}>
                          <button title="Mark replied" onClick={() => act(e.id,'replied')}><Check size={14}/></button>
                          <button title="Archive" onClick={() => act(e.id,'archived')}><Archive size={14}/></button>
                          <button title="Delete" onClick={() => remove(e.id)} className="mgmt-action-danger"><Trash2 size={14}/></button>
                        </div>
                      </td>
                    </tr>
                    {expanded === e.id && (
                      <tr key={`${e.id}-exp`} className="mgmt-tr-expanded">
                        <td colSpan={7}>
                          <div className="mgmt-expanded-body">
                            {e.message && <p><strong>Message:</strong> {e.message}</p>}
                            {e.phone && <p><strong>Phone:</strong> {e.phone}</p>}
                            <div className="mgmt-expanded-actions">
                              <a className="mgmt-btn mgmt-btn-primary" href={`mailto:${e.email}?subject=Re: Your enquiry for ${e.apt} Apartment`}>
                                <Reply size={14}/> Reply by email
                              </a>
                              {e.phone && (
                                <a className="mgmt-btn mgmt-btn-outline" href={`tel:${e.phone}`}>
                                  Call
                                </a>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
