import { format, parseISO } from 'date-fns';

// "Staying now" is worked out from the dates, not stored: a PAID booking
// (confirmed / completed) whose check-in day has come and whose
// check-out day hasn't passed. The check-out day itself still counts —
// the guest is in until they leave that day. Ghana is on UTC, so the
// UTC date is the local date.
export const todayStr = () => new Date().toISOString().slice(0, 10);

const PAID = ['confirmed', 'completed'];

export function isStayingNow(b, today = todayStr()) {
  return PAID.includes(b.status) && b.check_in <= today && b.check_out >= today;
}

// "Checked in · leaves Mon 19 Oct" / "Checked in · leaves today"
export function stayingLabel(b, today = todayStr()) {
  if (b.check_out === today) return 'Checked in · leaves today';
  return `Checked in · leaves ${format(parseISO(b.check_out), 'EEE d MMM')}`;
}
