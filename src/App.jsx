import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import PageTransition from './components/PageTransition';
import SmoothScroll from './lib/SmoothScroll';
import { useReveal } from './lib/useReveal';

// Public pages
import Home from './pages/Home';
import Apartments from './pages/Apartments';
import Gallery from './pages/Gallery';
import About from './pages/About';
import Book from './pages/Book';

// Auth
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import NotFound from './pages/NotFound';

// Guest dashboard
import DashboardLayout from './pages/dashboard/DashboardLayout';
import Overview from './pages/dashboard/Overview';
import Bookings from './pages/dashboard/Bookings';
import Wishlist from './pages/dashboard/Wishlist';
import Messages from './pages/dashboard/Messages';
import Profile from './pages/dashboard/Profile';

// Admin dashboard
import {
  AdminSignIn,
  AdminLayout,
  AdminOverview,
  AdminEnquiries,
  AdminBookings,
  AdminGuests,
  AdminMessages,
  AdminRates,
  AdminRevenue,
  AdminSettings,
} from './pages/admin';

function AppContent() {
  useReveal();
  return (
    <>
      <Header />
      <main>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/apartments" element={<Apartments />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/about" element={<About />} />
          <Route path="/book" element={<Book />} />

          {/* Auth */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<SignIn />} />

          {/* Guest dashboard */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Overview />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="wishlist" element={<Wishlist />} />
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
            <Route path="messages" element={<AdminMessages />} />
            <Route path="rates" element={<AdminRates />} />
            <Route path="revenue" element={<AdminRevenue />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <PageTransition />
    </>
  );
}

export default function App() {
  return (
    <SmoothScroll>
      <AppContent />
    </SmoothScroll>
  );
}
