import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import PageTransition from './components/PageTransition';
import AccessibilityWidget from './components/AccessibilityWidget';
import VisitTracker from './components/VisitTracker';
import { useReveal } from './lib/useReveal';
import { usePageMeta } from './lib/usePageMeta';

// Public pages people land on are in the main bundle; everything else
// (booking, sign-in, the guest dashboard and the admin console) is split
// into its own file and fetched only when someone opens it, so the first
// visit downloads far less JavaScript.
import Home from './pages/Home';
import Apartments from './pages/Apartments';
import Gallery from './pages/Gallery';
import About from './pages/About';
import NotFound from './pages/NotFound';

const Book = lazy(() => import('./pages/Book'));
const PaymentComplete = lazy(() => import('./pages/PaymentComplete'));

// Auth
const SignIn = lazy(() => import('./pages/SignIn'));
const SignUp = lazy(() => import('./pages/SignUp'));

// Guest dashboard
const DashboardLayout = lazy(() => import('./pages/dashboard/DashboardLayout'));
const Overview = lazy(() => import('./pages/dashboard/Overview'));
const Bookings = lazy(() => import('./pages/dashboard/Bookings'));
const Messages = lazy(() => import('./pages/dashboard/Messages'));
const Profile = lazy(() => import('./pages/dashboard/Profile'));

// Admin dashboard — one chunk for the whole console
const admin = (name) => lazy(() => import('./pages/admin').then((m) => ({ default: m[name] })));
const AdminSignIn = admin('AdminSignIn');
const AdminLayout = admin('AdminLayout');
const AdminOverview = admin('AdminOverview');
const AdminEnquiries = admin('AdminEnquiries');
const AdminBookings = admin('AdminBookings');
const AdminGuests = admin('AdminGuests');
const AdminGuestDetail = admin('AdminGuestDetail');
const AdminReviews = admin('AdminReviews');
const AdminMessages = admin('AdminMessages');
const AdminRates = admin('AdminRates');
const AdminRevenue = admin('AdminRevenue');
const AdminAnalytics = admin('AdminAnalytics');
const AdminSettings = admin('AdminSettings');

function AppContent() {
  useReveal();
  usePageMeta();
  return (
    <>
      <Header />
      <main>
        <Suspense fallback={null}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/apartments" element={<Apartments />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/about" element={<About />} />
          <Route path="/book" element={<Book />} />
          <Route path="/payment/complete" element={<PaymentComplete />} />

          {/* Auth */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<SignIn />} />

          {/* Guest dashboard */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Overview />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="messages" element={<Messages />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Admin dashboard */}
          <Route path="/admin/signin" element={<AdminSignIn />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="enquiries" element={<AdminEnquiries />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="guests" element={<AdminGuests />} />
            <Route path="guests/:id" element={<AdminGuestDetail />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="rates" element={<AdminRates />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="revenue" element={<AdminRevenue />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </main>
      <Footer />
      <PageTransition />
      <AccessibilityWidget />
      <VisitTracker />
    </>
  );
}

export default function App() {
  return (
    <AppContent />
  );
}
