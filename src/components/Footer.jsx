import { Link } from 'react-router-dom';
import { Instagram, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand-col">
            <Link to="/" className="brand">
              <span className="brand-primary">Home-Office Apartments</span>
              <span className="brand-sub">
                and Living<span className="brand-accent">Spring</span> Gardens
              </span>
            </Link>
            <p className="footer-tag">
              A quiet stay for the way you work and live. Sunyani, Ghana.
            </p>
          </div>

          <div className="footer-col">
            <h5>Visit</h5>
            <Link to="/">Home</Link>
            <Link to="/apartments">Apartments</Link>
            <Link to="/gallery">Gallery</Link>
            <Link to="/about">About</Link>
          </div>

          <div className="footer-col">
            <h5>Guests</h5>
            <Link to="/book">Book a stay</Link>
            <Link to="/signin">Sign in</Link>
            <Link to="/signup">Create account</Link>
            <Link to="/dashboard">Guest dashboard</Link>
          </div>

          <div className="footer-col">
            <h5>Contact</h5>
            <a href="mailto:hello@homeoffice.gh">
              <Mail size={14} /> hello@homeoffice.gh
            </a>
            <a href="tel:+233000000000">
              <Phone size={14} /> +233 00 000 0000
            </a>
            <span className="footer-loc">
              <MapPin size={14} /> Sunyani, Bono Region, Ghana
            </span>
            <a href="#" className="footer-social" aria-label="Instagram">
              <Instagram size={14} /> Instagram
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <div>© {new Date().getFullYear()} Home-Office Apartments and LivingSpring Gardens</div>
          <div>Built with care in Ghana</div>
        </div>
      </div>
    </footer>
  );
}
