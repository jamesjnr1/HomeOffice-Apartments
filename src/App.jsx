import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import PageTransition from './components/PageTransition';
import SmoothScroll from './lib/SmoothScroll';
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

// Dashboard
import DashboardLayout from './pages/dashboard/DashboardLayout';
import Overview from './pages/dashboard/Overview';
import Bookings from './pages/dashboard/Bookings';
import Wishlist from './pages/dashboard/Wishlist';
import Messages from './pages/dashboard/Messages';
import Profile from './pages/dashboard/Profile';

function AppContent() {
  useReveal();
  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/apartments" element={<Apartments />} />
          <Route path="/gardens" element={<Gardens />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/about" element={<About />} />
          <Route path="/book" element={<Book />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<SignIn />} />
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
