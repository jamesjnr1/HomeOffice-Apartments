import { useEffect, useState } from 'react'
import { BrowserRouter, Link, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Bath, BedDouble, CalendarDays, Car, Check, ChevronLeft, ChevronRight,
  Droplet, Mail, MapPin, Menu, Phone, Refrigerator, ShieldCheck, ShowerHead, Star, Tv, User,
  Users, Volume2, Wifi, Wind, X, WashingMachine,
} from 'lucide-react'
import { supabase } from './lib/supabase'
import { property } from './lib/data'
import './styles.css'

const amenityIcons = {
  'Air conditioning': Wind,
  'Free Wi-Fi': Wifi,
  'Fully equipped kitchen': Refrigerator,
  'Private parking': Car,
  '24/7 security': ShieldCheck,
  'Hot shower': ShowerHead,
  'Smart TV': Tv,
  'Refrigerator': Refrigerator,
  'Washing machine': WashingMachine,
  'Garden view': MapPin,
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll)
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => { window.removeEventListener('scroll', onScroll); listener.subscription.unsubscribe() }
  }, [])

  const isHome = location.pathname === '/'
  async function signOut() { await supabase.auth.signOut(); navigate('/') }

  return <>
    <header className={`navbar ${(!isHome || scrolled) ? 'scrolled' : ''}`}>
      <div className="container nav-inner">
        <Link to="/" className="brand"><span className="brand-mark">L</span> LivingSpring</Link>
        <nav className="nav-links">
          <Link to="/">Home</Link>
          <a href={isHome ? '#about' : '/#about'}>About</a>
          <a href={isHome ? '#gallery' : '/#gallery'}>Gallery</a>
          <a href={isHome ? '#amenities' : '/#amenities'}>Amenities</a>
          <a href={isHome ? '#reviews' : '/#reviews'}>Reviews</a>
          <a href={isHome ? '#contact' : '/#contact'}>Contact</a>
        </nav>
        <div className="nav-actions">
          <Link className="nav-cta" to="/booking">Book your stay</Link>
          {session ? (
            <button className="nav-cta" onClick={signOut} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <User size={14} /> Sign out
            </button>
          ) : (
            <Link className="nav-cta" to="/auth" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <User size={14} /> Sign in
            </Link>
          )}
          <button className="menu-button" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={22} /></button>
        </div>
      </div>
    </header>
    {menuOpen && (
      <div className="mobile-menu open">
        <button className="close-btn" onClick={() => setMenuOpen(false)}><X size={26} /></button>
        <nav>
          <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
          <a href="/#about" onClick={() => setMenuOpen(false)}>About</a>
          <a href="/#gallery" onClick={() => setMenuOpen(false)}>Gallery</a>
          <a href="/#amenities" onClick={() => setMenuOpen(false)}>Amenities</a>
          <a href="/#reviews" onClick={() => setMenuOpen(false)}>Reviews</a>
          <a href="/#contact" onClick={() => setMenuOpen(false)}>Contact</a>
          <Link to="/booking" onClick={() => setMenuOpen(false)}>Book your stay</Link>
          <Link to="/auth" onClick={() => setMenuOpen(false)}>Sign in</Link>
        </nav>
      </div>
    )}
  </>
}

function Footer() {
  return <footer className="footer"><div className="container">
    <div className="footer-grid">
      <div>
        <Link to="/" className="brand"><span className="brand-mark">L</span> LivingSpring</Link>
        <p className="footer-description">A peaceful, comfortable apartment in Sunyani, Ghana — your home away from home in the garden city of the Bono Region.</p>
      </div>
      <div>
        <h4>Explore</h4>
        <a href="/#about">About the apartment</a>
        <a href="/#gallery">Photo gallery</a>
        <a href="/#amenities">Amenities</a>
        <a href="/#reviews">Guest reviews</a>
      </div>
      <div>
        <h4>Get in touch</h4>
        <a href={`tel:${property.contact.phone}`}>{property.contact.phone}</a>
        <a href={`mailto:${property.contact.email}`}>{property.contact.email}</a>
        <a href="/#contact">{property.address}</a>
      </div>
    </div>
    <div className="footer-bottom">
      <span>© 2026 LivingSpring Apartments, Sunyani, Ghana.</span>
      <span>Privacy · Terms</span>
    </div>
  </div></footer>
}

