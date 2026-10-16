import { Check } from 'lucide-react';

/**
 * BookingSteps — the stages of booking a stay, shown at the top of the
 * Book page so a guest always knows where they are and what's left.
 * `current` is the index of the step in progress; earlier steps show
 * as done.
 */
export const BOOKING_STEPS = [
  { title: 'Dates & apartment', text: 'Pick an apartment and your dates.' },
  { title: 'Your details', text: 'Name, email and phone.' },
  { title: 'Review the price', text: 'Nights, any discount, exact total.' },
  { title: 'Pay securely', text: 'Card or Mobile Money via Paystack.' },
  { title: 'Confirmed', text: 'See it in your dashboard.' },
];

export default function BookingSteps({ current = 0 }) {
  return (
    <ol className="booking-steps" aria-label="Booking steps">
      {BOOKING_STEPS.map((step, i) => {
        const state = i < current ? 'done' : i === current ? 'active' : 'todo';
        return (
          <li key={step.title} className={`booking-step is-${state}`} aria-current={state === 'active' ? 'step' : undefined}>
            <span className="booking-step-dot">{state === 'done' ? <Check size={14} strokeWidth={2.5} /> : i + 1}</span>
            <span className="booking-step-text">
              <strong>{step.title}</strong>
              <span>{step.text}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
