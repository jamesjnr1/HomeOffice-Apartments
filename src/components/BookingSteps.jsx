import { Check } from 'lucide-react';

/**
 * BookingSteps — the stages of booking a stay, shown at the top of the
 * Book page so a guest always knows where they are and what's left.
 * `current` is the index of the step in progress; steps before it show
 * as done.
 */
export const BOOKING_STEPS = [
  { title: 'Dates & apartment', text: 'Pick an apartment and your check-in / check-out dates.' },
  { title: 'Your details', text: 'Name, email and phone so we can reach you.' },
  { title: 'Review the price', text: 'See the nights, any discount and the exact total.' },
  { title: 'Pay securely', text: 'Card or Mobile Money via Paystack.' },
  { title: 'Confirmed', text: 'Your stay is locked in — see it in your dashboard.' },
];

export default function BookingSteps({ current = 0 }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-5 sm:gap-0" aria-label="Booking steps">
      {BOOKING_STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li
            key={step.title}
            className="relative flex gap-3 sm:flex-col sm:gap-0 sm:pr-4"
            aria-current={active ? 'step' : undefined}
          >
            {/* connector line (desktop) */}
            {i < BOOKING_STEPS.length - 1 && (
              <span
                className={`absolute left-9 right-0 top-[17px] hidden h-px sm:block ${done ? 'bg-accent' : 'bg-stone'}`}
                aria-hidden="true"
              />
            )}
            <span
              className={`relative z-10 flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border text-[13px] font-medium transition-colors duration-300 ${
                done
                  ? 'border-accent bg-accent text-ivory'
                  : active
                    ? 'border-forest bg-forest text-ivory shadow-[0_0_0_5px_rgba(45,106,79,0.12)]'
                    : 'border-stone bg-paper text-muted'
              }`}
            >
              {done ? <Check size={15} strokeWidth={2.25} /> : i + 1}
            </span>
            <span className="sm:mt-4">
              <span className={`block text-[14px] font-medium ${active || done ? 'text-ink' : 'text-muted'}`}>{step.title}</span>
              <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">{step.text}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
