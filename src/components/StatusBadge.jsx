import { CheckCircle2, Clock, XCircle, Archive, Sparkles, MessageCircle, CalendarClock, UserCheck } from 'lucide-react';

/**
 * StatusBadge — one consistent icon+color pill for every status this
 * project shows, instead of each page inventing its own raw-text
 * class (`mgmt-status ${status}`, `dash-status ${status}`, or the old
 * compound "Booked · REF (status)" text blob in AdminEnquiries). Same
 * component, same visual language, everywhere a booking or enquiry
 * status appears: AdminBookings, AdminEnquiries, the guest dashboard.
 *
 * `status` should be a raw enum value from `bookings.status` or
 * `enquiries.status` — unrecognized values (e.g. a future status this
 * hasn't been taught yet) still render sanely via the fallback below
 * instead of disappearing or throwing.
 */

const STATUS_META = {
  // bookings.status
  confirmed: { label: 'Confirmed', icon: CheckCircle2, tone: 'good' },
  awaiting_payment: { label: 'Awaiting payment', icon: Clock, tone: 'warn' },
  pending: { label: 'Pending', icon: Clock, tone: 'warn' },
  completed: { label: 'Completed', icon: Archive, tone: 'neutral' },
  cancelled: { label: 'Cancelled', icon: XCircle, tone: 'bad' },
  // enquiries.status
  new: { label: 'New', icon: Sparkles, tone: 'info' },
  replied: { label: 'Replied', icon: MessageCircle, tone: 'good' },
  archived: { label: 'Archived', icon: Archive, tone: 'neutral' },
  declined: { label: 'Declined', icon: XCircle, tone: 'bad' },
  // external_calendar_blocks (Airbnb) — not a real status, just a tag.
  // Airbnb's calendar export never tells us when a guest actually
  // checks out; "checked_in"/derived "completed" below are inferred
  // purely from today's date vs. the block's own start/end, same as
  // the row-highlighting in AdminBookings.jsx.
  reserved: { label: 'Reserved', icon: CalendarClock, tone: 'airbnb' },
  checked_in: { label: 'Checked in', icon: UserCheck, tone: 'good' },
};

export default function StatusBadge({ status, label, tone, size = 11 }) {
  const meta = STATUS_META[status] || { label: label || status || '—', icon: Clock, tone: tone || 'neutral' };
  const Icon = meta.icon;
  return (
    <span className={`status-badge status-badge-${tone || meta.tone}`}>
      <span className="status-badge-icon"><Icon size={size} /></span>
      {label || meta.label}
    </span>
  );
}
