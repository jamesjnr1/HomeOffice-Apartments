import { useEffect, useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { apartmentName } from '../../lib/apartments';

/**
 * DeleteBookingDialog — the only way to permanently delete a site
 * booking from the admin console. Shows what's being deleted and what
 * that means, and the Delete button stays disabled until the admin
 * types the booking's reference, so a mis-click can't remove one.
 * RLS (bookings_admin_delete) limits the delete to owners/managers.
 * Deleting frees the dates on the site and in the calendar exported to
 * Airbnb, removes any review linked to the booking (reviews cascade)
 * and unlinks its enquiry. It does NOT refund a payment.
 */
export default function DeleteBookingDialog({ booking: b, onClose, onDeleted }) {
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const paid = b.status === 'confirmed' || b.status === 'completed';
  const matches = typed.trim().toUpperCase() === String(b.reference).toUpperCase();

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape' && !deleting) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deleting, onClose]);

  const remove = async () => {
    if (!matches || deleting) return;
    setDeleting(true);
    setError('');
    const { data, error: err } = await supabase.from('bookings').delete().eq('id', b.id).select('id');
    if (err || !data?.length) {
      setDeleting(false);
      setError(err ? "Couldn't delete this booking. Please try again." : "This booking couldn't be deleted — you may not have permission, or it was already removed.");
      return;
    }
    onDeleted();
  };

  return (
    <div className="mgmt-dialog-backdrop" onClick={() => !deleting && onClose()}>
      <div className="mgmt-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-booking-title" onClick={(e) => e.stopPropagation()}>
        <div className="mgmt-dialog-icon"><AlertTriangle size={22} /></div>
        <h2 id="delete-booking-title">Delete booking {b.reference}?</h2>
        <p className="mgmt-dialog-lead">This permanently removes the booking. It can't be undone.</p>

        <dl className="mgmt-dialog-details">
          <div><dt>Guest</dt><dd>{b.guest_name || '—'}</dd></div>
          <div><dt>Apartment</dt><dd>{apartmentName(b.apartment)}</dd></div>
          <div><dt>Dates</dt><dd>{format(parseISO(b.check_in), 'd MMM')} → {format(parseISO(b.check_out), 'd MMM yyyy')}</dd></div>
          <div><dt>Total</dt><dd>GHS {Number(b.total).toLocaleString()} · {b.status.replace('_', ' ')}</dd></div>
        </dl>

        <ul className="mgmt-dialog-notes">
          {paid && <li><strong>This booking is paid.</strong> Deleting it does not refund the guest — refund them in Paystack (or in person) first.</li>}
          <li>The dates become available to book again, on the site and on Airbnb.</li>
          <li>The guest isn't notified, and any review linked to this stay is deleted too.</li>
        </ul>

        <label className="mgmt-dialog-confirm">
          Type <strong>{b.reference}</strong> to confirm
          <input
            ref={inputRef}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') remove(); }}
            placeholder={b.reference}
            autoComplete="off"
            spellCheck={false}
          />
        </label>

        {error && <p className="mgmt-dialog-error">{error}</p>}

        <div className="mgmt-dialog-actions">
          <button type="button" className="mgmt-btn mgmt-btn-outline" onClick={onClose} disabled={deleting}>Cancel</button>
          <button type="button" className="mgmt-btn mgmt-btn-danger" onClick={remove} disabled={!matches || deleting}>
            {deleting ? 'Deleting…' : 'Delete booking'}
          </button>
        </div>
      </div>
    </div>
  );
}
