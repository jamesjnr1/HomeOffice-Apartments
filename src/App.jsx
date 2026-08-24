import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Apartments from './pages/Apartments';
import Gardens from './pages/Gardens';
import Gallery from './pages/Gallery';
import About from './pages/About';
import Book from './pages/Book';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import NotFound from './pages/NotFound';
import { useReveal } from './lib/useReveal';

// Dashboard (guest area)
import DashboardLayout from './pages/dashboard/DashboardLayout';
import Overview from './pages/dashboard/Overview';
import Bookings from './pages/dashboard/Bookings';
import Wishlist from './pages/dashboard/Wishlist';
import Messages from './pages/dashboard/Messages';
import Profile from './pages/dashboard/Profile';

export default function App() {
  useReveal();
  return (
    <>
      <Header />
      <main>
        <Routes>
          {/* Public site */}
          <Route path="/" element={<Home />} />
          <Route path="/apartments" element={<Apartments />} />
          <Route path="/gardens" element={<Gardens />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/about" element={<About />} />
          <Route path="/book" element={<Book />} />

          {/* Auth */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          {/* Alias — DashboardLayout redirects unauthed users to /login */}
          <Route path="/login" element={<SignIn />} />

          {/* Dashboard (auth-gated inside layout) */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Overview />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="messages" element={<Messages />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
