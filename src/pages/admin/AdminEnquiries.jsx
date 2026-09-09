import { Fragment, useState, useEffect } from 'react';
import { Check, Reply, Archive, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../../lib/supabase';

/**
 * AdminEnquiries — real submissions from the public Book form, stored
 * in the `enquiries` table (see supabase/migrations/20260909140000_
 * create_enquiries.sql). Kept live via a realtime subscription, same
 * pattern as AdminMessages.jsx.
 */

const TABS = ['all', 'new', 'replied', 'archived'];

export default function AdminEnquiries() {
  const [tab, setTab] = useState('all');
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    loadEnquiries();

    const sub = supabase
      .channel('admin-enquiries')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enquiries' }, loadEnquiries)
      .subscribe();

    return () => { supabase.removeChannel(sub); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadEnquiries = async () => {
    const { data, error } = await supabase
      .from('enquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setEnquiries(data);
    setLoading(false);
  };

  const filtered = enquiries.filter(e => tab === 'all' || e.status === tab);
  const counts = Object.fromEntries(TABS.map(t => [t, t === 'all' ? enquiries.length : enquiries.filter(e => e.status === t).length]));

  const act = async (id, status) => {
    setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status } : e));
    await supabase.from('enquiries').update({ status }).eq('id', id);
  };

  const remove = async (id) => {
    setEnquiries(prev => prev.filter(e => e.id !== id));
    if (expanded === id) setExpanded(null);
    await supabase.from('enquiries').delete().eq('id', id);
  };

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
        {loading ? (
          <div className="mgmt-empty"><p>Loading enquiries…</p></div>
        ) : filtered.length === 0 ? (
          <div className="mgmt-empty"><p>No enquiries in this category.</p></div>
        ) : (
          <div className="mgmt-table-wrap">
            <table className="mgmt-table">
              <thead>
                <tr><th>Guest</th><th>Dates</th><th>Guests</th><th>Status</th><th>Received</th><th></th></tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <Fragment key={e.id}>
                    <tr className={`mgmt-tr-click ${expanded === e.id ? 'expanded' : ''}`} onClick={() => setExpanded(expanded === e.id ? null : e.id)}>
                      <td><div className="mgmt-td-primary">{e.name}</div><div className="mgmt-td-sub">{e.email}</div></td>
                      <td>{e.check_in} → {e.check_out}</td>
                      <td>{e.guests}</td>
                      <td><span className={`mgmt-status ${e.status}`}>{e.status}</span></td>
                      <td className="mgmt-td-muted">{formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}</td>
                      <td>
                        <div className="mgmt-row-actions" onClick={ev => ev.stopPropagation()}>
                          <button title="Mark replied" onClick={() => act(e.id,'replied')}><Check size={14}/></button>
                          <button title="Archive" onClick={() => act(e.id,'archived')}><Archive size={14}/></button>
                          <button title="Delete" onClick={() => remove(e.id)} className="mgmt-action-danger"><Trash2 size={14}/></button>
                        </div>
                      </td>
                    </tr>
                    {expanded === e.id && (
                      <tr className="mgmt-tr-expanded">
                        <td colSpan={6}>
                          <div className="mgmt-expanded-body">
                            {e.message && <p><strong>Message:</strong> {e.message}</p>}
                            {e.phone && <p><strong>Phone:</strong> {e.phone}</p>}
                            <div className="mgmt-expanded-actions">
                              <a className="mgmt-btn mgmt-btn-primary" href={`mailto:${e.email}?subject=Re: Your enquiry — Home-Office Apartments`}>
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
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