function Hero() {
  const navigate = useNavigate()
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState('2')

  function submit(e) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (checkIn) params.set('checkin', checkIn)
    if (checkOut) params.set('checkout', checkOut)
    params.set('guests', guests)
    navigate(`/booking?${params.toString()}`)
  }

  return <section className="hero">
    <img className="hero-image" src={property.heroImage} alt="LivingSpring Apartments living room" />
    <div className="container hero-content">
      <div className="hero-copy">
        <span className="eyebrow" style={{ color: '#9ed4b3' }}>Sunyani, Ghana</span>
        <h1>A peaceful home<br />in the garden city.</h1>
        <p>{property.shortDesc} Comfortable, clean, and ready to welcome you.</p>
        <form className="search-panel" onSubmit={submit}>
          <div className="search-field">
            <label>Check-in</label>
            <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} required />
          </div>
          <div className="search-field">
            <label>Check-out</label>
            <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} required />
          </div>
          <button className="search-button" type="submit">Check availability</button>
        </form>
      </div>
    </div>
  </section>
}

function About() {
  return <section className="section" id="about">
    <div className="container about-grid">
      <div>
        <span className="eyebrow">Welcome to LivingSpring</span>
        <h2>Your home away<br />from home in Sunyani.</h2>
        <p>{property.description}</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <Link to="/booking" className="button primary-button">Book your stay <ArrowRight size={15} /></Link>
          <a href="#gallery" className="button outline-button">View gallery</a>
        </div>
      </div>
      <div className="about-image">
        <img src={property.gallery[2]} alt="Living room interior" />
      </div>
    </div>
  </section>
}

function Gallery() {
  const [lightbox, setLightbox] = useState(null)
  return <section className="section" id="gallery" style={{ paddingTop: 0 }}>
    <div className="container">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Take a look around</span>
          <h2>Photo gallery</h2>
        </div>
        <p>Every corner of the apartment is designed for comfort and ease.</p>
      </div>
      <div className="gallery-grid">
        {property.gallery.map((img, i) => (
          <img key={img} src={img} alt={`LivingSpring Apartments view ${i + 1}`} onClick={() => setLightbox(i)} style={{ cursor: 'pointer' }} />
        ))}
      </div>
    </div>
    {lightbox !== null && (
      <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,.9)', display: 'grid', placeItems: 'center', padding: 20 }} onClick={() => setLightbox(null)}>
        <button style={{ position: 'absolute', top: 20, right: 20, border: 0, background: 'none', color: 'white' }} onClick={() => setLightbox(null)}><X size={28} /></button>
        <button style={{ position: 'absolute', left: 20, border: 0, background: 'none', color: 'white' }} onClick={(e) => { e.stopPropagation(); setLightbox((lightbox - 1 + property.gallery.length) % property.gallery.length) }}><ChevronLeft size={36} /></button>
        <img src={property.gallery[lightbox]} alt="Gallery view" style={{ maxWidth: '90%', maxHeight: '85vh', borderRadius: 10 }} onClick={e => e.stopPropagation()} />
        <button style={{ position: 'absolute', right: 20, border: 0, background: 'none', color: 'white' }} onClick={(e) => { e.stopPropagation(); setLightbox((lightbox + 1) % property.gallery.length) }}><ChevronRight size={36} /></button>
      </div>
    )}
  </section>
}

function Amenities() {
  return <section className="section" id="amenities" style={{ background: 'var(--sand)' }}>
    <div className="container">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Everything you need</span>
          <h2>Amenities & features</h2>
        </div>
        <p>Thoughtfully equipped to make your stay comfortable and stress-free.</p>
      </div>
      <div className="amenities-grid">
        {property.amenities.map(a => {
          const Icon = amenityIcons[a] || Check
          return <div className="amenity-card" key={a}>
            <Icon size={26} />
            <span>{a}</span>
          </div>
        })}
      </div>
    </div>
  </section>
}

