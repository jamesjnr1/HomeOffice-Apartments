import { format } from 'date-fns';
import { X, Printer } from 'lucide-react';

/**
 * Receipt — a printable booking receipt, used from the guest dashboard
 * (Bookings → Receipt) and the admin dashboard (Bookings → Receipt).
 *
 * Renders as a modal on screen. Clicking "Print / Save as PDF" calls
 * window.print(); print.css (in globals.css, "RECEIPT / PRINT
 * TEMPLATE" section) hides everything on the page except
 * .receipt-printable, so the browser's print dialog — including
 * "Save as PDF" — produces a clean, single-page receipt.
 *
 * Expected `booking` shape:
 *   { reference, checkIn: Date, checkOut: Date, nights, guests, total, status }
 * `guestName` / `guestEmail` are optional — omitted lines are skipped.
 */
export default function Receipt({ booking, guestName, guestEmail, onClose }) {
  if (!booking) return null;
  const b = booking;
  const issuedAt = new Date();

  return (
    <div className="receipt-overlay" onClick={onClose}>
      <div className="receipt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="receipt-toolbar">
          <button className="receipt-btn receipt-btn-primary" onClick={() => window.print()}>
            <Printer size={15} /> Print / Save as PDF
          </button>
          <button className="receipt-btn receipt-btn-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="receipt-printable">
          <header className="receipt-head">
            <div className="receipt-brand">
              <span className="receipt-brand-primary">Home-Office Apartments</span>
              <span className="receipt-brand-sub">
                and Living<span className="receipt-accent">Spring</span> Gardens
              </span>
              <span className="receipt-brand-addr">Sunyani, Bono Region, Ghana</span>
            </div>
            <div className="receipt-title-block">
              <span className="receipt-title">RECEIPT</span>
              <span className="receipt-issued">Issued {format(issuedAt, 'd MMM yyyy')}</span>
            </div>
          </header>

          <div className="receipt-divider" />

          <div className="receipt-meta-grid">
            <div>
              <span className="receipt-label">Reference</span>
              <span className="receipt-value receipt-mono">{b.reference}</span>
            </div>
            <div>
              <span className="receipt-label">Status</span>
              <span className="receipt-value">{formatStatus(b.status)}</span>
            </div>
            {guestName && (
              <div>
                <span className="receipt-label">Guest</span>
                <span className="receipt-value">{guestName}</span>
              </div>
            )}
            {guestEmail && (
              <div>
                <span className="receipt-label">Email</span>
                <span className="receipt-value">{guestEmail}</span>
              </div>
            )}
          </div>

          <div className="receipt-divider" />

          <table className="receipt-table">
            <thead>
              <tr><th>Stay</th><th>Details</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Check-in</td>
                <td>{format(b.checkIn, 'EEE, d MMM yyyy')}</td>
              </tr>
              <tr>
                <td>Check-out</td>
                <td>{format(b.checkOut, 'EEE, d MMM yyyy')}</td>
              </tr>
              <tr>
                <td>Nights</td>
                <td>{b.nights}</td>
              </tr>
              <tr>
                <td>Guests</td>
                <td>{b.guests}</td>
              </tr>
            </tbody>
          </table>

          <div className="receipt-total-row">
            <span>Total paid</span>
            <span className="receipt-total-value">GHS {Number(b.total).toLocaleString()}</span>
          </div>

          <div className="receipt-divider" />

          <footer className="receipt-foot">
            <p>Thank you for staying with us.</p>
            <p className="receipt-foot-contact">
              jamesduah@gmail.com · +233 20 630 1032 · +233 54 962 4125
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}

function formatStatus(status) {
  const map = {
    CONFIRMED: 'Confirmed', confirmed: 'Confirmed',
    PENDING: 'Pending', pending: 'Pending',
    COMPLETED: 'Completed', completed: 'Completed',
    CANCELLED: 'Cancelled', cancelled: 'Cancelled',
  };
  return map[status] || status || '—';
}
