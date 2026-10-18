import { useCallback, useEffect, useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { AlertTriangle, CreditCard } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { apartmentName } from '../../lib/apartments';
import { startPayment, syncPayment } from '../../lib/payBooking';

/**
 * PaymentDueBanner — shown at the top of every dashboard page while
 * the guest has an approved stay that isn't paid yet. The amount is
 * the booking's stored total, i.e. exactly what the admin confirmed.
 * Dates aren't held until payment (awaiting_payment rows don't block
 * the calendar), so this is deliberately loud. It disappears on its
 * own once Paystack's webhook flips the booking to `confirmed`.
 */
export default function PaymentDueBanner({ userId }) {
  const [due, setDue] = useState([]);
  // Bookings already checked with Paystack this visit (see below).
  const checked = useRef(new Set());

  const load = useCallback(async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const { data } = await supabase
      .from('bookings')
      .select('id, reference, apartment, check_in, check_out, total, status, paystack_reference')
      .eq('guest_id', userId)
      .eq('status', 'awaiting_payment')
      .gte('check_in', today)
      .order('check_in', { ascending: true });
    setDue(data || []);

    // A booking that has had a checkout started may already be paid
    // even if Paystack's webhook hasn't reached us — ask the server to
    // check with Paystack directly (once per booking per visit). If it
    // was paid, the booking is confirmed and the realtime update below
    // reloads this list, so the alert disappears by itself.
    for (const b of data || []) {
      if (!b.paystack_reference || checked.current.has(b.id)) continue;
      checked.current.add(b.id);
      syncPayment(b.id).then((paid) => { if (paid) load(); });
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return undefined;
    load();
    const sub = supabase
      .channel(`guest-payment-due-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `guest_id=eq.${userId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [userId, load]);

  if (due.length === 0) return null;

  return (
    <div className="dash-paydue-stack">
      {due.map((b) => <PaymentDueCard key={b.id} booking={b} />)}
    </div>
  );
}

function PaymentDueCard({ booking: b }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const amount = `GHS ${Number(b.total).toLocaleString()}`;

  const pay = async () => {
    setError('');
    setLoading(true);
    const message = await startPayment(b.id);
    if (message) { setError(message); setLoading(false); }
  };

  return (
    <section className="dash-paydue" role="alert">
      <div className="dash-paydue-icon"><AlertTriangle size={20} /></div>
      <div className="dash-paydue-body">
        <strong>Payment needed to confirm your stay</strong>
        <p>
          {apartmentName(b.apartment)} · {format(parseISO(b.check_in), 'd MMM')} → {format(parseISO(b.check_out), 'd MMM yyyy')} · Ref {b.reference}.
          {' '}Your dates are not held until you pay.
        </p>
        {error && <p className="dash-paydue-error">{error}</p>}
      </div>
      <button className="dash-paydue-btn" onClick={pay} disabled={loading}>
        <CreditCard size={16} /> {loading ? 'Opening checkout…' : `Pay ${amount}`}
      </button>
    </section>
  );
}