function Reviews() {
  return <section className="section" id="reviews">
    <div className="container">
      <div className="section-heading">
        <div>
          <span className="eyebrow">What guests say</span>
          <h2>Guest reviews</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Star size={20} fill="var(--gold)" color="var(--gold)" />
          <strong style={{ fontSize: 18 }}>5.0</strong>
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>· {property.reviews.length} reviews</span>
        </div>
      </div>
      <div className="reviews-grid">
        {property.reviews.map((r, i) => (
          <div className="review-card" key={i}>
            <div className="review-stars">
              {Array.from({ length: r.rating }).map((_, j) => <Star key={j} size={14} />)}
            </div>
            <p>"{r.text}"</p>
            <div className="review-author">
              <strong>{r.name}</strong>
              <span>· {r.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
}

function Contact() {
  const [sent, setSent] = useState(false)
  return <section className="contact-section" id="contact">
    <div className="container contact-grid">
      <div>
        <span className="eyebrow" style={{ color: '#9ed4b3' }}>Get in touch</span>
        <h2>Ready to book your stay?</h2>
        <p>Send us a message or call directly. We'll get back to you quickly to confirm your dates.</p>
        <ul className="contact-list">
          <li>
            <Phone size={20} />
            <div><strong>Phone</strong><span>{property.contact.phone}</span></div>
          </li>
          <li>
            <Mail size={20} />
            <div><strong>Email</strong><span>{property.contact.email}</span></div>
          </li>
          <li>
            <MapPin size={20} />
            <div><strong>Address</strong><span>{property.address}</span></div>
          </li>
        </ul>
      </div>
      <form className="contact-form" onSubmit={e => { e.preventDefault(); setSent(true) }}>
        {sent ? (
          <div style={{ textAlign: 'center', padding: 30 }}>
            <Check size={40} color="var(--spring)" />
            <h3 style={{ margin: '16px 0 8px', fontSize: 18 }}>Message sent!</h3>
            <p style={{ color: '#b8d4c5', fontSize: 13 }}>Thank you for reaching out. We'll be in touch shortly.</p>
          </div>
        ) : (
          <>
            <div className="form-group">
              <label>Your name</label>
              <input required placeholder="Full name" />
            </div>
            <div className="form-group">
              <label>Email or phone</label>
              <input required placeholder="How can we reach you?" />
            </div>
            <div className="form-group">
              <label>Message</label>
              <textarea required rows="4" placeholder="Tell us your dates and any questions..." style={{ resize: 'vertical' }} />
            </div>
            <button className="button primary-button full-button" type="submit">Send message <ArrowRight size={15} /></button>
          </>
        )}
      </form>
    </div>
  </section>
}

function HomePage() {
  return <div>
    <Navbar />
    <Hero />
    <About />
    <Gallery />
    <Amenities />
    <Reviews />
    <Contact />
    <Footer />
  </div>
}

function BookingPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const params = new URLSearchParams(location.search)
  const [step, setStep] = useState(1)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({
    checkin: params.get('checkin') || '',
    checkout: params.get('checkout') || '',
    guests: params.get('guests') || '2',
    name: '', email: '', phone: '', message: '',
  })

  const update = k => e => setForm({ ...form, [k]: e.target.value })

  if (done) return <div className="page-shell">
    <Navbar />
    <main className="not-found">
      <div>
        <div className="brand" style={{ justifyContent: 'center', color: 'var(--green)' }}>
          <span className="brand-mark">L</span> LivingSpring
        </div>
        <Check size={44} color="var(--green)" style={{ margin: '30px auto 14px' }} />
        <h2>Your booking request is sent!</h2>
        <p>Thank you, {form.name || 'guest'}. We'll contact you at {form.email || form.phone || 'your provided details'} shortly to confirm your stay at LivingSpring Apartments.</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <Link to="/" className="button outline-button">Back home</Link>
          <button className="button primary-button" onClick={() => navigate('/#contact')}>Contact host</button>
        </div>
      </div>
    </main>
    <Footer />
  </div>

  return <div className="page-shell">
    <Navbar />
    <main className="container booking-page">
      <div className="booking-wrap">
        <button className="text-button" onClick={() => step === 1 ? navigate('/') : setStep(step - 1)}>
          <ArrowLeft size={14} /> Back
        </button>
        <div style={{ margin: '24px 0 20px' }}>
          <span className="eyebrow">Step {step} of 3</span>
          <h1 style={{ fontWeight: 500, letterSpacing: '-.05em', fontSize: 34, margin: '8px 0' }}>
            {step === 1 ? 'Your stay details' : step === 2 ? 'Your information' : 'Review & confirm'}
          </h1>
        </div>
        <div className="booking-step-bar"><div style={{ width: `${step * 33.33}%` }} /></div>

        <div className="booking-summary">
          <img src={property.gallery[0]} alt={property.name} />
          <div>
            <strong>{property.name}</strong>
            <span>{property.location}</span>
          </div>
        </div>

        <div className="booking-card-box">
          {step === 1 && <>
            <h2>When will you arrive?</h2>
            <p>Choose your check-in and check-out dates.</p>
            <div className="booking-fields">
              <div className="booking-field">
                <label>Check-in</label>
                <input type="date" value={form.checkin} onChange={update('checkin')} />
              </div>
              <div className="booking-field">
                <label>Check-out</label>
                <input type="date" value={form.checkout} onChange={update('checkout')} />
              </div>
            </div>
            <div className="guest-field">
              <label style={{ display: 'block', fontSize: 9, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', marginBottom: 4 }}>Guests</label>
              <select value={form.guests} onChange={update('guests')}>
                <option value="1">1 guest</option>
                <option value="2">2 guests</option>
                <option value="3">3 guests</option>
                <option value="4">4 guests</option>
              </select>
            </div>
          </>}
          {step === 2 && <>
            <h2>Tell us about yourself</h2>
            <p>We'll use this to confirm your booking.</p>
            <div className="form-group">
              <label>Full name</label>
              <input required value={form.name} onChange={update('name')} placeholder="Your full name" />
            </div>
            <div className="form-group">
              <label>Email address</label>
              <input required type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" />
            </div>
            <div className="form-group">
              <label>Phone number</label>
              <input required value={form.phone} onChange={update('phone')} placeholder="+233 ..." />
            </div>
          </>}
          {step === 3 && <>
            <h2>Review your booking</h2>
            <p>Please confirm the details below before sending your request.</p>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 2 }}>
              <p style={{ margin: '4px 0' }}><strong style={{ color: 'var(--ink)' }}>Dates:</strong> {form.checkin || '—'} to {form.checkout || '—'}</p>
              <p style={{ margin: '4px 0' }}><strong style={{ color: 'var(--ink)' }}>Guests:</strong> {form.guests}</p>
              <p style={{ margin: '4px 0' }}><strong style={{ color: 'var(--ink)' }}>Name:</strong> {form.name || '—'}</p>
              <p style={{ margin: '4px 0' }}><strong style={{ color: 'var(--ink)' }}>Email:</strong> {form.email || '—'}</p>
              <p style={{ margin: '4px 0' }}><strong style={{ color: 'var(--ink)' }}>Phone:</strong> {form.phone || '—'}</p>
            </div>
            <div style={{ background: 'var(--green-light)', padding: 14, borderRadius: 7, color: 'var(--green-dark)', fontSize: 12, display: 'flex', gap: 9, marginTop: 16 }}>
              <ShieldCheck size={16} /> Price is not yet set. The host will confirm pricing with you directly before payment.
            </div>
          </>}
          <button className="button primary-button full-button" style={{ marginTop: 24 }} onClick={() => step < 3 ? setStep(step + 1) : setDone(true)}>
            {step < 3 ? 'Continue' : 'Send booking request'} <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </main>
    <Footer />
  </div>
}

function AuthPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
    setLoading(false)
    if (result.error) setError(result.error.message)
    else navigate('/')
  }

  return <div className="auth-page">
    <div className="auth-visual">
      <img src={property.heroImage} alt="LivingSpring Apartments" />
      <div className="auth-quote">
        <Link to="/" className="brand"><span className="brand-mark">L</span> LivingSpring</Link>
        <h1>Peace, comfort,<br />and a warm welcome.</h1>
        <p>Create an account to save your booking details and get updates about your stay.</p>
      </div>
    </div>
    <div className="auth-panel">
      <form className="auth-form" onSubmit={submit}>
        <Link to="/" className="brand" style={{ color: 'var(--green)' }}><span className="brand-mark">L</span> LivingSpring</Link>
        <h2>{mode === 'login' ? 'Welcome back' : 'Create an account'}</h2>
        <p>{mode === 'login' ? 'Sign in to manage your bookings.' : 'Join to book your stay at LivingSpring Apartments.'}</p>
        {error && <div className="form-error">{error}</div>}
        {mode === 'register' && (
          <div className="form-group">
            <label>Full name</label>
            <input required value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          </div>
        )}
        <div className="form-group">
          <label>Email address</label>
          <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input required type="password" minLength="6" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" />
        </div>
        <button className="button primary-button full-button" disabled={loading}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={15} />
        </button>
        <div className="auth-switch">
          {mode === 'login' ? 'New here?' : 'Already have an account?'}{' '}
          <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>
            {mode === 'login' ? 'Create an account' : 'Sign in'}
          </button>
        </div>
      </form>
    </div>
  </div>
}

function NotFound() {
  return <div className="page-shell">
    <Navbar />
    <main className="not-found">
      <div>
        <h1>404</h1>
        <h2>This page seems to have moved.</h2>
        <p>Let's get you back to LivingSpring Apartments.</p>
        <Link to="/" className="button primary-button">Back home</Link>
      </div>
    </main>
    <Footer />
  </div>
}

export default function App() {
  return <BrowserRouter>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/booking" element={<BookingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
}
