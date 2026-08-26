import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Save, Check } from 'lucide-react';

const INIT = {
  verandah: { nightly: 620, weekly: 3600, monthly: 12000, minNights: 2 },
  garden:   { nightly: 480, weekly: 2800, monthly: 9500,  minNights: 1 },
};

const BLOCKED = [
  { id:1, apt:'verandah', from:'2026-09-20', to:'2026-09-25', reason:'Family use' },
  { id:2, apt:'garden', from:'2026-10-01', to:'2026-10-05', reason:'Maintenance' },
];

export default function AdminRates() {
  const { isOwner } = useOutletContext();
  const [rates, setRates] = useState(INIT);
  const [blocked, setBlocked] = useState(BLOCKED);
  const [saved, setSaved] = useState(false);
  const [newBlock, setNewBlock] = useState({ apt:'verandah', from:'', to:'', reason:'' });

  const update = (apt, field) => e => setRates(r => ({ ...r, [apt]: { ...r[apt], [field]: Number(e.target.value) } }));

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const addBlock = () => {
    if (!newBlock.from || !newBlock.to) return;
    setBlocked(prev => [...prev, { id: Date.now(), ...newBlock }]);
    setNewBlock({ apt:'verandah', from:'', to:'', reason:'' });
  };

  const removeBlock = (id) => setBlocked(prev => prev.filter(b => b.id !== id));

  return (
    <div className="mgmt-page">
      <header className="mgmt-page-head">
        <span className="mgmt-eyebrow">RATES & AVAILABILITY</span>
        <h1>Rates & availability</h1>
        <p className="mgmt-lead">{isOwner ? 'Set per-apartment pricing and block unavailable dates.' : 'View current rates. Contact the owner to make changes.'}</p>
      </header>

      <div className="mgmt-two-col">
        {[['verandah','The Verandah Apartment'],['garden','The Garden Apartment']].map(([key, label]) => (
          <div key={key} className="mgmt-card">
            <h2 className="mgmt-card-h">{label}</h2>
            <div className="mgmt-rates-grid">
              {[['nightly','Per night (GHS)'],['weekly','Per week (GHS)'],['monthly','Per month (GHS)'],['minNights','Minimum nights']].map(([field, lbl]) => (
                <label key={field} className="mgmt-rate-field">
                  <span>{lbl}</span>
                  <input
                    type="number"
                    value={rates[key][field]}
                    onChange={update(key, field)}
                    disabled={!isOwner}
                    min={0}
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {isOwner && (
        <div className="mgmt-save-row">
          {saved && <span className="mgmt-save-note"><Check size={14}/> Saved</span>}
          <button className="mgmt-btn mgmt-btn-primary" onClick={save}><Save size={15}/> Save rates</button>
        </div>
      )}

      <section className="mgmt-card" style={{ marginTop: 24 }}>
        <h2 className="mgmt-card-h">Blocked dates</h2>
        <p className="mgmt-card-sub">Dates when neither apartment is available for guests.</p>

        <div className="mgmt-table-wrap">
          <table className="mgmt-table">
            <thead><tr><th>Apartment</th><th>From</th><th>To</th><th>Reason</th>{isOwner && <th></th>}</tr></thead>
            <tbody>
              {blocked.map(b => (
                <tr key={b.id}>
                  <td>{b.apt === 'verandah' ? 'Verandah' : 'Garden'}</td>
                  <td>{b.from}</td><td>{b.to}</td>
                  <td className="mgmt-td-muted">{b.reason || '—'}</td>
                  {isOwner && <td><button className="mgmt-row-del" onClick={() => removeBlock(b.id)}>Remove</button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isOwner && (
          <div className="mgmt-block-form">
            <h3>Block new dates</h3>
            <div className="mgmt-block-row">
              <select value={newBlock.apt} onChange={e => setNewBlock(n => ({ ...n, apt: e.target.value }))}>
                <option value="verandah">Verandah</option>
                <option value="garden">Garden</option>
              </select>
              <input type="date" value={newBlock.from} onChange={e => setNewBlock(n => ({ ...n, from: e.target.value }))}/>
              <input type="date" value={newBlock.to} onChange={e => setNewBlock(n => ({ ...n, to: e.target.value }))}/>
              <input type="text" placeholder="Reason (optional)" value={newBlock.reason} onChange={e => setNewBlock(n => ({ ...n, reason: e.target.value }))}/>
              <button className="mgmt-btn mgmt-btn-primary" onClick={addBlock}>Block</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
