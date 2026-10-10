import Link from 'next/link';
import { Instagram, Mail, Phone, MapPin } from 'lucide-react';
import Brand from './Brand';

const colHead = 'mb-5 text-[11px] font-medium uppercase tracking-[0.22em] text-ivory/45';
const colLink = 'flex items-center gap-2 py-1.5 text-[14.5px] text-ivory/75 transition-colors duration-300 hover:text-ivory';

export default function Footer() {
  return (
    <footer className="bg-forest-deep text-ivory">
      <div className="mx-auto max-w-[1320px] px-5 pb-10 pt-20 sm:px-8">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
          <div>
            <Link href="/" aria-label="Home-Office Apartments home">
              <Brand tone="light" />
            </Link>
            <p className="mt-6 max-w-xs font-display text-[19px] font-light leading-snug text-ivory/80">
              A quiet stay for the way you work and live. Sunyani, Ghana.
            </p>
          </div>

          <div>
            <h5 className={colHead}>Visit</h5>
            <Link href="/" className={colLink}>Home</Link>
            <Link href="/apartments" className={colLink}>Apartments</Link>
            <Link href="/gallery" className={colLink}>Gallery</Link>
            <Link href="/about" className={colLink}>About</Link>
          </div>

          <div>
            <h5 className={colHead}>Guests</h5>
            <Link href="/book" className={colLink}>Book a stay</Link>
            <Link href="/signin" className={colLink}>Sign in</Link>
            <Link href="/signup" className={colLink}>Create account</Link>
            <Link href="/dashboard" className={colLink}>Guest dashboard</Link>
          </div>

          <div>
            <h5 className={colHead}>Contact</h5>
            <a href="mailto:jamesd@home-officegroup.com" className={colLink}>
              <Mail size={14} strokeWidth={1.5} /> jamesd@home-officegroup.com
            </a>
            <a href="tel:+233206301032" className={colLink}>
              <Phone size={14} strokeWidth={1.5} /> +233 20 630 1032
            </a>
            <a href="tel:+233549624125" className={colLink}>
              <Phone size={14} strokeWidth={1.5} /> +233 54 962 4125
            </a>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Fiapre%2C+Sunyani%2C+Ghana"
              target="_blank"
              rel="noopener noreferrer"
              className={colLink}
            >
              <MapPin size={14} strokeWidth={1.5} /> Fiapre, Sunyani
            </a>
            <a href="#" className={colLink} aria-label="Instagram">
              <Instagram size={14} strokeWidth={1.5} /> Instagram
            </a>
          </div>
        </div>

        <div className="mt-16 border-t border-ivory/10 pt-6 text-[12.5px] text-ivory/45">
          © {new Date().getFullYear()} Home-Office Apartments and LivingSpring Gardens
        </div>
      </div>
    </footer>
  );
}
