import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/**
 * PaymentComplete — where Paystack sends the guest after checkout
 * (callback_url in book-and-pay and paystack-init; Paystack appends
 * ?reference=…). Asks paystack-reconcile to check that checkout with
 * Paystack and confirm the booking right away, so the guest — signed in
 * or not — sees the real result instead of "awaiting payment". If the
 * check can't finish here, the scheduled reconcile still confirms the
 * booking within a minute or two.
 */
export default function PaymentComplete() {
  const [params] = useSearchParams();
  const reference = params.get('reference') || params.get('trxref');
  const [state, setState] = useState(reference ? 'checking' : 'unknown');
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    if (!reference) return undefined;
    let cancelled = false;
    let tries = 0;
    // Paystack can take a few seconds to mark a mobile-money payment as
    // successful, so check a few times before giving up.
    const check = async () => {
      tries += 1;
      try {
        const { data } = await supabase.functions.invoke('paystack-reconcile', { body: { reference } });
        if (cancelled) return;
        if (data?.paid) { setBooking(data.booking); setState('paid'); return; }
      } catch { /* retried below */ }
      if (cancelled) return;
      if (tries < 4) setTimeout(check, 4000);
      else setState('pending');
    };
    check();
    return () => { cancelled = true; };
  }, [reference]);

  const content = {
    checking: {
      eyebrow: 'One moment',
      title: 'Checking your payment…',
      text: 'This only takes a few seconds.',
    },
    paid: {
      eyebrow: 'Payment received',
      title: 'Your stay is confirmed.',
      text: `Thank you! ${booking ? `Booking ${booking} is` : 'Your booking is'} confirmed and a receipt is on its way to your email.`,
    },
    pending: {
      eyebrow: 'Almost there',
      title: "We're still confirming your payment.",
      text: "If you completed payment, your booking will be confirmed automatically within a couple of minutes and you'll get an email. If you didn't finish checking out, you can pay from your dashboard.",
    },
    unknown: {
      eyebrow: 'Payment',
      title: 'Thanks for booking with us.',
      text: 'Your booking status is always up to date in your dashboard.',
    },
  }[state];

  return (
    <section className="page-header" style={{ textAlign: 'center' }}>
      <div className="container">
        <p className="eyebrow">{content.eyebrow}</p>
        <h1>{content.title}</h1>
        <p className="lead" style={{ margin: '0 auto 32px' }}>{content.text}</p>
        {state !== 'checking' && (
          <Link to="/dashboard" className="btn btn-primary btn-lg">Go to my dashboard</Link>
        )}
      </div>
    </section>
  );
}
