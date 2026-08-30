import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Save, Check } from 'lucide-react';

const INIT = { nightly: 41, fiveNightDiscount: 10, longStayDiscountPercent: 20, minNights: 1 };

const BLOCKED = [
  { id:1, from:'2026-09-20', to:'2026-09-25', reason:'Family use' },
  { id:2, from:'2026-10-01', to:'2026-10-05', reason:'Maintenance' },
];

export default function AdminRates() {
  const { isOwner } = useOutletContext();
  const [rates, setRates] = useState(INIT);
  const [blocked, setBlocked] = useState(BLOCKED);
  const [saved, setSaved] = useState(false);
  const [newBlock, setNewBlock] = useState({ from:'', to:'', reason:'' });

  const update = (field) => e => setRates(r => ({ ...r, [field]: Number(e.target.value) }));

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const addBlock = () => {
    if (!newBlock.from || !newBlock.to) return;
    setBlocked(prev => [...prev, { id: Date.now(), ...newBlock }]);
    setNewBlock({ from:'', to:'', reason:'' });
  };

  const removeBlock = (id) => setBlocked(prev => prev.filter(b => b.id !== id));

  return (
    <div className="mgmt-page">
      <header className="mgmt-page-head">
        <span className="mgmt-eyebrow">RATES & AVAILABILITY</span>
        <h1>Rates & availability</h1>
        <p className="mgmt-lead">{isOwner ? 'Set pricing and block unavailable dates.' : 'View current rates. Contact the owner to make changes.'}</p>
      </header>

      <div className="mgmt-card" style={{ maxWidth: 420 }}>
        <h2 className="mgmt-card-h">Home-Office Apartments</h2>
        <div className="mgmt-rates-grid">
          {[
            ['nightly', 'Per night ($)'],
            ['fiveNightDiscount', '5-night stay discount ($ off total)'],
            ['longStayDiscountPercent', '28–30 night stay discount (%)'],
            ['minNights', 'Minimum nights'],
          ].map(([field, lbl]) => (
            <label key={field} className="mgmt-rate-field">
              <span>{lbl}</span>
              <input
                type="number"
                value={rates[field]}
                onChange={update(field)}
                disabled={!isOwner}
                min={0}
              />
            </label>
          ))}
        </div>
        <p className="mgmt-card-sub" style={{ marginTop: 12 }}>
          Example: 5 nights = ${rates.nightly * 5} − ${rates.fiveNightDiscount} = $
          {rates.nightly * 5 - rates.fiveNightDiscount}. 30 nights = $
          {Math.round(rates.nightly * 30 * (1 - rates.longStayDiscountPercent / 100))} after the {rates.longStayDiscountPercent}% discount.
        </p>
      </div>

      {isOwner && (
        <div className="mgmt-save-row">
          {saved && <span className="mgmt-save-note"><Check size={14}/> Saved</span>}
          <button className="mgmt-btn mgmt-btn-primary" onClick={save}><Save size={15}/> Save rates</button>
        </div>
      )}

      <section className="mgmt-card" style={{ marginTop: 24 }}>
        <h2 className="mgmt-card-h">Blocked dates</h2>
        <p className="mgmt-card-sub">Dates when the apartment is not available for guests.</p>

        <div className="mgmt-table-wrap">
          <table className="mgmt-table">
            <thead><tr><th>From</th><th>To</th><th>Reason</th>{isOwner && <th></th>}</tr></thead>
            <tbody>
              {blocked.map(b => (
                <tr key={b.id}>
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
